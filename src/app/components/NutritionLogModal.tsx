import { useEffect, useRef, useState } from "react";
import { Apple, Barcode, Camera, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { AnimatePresence, motion } from "motion/react";
import { analyzeBarcodeNutritionRequest, analyzeNutritionRequest } from "../lib/nutritionApi";
import type { NutritionData } from "../../store/useHealthStore";

interface NutritionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NutritionData) => void;
}

const MEAL_OPTIONS: NutritionData["meal"][] = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_LABELS: Record<NutritionData["meal"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MAX_IMAGE_DIMENSION = 1280;
const COMPRESSED_IMAGE_TYPE = "image/jpeg";
const COMPRESSED_IMAGE_QUALITY = 0.72;
const MAX_BASE64_SIZE_BYTES = 3.5 * 1024 * 1024;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to decode image."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to compress image."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

async function compressImage(file: File) {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, COMPRESSED_IMAGE_TYPE, COMPRESSED_IMAGE_QUALITY);
  const previewUrl = URL.createObjectURL(blob);
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read compressed image."));
        return;
      }

      const [, encoded = ""] = result.split(",");
      resolve(encoded);
    };

    reader.onerror = () => reject(new Error("Unable to read compressed image."));
    reader.readAsDataURL(blob);
  });

  return {
    base64,
    mimeType: COMPRESSED_IMAGE_TYPE,
    previewUrl,
    sizeBytes: blob.size,
  };
}

async function detectBarcodeWithNativeApi(file: File) {
  const BarcodeDetectorCtor = (window as unknown as {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
    };
  }).BarcodeDetector;

  if (!BarcodeDetectorCtor) {
    return "";
  }

  const bitmap = await createImageBitmap(file);
  const detector = new BarcodeDetectorCtor({
    formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
  });
  const results = await detector.detect(bitmap);
  return results[0]?.rawValue?.replace(/\D/g, "") || "";
}

