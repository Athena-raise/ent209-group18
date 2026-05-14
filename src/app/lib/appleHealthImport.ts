import type { ActivityData, HealthRecord, SleepData, StepData, WeightData } from "../../store/useHealthStore";

type ImportableRecord = Omit<HealthRecord, "id">;

export interface AppleHealthImportResult {
  records: ImportableRecord[];
  summary: {
    sleep: number;
    weight: number;
    workouts: number;
    stepDays: number;
  };
}

export type AppleHealthImportWindow = "7d" | "30d" | "all";

interface AppleHealthAccumulator {
  records: ImportableRecord[];
  summary: AppleHealthImportResult["summary"];
  stepTotalsByDay: Map<string, number>;
  sawHealthDataShell: boolean;
  cutoffDate: Date | null;
}

function decodeXmlEntities(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function parseTagAttributes(tagSource: string) {
  const attributes = new Map<string, string>();
  const attributePattern = /([A-Za-z_:][\w:.-]*)=(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null = null;

  while ((match = attributePattern.exec(tagSource)) !== null) {
    const [, name, doubleQuotedValue, singleQuotedValue] = match;
    attributes.set(name, decodeXmlEntities(doubleQuotedValue ?? singleQuotedValue ?? ""));
  }

  return attributes;
}

function getCutoffDate(window: AppleHealthImportWindow) {
  if (window === "all") {
    return null;
  }

  const days = window === "7d" ? 7 : 30;
  const cutoffDate = new Date();
  cutoffDate.setHours(0, 0, 0, 0);
  cutoffDate.setDate(cutoffDate.getDate() - (days - 1));
  return cutoffDate;
}

function createAccumulator(window: AppleHealthImportWindow = "all"): AppleHealthAccumulator {
  return {
    records: [],
    summary: {
      sleep: 0,
      weight: 0,
      workouts: 0,
      stepDays: 0,
    },
    stepTotalsByDay: new Map<string, number>(),
    sawHealthDataShell: false,
    cutoffDate: getCutoffDate(window),
  };
}

function isWithinImportWindow(date: Date | null, accumulator: AppleHealthAccumulator) {
  if (!date) {
    return false;
  }

  if (!accumulator.cutoffDate) {
    return true;
  }

  return date >= accumulator.cutoffDate;
}

function ingestRecordTag(attributes: Map<string, string>, accumulator: AppleHealthAccumulator) {
  const type = attributes.get("type") ?? null;
  const startDate = parseAppleHealthDate(attributes.get("startDate") ?? null);
  const endDate = parseAppleHealthDate(attributes.get("endDate") ?? null);
  const value = Number(attributes.get("value"));

  accumulator.sawHealthDataShell = true;

  if (type === "HKCategoryTypeIdentifierSleepAnalysis") {
    const sleepValue = attributes.get("value");
    if (!sleepValue?.includes("Asleep") || !startDate || !endDate) {
      return;
    }
    if (!isWithinImportWindow(endDate, accumulator)) {
      return;
    }

    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (durationHours <= 0) {
      return;
    }

    const data: SleepData = {
      bedtime: formatTime(startDate),
      wakeTime: formatTime(endDate),
      duration: Number(durationHours.toFixed(1)),
    };

    accumulator.records.push({
      type: "sleep",
      timestamp: toIsoString(endDate),
      data,
      source: "apple_health_import",
    });
    accumulator.summary.sleep += 1;
    return;
  }

  if (type === "HKQuantityTypeIdentifierBodyMass" && startDate && Number.isFinite(value)) {
    if (!isWithinImportWindow(startDate, accumulator)) {
      return;
    }
    const data: WeightData = {
      value: Number(convertWeightToKg(value, attributes.get("unit") ?? null).toFixed(1)),
    };

    accumulator.records.push({
      type: "weight",
      timestamp: toIsoString(startDate),
      data,
      source: "apple_health_import",
    });
    accumulator.summary.weight += 1;
    return;
  }

  if (type === "HKQuantityTypeIdentifierStepCount" && startDate && Number.isFinite(value)) {
    if (!isWithinImportWindow(startDate, accumulator)) {
      return;
    }
    const dayKey = toIsoString(startDate).slice(0, 10);
    accumulator.stepTotalsByDay.set(dayKey, (accumulator.stepTotalsByDay.get(dayKey) ?? 0) + value);
  }
}

function ingestWorkoutTag(attributes: Map<string, string>, accumulator: AppleHealthAccumulator) {
  const startDate = parseAppleHealthDate(attributes.get("startDate") ?? null);
  if (!startDate) {
    return;
  }
  if (!isWithinImportWindow(startDate, accumulator)) {
    return;
  }

  accumulator.sawHealthDataShell = true;

  const duration = Number(attributes.get("duration"));
  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }

  const totalDistance = Number(attributes.get("totalDistance"));
  const totalEnergyBurned = Number(attributes.get("totalEnergyBurned"));

  const data: ActivityData = {
    subtype: mapWorkoutSubtype(attributes.get("workoutActivityType") ?? null),
    duration: Math.round(convertDurationToMinutes(duration, attributes.get("durationUnit") ?? null)),
    distance: Number.isFinite(totalDistance)
      ? Number(convertDistanceToKm(totalDistance, attributes.get("totalDistanceUnit") ?? null).toFixed(2))
      : undefined,
    calories: Number.isFinite(totalEnergyBurned) ? Math.round(totalEnergyBurned) : undefined,
  };

  accumulator.records.push({
    type: "activity",
    timestamp: toIsoString(startDate),
    data,
    source: "apple_health_import",
  });
  accumulator.summary.workouts += 1;
}

function finalizeAccumulator(accumulator: AppleHealthAccumulator): AppleHealthImportResult {
  for (const [dayKey, count] of accumulator.stepTotalsByDay.entries()) {
    if (count <= 0) {
      continue;
    }

    const data: StepData = {
      count: Math.round(count),
    };

    accumulator.records.push({
      type: "steps",
      timestamp: new Date(`${dayKey}T12:00:00.000Z`).toISOString(),
      data,
      source: "apple_health_import",
    });
    accumulator.summary.stepDays += 1;
  }

  accumulator.records.sort((left, right) => right.timestamp.localeCompare(left.timestamp));

  if (accumulator.records.length === 0) {
    if (!accumulator.sawHealthDataShell) {
      throw new Error("The uploaded file does not contain Apple Health records. Use the `export.xml` file from Apple Health.");
    }

    throw new Error("The file loaded, but no supported sleep, weight, workout, or step records were found in this export.");
  }

  return {
    records: accumulator.records,
    summary: accumulator.summary,
  };
}

function parseAppleHealthDate(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  const normalized = rawValue
    .replace(" ", "T")
    .replace(/ ([+-]\d{2})(\d{2})$/, "$1:$2");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoString(date: Date) {
  return date.toISOString();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function convertWeightToKg(value: number, unit: string | null) {
  if (!unit || unit === "kg") {
    return value;
  }
  if (unit === "lb") {
    return value * 0.45359237;
  }
  return value;
}

function convertDistanceToKm(value: number, unit: string | null) {
  if (!unit || unit === "km") {
    return value;
  }
  if (unit === "m") {
    return value / 1000;
  }
  if (unit === "mi") {
    return value * 1.60934;
  }
  return value;
}

function convertDurationToMinutes(value: number, unit: string | null) {
  if (!unit || unit === "min") {
    return value;
  }
  if (unit === "h" || unit === "hr") {
    return value * 60;
  }
  if (unit === "s" || unit === "sec") {
    return value / 60;
  }
  return value;
}

function mapWorkoutSubtype(workoutType: string | null): ActivityData["subtype"] {
  if (!workoutType) {
    return "other";
  }

  if (workoutType.includes("Running")) {
    return "run";
  }
  if (workoutType.includes("Walking") || workoutType.includes("Hiking")) {
    return "walk";
  }
  if (
    workoutType.includes("TraditionalStrengthTraining") ||
    workoutType.includes("FunctionalStrengthTraining") ||
    workoutType.includes("CrossTraining") ||
    workoutType.includes("CoreTraining")
  ) {
    return "gym";
  }
  return "other";
}

export function parseAppleHealthExport(
  xmlText: string,
  window: AppleHealthImportWindow = "all",
): AppleHealthImportResult {
  const normalizedXmlText = xmlText.replace(/^\uFEFF/, "").trim();
  const accumulator = createAccumulator(window);

  const recordTagPattern = /<Record\b[^>]*\/?>/g;
  let recordMatch: RegExpExecArray | null = null;

  while ((recordMatch = recordTagPattern.exec(normalizedXmlText)) !== null) {
    ingestRecordTag(parseTagAttributes(recordMatch[0]), accumulator);
  }

  const workoutTagPattern = /<Workout\b[^>]*?(?:\/>|>[\s\S]*?<\/Workout>)/g;
  let workoutMatch: RegExpExecArray | null = null;

  while ((workoutMatch = workoutTagPattern.exec(normalizedXmlText)) !== null) {
    ingestWorkoutTag(parseTagAttributes(workoutMatch[0]), accumulator);
  }

  accumulator.sawHealthDataShell =
    accumulator.sawHealthDataShell ||
    normalizedXmlText.includes("<HealthData") ||
    normalizedXmlText.includes("<Record") ||
    normalizedXmlText.includes("<Workout");

  return finalizeAccumulator(accumulator);
}

export async function parseAppleHealthExportFile(
  file: File,
  window: AppleHealthImportWindow = "all",
): Promise<AppleHealthImportResult> {
  const accumulator = createAccumulator(window);
  const decoder = new TextDecoder();
  const reader = file.stream().getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let offset = 0;

    while (true) {
      const recordStart = buffer.indexOf("<Record", offset);
      const workoutStart = buffer.indexOf("<Workout", offset);
      const healthDataStart = buffer.indexOf("<HealthData", offset);

      const candidates = [recordStart, workoutStart, healthDataStart].filter((index) => index >= 0);
      if (candidates.length === 0) {
        break;
      }

      const nextStart = Math.min(...candidates);
      const tagEnd = buffer.indexOf(">", nextStart);

      if (tagEnd === -1) {
        offset = nextStart;
        break;
      }

      const tagSource = buffer.slice(nextStart, tagEnd + 1);

      if (tagSource.startsWith("<HealthData")) {
        accumulator.sawHealthDataShell = true;
      } else if (tagSource.startsWith("<Record")) {
        ingestRecordTag(parseTagAttributes(tagSource), accumulator);
      } else if (tagSource.startsWith("<Workout")) {
        ingestWorkoutTag(parseTagAttributes(tagSource), accumulator);
      }

      offset = tagEnd + 1;
    }

    buffer = buffer.slice(offset);
  }

  buffer += decoder.decode();
  accumulator.sawHealthDataShell =
    accumulator.sawHealthDataShell ||
    buffer.includes("<HealthData") ||
    buffer.includes("<Record") ||
    buffer.includes("<Workout");

  return finalizeAccumulator(accumulator);
}
