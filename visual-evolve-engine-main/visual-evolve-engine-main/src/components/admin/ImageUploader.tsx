import React, { useState, useRef } from "react";
import { Loader2, X, ArrowLeft, ArrowRight, UploadCloud, Replace } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, deleteUploadedFile } from "@/lib/storeApi";

export type ImageItem = { url: string; uploadId?: string };

type ImageUploaderProps = {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  label?: string;
  disabled?: boolean;
  folder?: string;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadProgressChange?: (progress: number) => void;
};

export function ImageUploader({
  images,
  onChange,
  maxImages = 1,
  label = "Ảnh",
  disabled = false,
  folder,
  onUploadingChange,
  onUploadProgressChange,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const setUploadingState = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  const setProgressState = (progress: number) => {
    setUploadProgress(progress);
    onUploadProgressChange?.(progress);
  };

  const isValidType = (file: File) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif", "jfif", "avif", "bmp", "svg"];
    const fileType = (file.type || "").toLowerCase();
    return allowedExts.includes(ext) || fileType.startsWith("image/");
  };

  const uploadFiles = async (files: File[], replacementAt: number | null) => {
    const newImages = [...images];
    let completed = 0;
    let failures = 0;
    let lastErrMsg = "";

    setUploadingState(true);
    setProgressState(0);

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      try {
        const uploaded = await uploadImage(file, folder);
        if (replacementAt !== null) {
          const previous = newImages[replacementAt];
          if (previous?.uploadId) {
            await deleteUploadedFile(previous.uploadId).catch(() => undefined);
          }
          newImages[replacementAt] = { url: uploaded.url, uploadId: uploaded.id };
        } else {
          newImages.push({ url: uploaded.url, uploadId: uploaded.id });
        }
      } catch (err: any) {
        failures += 1;
        lastErrMsg = err?.message || "";
      } finally {
        completed += 1;
        setProgressState(Math.round((completed / files.length) * 100));
      }
    }

    if (failures === files.length) {
      toast.error(lastErrMsg || "Tải ảnh thất bại");
    } else if (failures > 0) {
      onChange(newImages);
      toast.error(`${failures} ảnh tải lên thất bại. Các ảnh còn lại đã được giữ lại.`);
    } else {
      onChange(newImages);
      toast.success("Tải ảnh lên thành công");
    }

    setUploadingState(false);
    setProgressState(0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      return;
    }

    const invalidFiles = files.filter((file) => !isValidType(file));
    if (invalidFiles.length > 0) {
      toast.error("Chỉ hỗ trợ ảnh jpg, jpeg, png, webp");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (images.length + files.length > maxImages) {
      toast.error(`Chỉ được tải lên tối đa ${maxImages} ảnh.`);
      return;
    }

    await uploadFiles(files, null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReplaceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const index = replaceIndex;

    if (!files.length || index === null) {
      setReplaceIndex(null);
      return;
    }

    const file = files[0];
    if (!isValidType(file)) {
      toast.error("Chỉ hỗ trợ ảnh jpg, jpeg, png, webp");
      if (replaceInputRef.current) replaceInputRef.current.value = "";
      setReplaceIndex(null);
      return;
    }

    await uploadFiles([file], index);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    setReplaceIndex(null);
  };

  const handleRemove = async (index: number) => {
    const img = images[index];
    if (img.uploadId) {
      try {
        await deleteUploadedFile(img.uploadId);
      } catch (error) {
        console.error("Failed to delete from server:", error);
      }
    }
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const newImages = [...images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    onChange(newImages);
  };

  const requestReplace = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>

      {isUploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Đang tải ảnh...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        {images.map((img, index) => (
          <div
            key={index}
            className="relative group w-24 h-24 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50"
          >
            <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />

            {maxImages > 1 && index === 0 && (
              <div className="absolute top-0 left-0 bg-brand text-white text-[10px] px-1 py-0.5 rounded-br-lg z-10">
                Thumbnail
              </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 z-20">
              <button
                type="button"
                onClick={() => requestReplace(index)}
                className="text-white hover:text-brand transition-colors"
                disabled={disabled || isUploading}
                title="Thay ảnh"
              >
                <Replace size={16} />
              </button>
              {maxImages > 1 && index > 0 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  className="text-white hover:text-brand transition-colors"
                  disabled={disabled || isUploading}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-white hover:text-red-500 transition-colors"
                disabled={disabled || isUploading}
              >
                <X size={16} />
              </button>
              {maxImages > 1 && index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  className="text-white hover:text-brand transition-colors"
                  disabled={disabled || isUploading}
                >
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:bg-zinc-50 hover:border-brand hover:text-brand transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <UploadCloud size={24} />
                <span className="text-xs">Tải lên</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxImages > 1}
      />

      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceChange}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
      />
    </div>
  );
}