async function detectBarcodeWithZxing(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(objectUrl);
    return result.getText().replace(/\D/g, "");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function detectBarcodeFromImage(file: File) {
  const nativeBarcode = await detectBarcodeWithNativeApi(file).catch(() => "");

  if (nativeBarcode) {
    return nativeBarcode;
  }

  return detectBarcodeWithZxing(file);
}

export function NutritionLogModal({ isOpen, onClose, onSave }: NutritionLogModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const [meal, setMeal] = useState<NutritionData["meal"]>("snack");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBarcodeAnalyzing, setIsBarcodeAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMeal("snack");
    setDescription("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setBalanceNote("");
    setBarcode("");
    setImageBase64(null);
    setImageMimeType(null);
    setImageName(null);
    setImagePreviewUrl(null);
    setIsAnalyzing(false);
    setIsBarcodeAnalyzing(false);
    setError("");
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handlePickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);

      if (compressed.sizeBytes > MAX_BASE64_SIZE_BYTES) {
        throw new Error("Image is still too large after compression. Try a closer or smaller photo.");
      }

      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }

      setImageBase64(compressed.base64);
      setImageMimeType(compressed.mimeType);
      setImageName(file.name);
      setImagePreviewUrl(compressed.previewUrl);
      setError("");
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Unable to load image.");
    } finally {
      event.target.value = "";
    }
  };

  const applyNutritionResult = (result: Awaited<ReturnType<typeof analyzeNutritionRequest>>) => {
    setCalories(String(result.calories));
    setProtein(result.protein !== undefined ? String(result.protein) : "");
    setCarbs(result.carbs !== undefined ? String(result.carbs) : "");
    setFat(result.fat !== undefined ? String(result.fat) : "");
    if (!description.trim()) {
      setDescription(result.description);
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim() && !imageBase64) {
      setError("Add a meal description or upload a food photo first.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const result = await analyzeNutritionRequest({
        text: description.trim() || undefined,
        image: imageBase64 || undefined,
        mimeType: imageMimeType || undefined,
      });

      applyNutritionResult(result);
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Unable to estimate calories.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBarcodeLookup = async (rawBarcode = barcode) => {
    const normalizedBarcode = rawBarcode.replace(/\D/g, "");

    if (!normalizedBarcode) {
      setError("Scan or enter a barcode first.");
      return;
    }

    setBarcode(normalizedBarcode);
    setIsBarcodeAnalyzing(true);
    setError("");

    try {
      const result = await analyzeBarcodeNutritionRequest({ barcode: normalizedBarcode });
      applyNutritionResult(result);
    } catch (barcodeError) {
      setError(barcodeError instanceof Error ? barcodeError.message : "Unable to find this barcode.");
    } finally {
      setIsBarcodeAnalyzing(false);
    }
  };

  const handleBarcodeImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const detectedBarcode = await detectBarcodeFromImage(file);

      if (!detectedBarcode) {
        throw new Error("No barcode found. Try a clearer barcode photo or enter it manually.");
      }

      await handleBarcodeLookup(detectedBarcode);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Unable to scan barcode.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = () => {
    const parsedCalories = Math.round(Number(calories));
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError("Please enter what you ate.");
      return;
    }

    if (!Number.isFinite(parsedCalories) || parsedCalories <= 0) {
      setError("Please estimate calories first, or enter a reasonable calorie value.");
      return;
    }

    onSave({
      meal,
      description: trimmedDescription,
      calories: parsedCalories,
      protein: protein ? Math.max(0, Math.round(Number(protein))) : undefined,
      carbs: carbs ? Math.max(0, Math.round(Number(carbs))) : undefined,
      fat: fat ? Math.max(0, Math.round(Number(fat))) : undefined,
      balanceNote: balanceNote.trim() || undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-[32px] bg-white px-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#F4C97E25] flex items-center justify-center">
                  <Apple className="w-5 h-5 text-[#C78B18]" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-black tracking-tight leading-none">Log Meal</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-black/50" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider block">
                    Food photo
                  </label>
                  {imageName && <span className="text-[12px] text-black/40">{imageName}</span>}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePickImage}
                />
                <input
                  ref={barcodeInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleBarcodeImage}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[82px] rounded-[20px] border border-dashed border-black/[0.08] bg-[#FBFAF6] px-4 flex items-center justify-center gap-3 text-left"
                >
                  {imagePreviewUrl ? (
                    <div className="flex items-center gap-3 w-full">
                      <img
                        src={imagePreviewUrl}
                        alt="Meal preview"
                        className="w-16 h-16 rounded-[14px] object-cover border border-black/[0.06]"
                      />
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-black">Photo ready</p>
                        <p className="text-[13px] text-black/45">Tap to replace image</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-[14px] bg-[#F4C97E25] flex items-center justify-center">
                        <Camera className="w-5 h-5 text-[#C78B18]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-black">
                          Upload or take a food photo
                        </p>
                      </div>
                      <Upload className="w-4 h-4 text-black/35" />
                    </>
                  )}
                </button>

                <div className="mt-3 h-[82px] rounded-[20px] border border-dashed border-black/[0.08] bg-[#FBFAF6] px-4 flex items-center">
                  <div className="flex w-full items-center gap-3">
                    <button
                      type="button"
                      onClick={() => barcodeInputRef.current?.click()}
                      disabled={isBarcodeAnalyzing}
                      className="h-11 w-11 flex-shrink-0 rounded-[14px] bg-[#F4C97E25] text-[#C78B18] inline-flex items-center justify-center disabled:opacity-50"
                      aria-label="Scan barcode"
                    >
                      {isBarcodeAnalyzing ? (
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                      ) : (
                        <Barcode className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      value={barcode}
                      onChange={(event) => setBarcode(event.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      className="h-12 min-w-0 flex-1 rounded-[16px] bg-[#F5F5F7] px-4 text-[15px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#F4C97E]/40"
                      placeholder="Barcode number"
                    />
                    <button
                      type="button"
                      onClick={() => handleBarcodeLookup()}
                      disabled={isBarcodeAnalyzing}
                      className="h-12 flex-shrink-0 rounded-[16px] bg-black px-5 text-[14px] font-semibold text-white disabled:opacity-50"
                    >
                      Lookup
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider mb-2 block">
                  Meal type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_OPTIONS.map((option) => {
                    const active = option === meal;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMeal(option)}
                        className={`h-12 rounded-[16px] border text-[15px] font-semibold tracking-tight transition-all ${
                          active
                            ? "border-[#F4C97E] bg-[#F4C97E] text-black"
                            : "border-black/[0.06] bg-[#F5F5F7] text-black/70"
                        }`}
                      >
                        {MEAL_LABELS[option]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider mb-2 block">
                  Food description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full min-h-[120px] bg-[#F5F5F7] rounded-[16px] px-4 py-4 text-[16px] text-black outline-none focus:ring-2 focus:ring-[#F4C97E]/40 transition-all resize-none"
                  placeholder="e.g. chicken rice with egg and a cup of milk tea"
                />
              </div>

              <div className="bg-[#FBFAF6] rounded-[20px] p-4 border border-[#F4C97E30]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[15px] font-semibold text-black">AI calorie estimate</p>
                    <p className="text-[13px] text-black/45">
                      Use text, photo, or both. You can edit the result before saving.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="h-11 px-4 rounded-[14px] bg-black text-white text-[14px] font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isAnalyzing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAnalyzing ? "Estimating" : "Estimate"}
                  </button>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-black/50 uppercase tracking-wider mb-2 block">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={calories}
                    onChange={(event) => setCalories(event.target.value)}
                    className="w-full h-14 bg-white rounded-[16px] px-4 text-[17px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#F4C97E]/40 transition-all border border-black/[0.05]"
                    placeholder="Estimate with AI or enter manually"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-black/45">Protein</span>
                    <input
                      type="number"
                      min="0"
                      value={protein}
                      onChange={(event) => setProtein(event.target.value)}
                      className="h-12 w-full rounded-[14px] border border-black/[0.05] bg-white px-3 text-[15px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#F4C97E]/40"
                      placeholder="g"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-black/45">Carbs</span>
                    <input
                      type="number"
                      min="0"
                      value={carbs}
                      onChange={(event) => setCarbs(event.target.value)}
                      className="h-12 w-full rounded-[14px] border border-black/[0.05] bg-white px-3 text-[15px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#F4C97E]/40"
                      placeholder="g"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-black/45">Fat</span>
                    <input
                      type="number"
                      min="0"
                      value={fat}
                      onChange={(event) => setFat(event.target.value)}
                      className="h-12 w-full rounded-[14px] border border-black/[0.05] bg-white px-3 text-[15px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#F4C97E]/40"
                      placeholder="g"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-black/50">
                    Balance note
                  </span>
                  <input
                    value={balanceNote}
                    onChange={(event) => setBalanceNote(event.target.value)}
                    className="h-12 w-full rounded-[14px] border border-black/[0.05] bg-white px-3 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#F4C97E]/40"
                    placeholder="e.g. meat and vegetables balanced"
                  />
                </label>
              </div>

              {error && (
                <div className="rounded-[16px] bg-[#FFF1F1] text-[#C44747] px-4 py-3 text-[14px] font-medium">
                  {error}
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="w-full h-14 bg-[#F4C97E] text-black rounded-[16px] text-[17px] font-bold tracking-tight"
            >
              Save Meal
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
