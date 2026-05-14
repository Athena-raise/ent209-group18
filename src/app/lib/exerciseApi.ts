export interface ExerciseItem {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
  videoUrl: string;
  secondaryVideoUrl?: string;
  secondaryGifUrl?: string;
  secondaryMuscles: string[];
  instructions: string[];
  difficulty: string;
  force: string;
  mechanic: string;
}

export interface ExerciseCategory {
  value: string;
  label: string;
  count: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";
const USE_MOCK_EXERCISES = import.meta.env.VITE_USE_MOCK_EXERCISES === "true";

const mockCategories: ExerciseCategory[] = [
  { value: "band", label: "Band", count: 113 },
  { value: "barbell", label: "Barbell", count: 202 },
  { value: "bodyweight", label: "Bodyweight", count: 204 },
  { value: "bosu-ball", label: "Bosu-Ball", count: 31 },
  { value: "cables", label: "Cables", count: 161 },
  { value: "cardio", label: "Cardio", count: 48 },
  { value: "dumbbells", label: "Dumbbells", count: 299 },
  { value: "kettlebells", label: "Kettlebells", count: 167 },
  { value: "machine", label: "Machine", count: 89 },
  { value: "medicine-ball", label: "Medicine-Ball", count: 32 },
  { value: "medicineball", label: "Medicineball", count: 3 },
  { value: "pilates", label: "Pilates", count: 49 },
  { value: "plate", label: "Plate", count: 69 },
  { value: "recovery", label: "Recovery", count: 218 },
  { value: "smith-machine", label: "Smith-Machine", count: 34 },
  { value: "stretches", label: "Stretches", count: 52 },
  { value: "trx", label: "TRX", count: 31 },
  { value: "vitruvian", label: "Vitruvian", count: 25 },
  { value: "yoga", label: "Yoga", count: 75 },
];

const mockExercises: ExerciseItem[] = [
  {
    id: "mock-1",
    name: "controlled press",
    bodyPart: "Chest",
    target: "Chest",
    equipment: "Dumbbells",
    gifUrl: "",
    videoUrl: "",
    secondaryMuscles: ["Shoulders", "Triceps"],
    instructions: [
      "Set up with a stable base and keep the target muscle under control before starting the movement.",
      "Move through the full comfortable range while keeping the tempo smooth and deliberate.",
      "Pause briefly at the strongest contraction, then return without losing posture.",
      "Repeat for the planned reps and stop if technique begins to break down.",
    ],
    difficulty: "intermediate",
    force: "",
    mechanic: "",
  },
  {
    id: "mock-2",
    name: "supported strength raise",
    bodyPart: "Shoulders",
    target: "Shoulders",
    equipment: "Machine",
    gifUrl: "",
    videoUrl: "",
    secondaryMuscles: ["Traps"],
    instructions: [
      "Adjust the setup so the handles line up with the target joint.",
      "Brace your torso and start each rep from a still position.",
      "Lift with control and avoid using momentum.",
      "Lower slowly until the weight is fully controlled again.",
    ],
    difficulty: "beginner",
    force: "",
    mechanic: "",
  },
  {
    id: "mock-3",
    name: "steady cable pull",
    bodyPart: "Back",
    target: "Lats",
    equipment: "Cables",
    gifUrl: "",
    videoUrl: "",
    secondaryMuscles: ["Middle Back", "Biceps"],
    instructions: [
      "Stand tall with the cable path aligned to the working muscle.",
      "Pull by driving the elbow and keeping the shoulder controlled.",
      "Hold the finished position briefly without leaning back.",
      "Return the handle with a slow, even tempo.",
    ],
    difficulty: "intermediate",
    force: "",
    mechanic: "",
  },
];

export async function getExerciseCategories() {
  if (USE_MOCK_EXERCISES) {
    return mockCategories;
  }

  const response = await fetch(`${API_BASE_URL}/exercises/categories`);
  let payload: { categories?: ExerciseCategory[]; message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load exercise categories.");
  }

  return payload?.categories ?? [];
}

export async function searchExercises(input: {
  target: string;
  equipment?: string;
  gender?: "male" | "female";
  limit?: number;
}) {
  if (USE_MOCK_EXERCISES) {
    const equipmentLabel = mockCategories.find((category) => category.value === input.equipment)?.label ?? "All Equipment";
    return mockExercises.slice(0, input.limit ?? 12).map((exercise, index) => ({
      ...exercise,
      id: `${exercise.id}-${input.target}-${input.equipment || "all"}-${index}`,
      target: input.target,
      bodyPart: input.target,
      equipment: input.equipment && input.equipment !== "all" ? equipmentLabel : exercise.equipment,
    }));
  }

  const params = new URLSearchParams({
    target: input.target,
    limit: String(input.limit ?? 12),
  });

  if (input.equipment && input.equipment !== "all") {
    params.set("equipment", input.equipment);
  }

  if (input.gender) {
    params.set("gender", input.gender);
  }

  const response = await fetch(`${API_BASE_URL}/exercises/search?${params.toString()}`);
  let payload: { exercises?: ExerciseItem[]; message?: string } | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load exercises.");
  }

  return payload?.exercises ?? [];
}
