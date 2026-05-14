import { unzipSync, strFromU8 } from "fflate";
import {
  parseAppleHealthExport,
  parseAppleHealthExportFile,
  type AppleHealthImportResult,
  type AppleHealthImportWindow,
} from "../lib/appleHealthImport";
// parseAppleHealthExport is used for ZIP path (already in memory); XML always streams

type WorkerRequest = {
  file: File;
  window: AppleHealthImportWindow;
};

type WorkerSuccess = {
  ok: true;
  result: AppleHealthImportResult;
};

type WorkerFailure = {
  ok: false;
  error: string;
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const { file, window } = event.data;
    const lowerName = file.name.toLowerCase();
    let result: AppleHealthImportResult;

    if (lowerName.endsWith(".zip")) {
      const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
      const exportXmlEntry = Object.entries(archive).find(([entryName]) => entryName.toLowerCase().endsWith("export.xml"));

      if (!exportXmlEntry) {
        throw new Error("No export.xml file was found inside this ZIP archive.");
      }

      result = parseAppleHealthExport(strFromU8(exportXmlEntry[1]), window);
    } else {
      result = await parseAppleHealthExportFile(file, window);
    }

    const response: WorkerSuccess = {
      ok: true,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerFailure = {
      ok: false,
      error: error instanceof Error ? error.message : "Apple Health import failed.",
    };

    self.postMessage(response);
  }
};
