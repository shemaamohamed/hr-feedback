"use client";

import { useLinkPreview } from "./useLinkPreview";
import { Download, File } from "lucide-react";
import { useState, useEffect } from "react";

interface MessageContentProps {
  message: string;
  fileUrl?: string;
}

const MessageContent = ({ message, fileUrl }: MessageContentProps) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const urlMatch = message.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
  const url = urlMatch
    ? urlMatch[0].startsWith("http")
      ? urlMatch[0]
      : `https://${urlMatch[0]}`
    : null;

  const { meta } = useLinkPreview(url);

  // Helpers
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = (url: string) => /\.pdf$/i.test(url);
  const isExcel = (url: string) => /\.(xls|xlsx)$/i.test(url);
  const isWord = (url: string) => /\.(doc|docx)$/i.test(url);
  const isText = (url: string) => /\.txt$/i.test(url);

  // 🧠 Get Presigned URL
  const getPresignedUrl = async (fileName: string) => {
    const res = await fetch("/api/admin/get-presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    });
    const data = await res.json();
    return data.presignedUrl;
  };

  // 🖼️ Prepare preview
  useEffect(() => {
    if (fileUrl && fileUrl !== "") {
      (async () => {
        const presigned = await getPresignedUrl(fileUrl);
        setPreviewUrl(presigned);
        if (isImage(fileUrl)) setImageUrl(presigned);
      })();
    }
  }, [fileUrl]);
const handleDownload = async (e: React.MouseEvent) => {
  e.preventDefault();
  if (!fileUrl) return;

  setLoading(true);
  try {
    const res = await fetch("/api/admin/download-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: fileUrl }),
    });

    if (!res.ok) throw new Error("Failed to download file");

    const blob = await res.blob();
    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = decodeURIComponent(fileUrl.split("/").pop() || "file");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download file 😞");
  } finally {
    setLoading(false);
  }
};






  return (
    <div className="space-y-2 max-w-[300px] relative">
      {/* 🗂️ File Section */}
      {fileUrl && fileUrl !== "" && (
        <div className="border rounded-lg overflow-hidden relative p-2 bg-white shadow-sm">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={loading}
            className={`absolute top-2 right-2 bg-white text-gray-700 p-1 rounded-full shadow hover:bg-gray-100 z-10 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* 🖼️ Image */}
          {isImage(fileUrl) && imageUrl && (
            <div className="w-full h-40 relative rounded-lg overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <img
                src={imageUrl}
                alt="uploaded"
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </div>
          )}

          {/* 📄 PDF */}
          {isPDF(fileUrl) && previewUrl && (
            <iframe src={previewUrl} className="w-full h-60" title="PDF preview" />
          )}

          {/* 🧾 Word */}
          {isWord(fileUrl) && previewUrl && (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(
                previewUrl
              )}&embedded=true`}
              className="w-full h-60"
              title="Word preview"
            />
          )}

          {/* 📊 Excel */}
          {isExcel(fileUrl) && previewUrl && (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(
                previewUrl
              )}&embedded=true`}
              className="w-full h-60"
              title="Excel preview"
            />
          )}

          {/* 📝 Text */}
          {isText(fileUrl) && previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-40 bg-gray-50 border border-gray-200 text-sm"
              title="Text preview"
            />
          )}

          {/* 📁 Fallback */}
          {!isImage(fileUrl) &&
            !isPDF(fileUrl) &&
            !isExcel(fileUrl) &&
            !isWord(fileUrl) &&
            !isText(fileUrl) && (
              <div className="flex items-center justify-center gap-2 text-gray-700 p-4 bg-gray-200 rounded-lg">
                <File className="w-5 h-5 text-gray-500" />
                <span className="truncate text-sm">{fileUrl}</span>
              </div>
            )}
        </div>
      )}

      {/* 💬 Message Text */}
      <p className="whitespace-pre-wrap break-words">
        {message.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g).map((part, i) =>
          part.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/) ? (
            <a
              key={i}
              href={part.startsWith("http") ? part : `https://${part}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              {part}
            </a>
          ) : (
            part
          )
        )}
      </p>

      {/* 🔍 Link Preview */}
      {meta?.title && (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
          {meta.image && (
            <img
              src={meta.image}
              alt={meta.title}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-3">
            <h3 className="font-semibold text-gray-800 text-sm">{meta.title}</h3>
            {meta.description && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                {meta.description}
              </p>
            )}
            <a
              href={url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-xs mt-2 inline-block"
            >
              Visit site →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContent;
