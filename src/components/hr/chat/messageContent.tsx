import { useLinkPreview } from "./useLinkPreview";
import { Download } from "lucide-react";

interface MessageContentProps {
  message: string;
  fileUrl?: string;
}

const MessageContent = ({ message, fileUrl }: MessageContentProps) => {
  const urlMatch = message.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
  const url = urlMatch ? (urlMatch[0].startsWith("http") ? urlMatch[0] : `https://${urlMatch[0]}`) : null;
  const { meta } = useLinkPreview(url);

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = (url: string) => /\.pdf$/i.test(url);
  const isExcel = (url: string) => /\.(xls|xlsx)$/i.test(url);
  const isWord = (url: string) => /\.(doc|docx)$/i.test(url);
  const isText = (url: string) => /\.txt$/i.test(url);

  const downloadFile = async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getFileName = (url: string) => {
    return url.split("/").pop() || "file";
  };

  return (
    <div className="space-y-2 max-w-[300px] relative">
      {fileUrl && (
        <>
        <div className="border rounded-lg overflow-hidden relative p-2">
          {/* أيقونة تحميل */}
          <button
            onClick={async (e) => {
              e.preventDefault();
              await downloadFile(fileUrl, getFileName(fileUrl));
            }}
            className="absolute top-2 right-2 bg-white text-gray-700 p-1 rounded-full shadow hover:bg-gray-100 z-10"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* عرض الملف حسب نوعه */}
          {isImage(fileUrl) && (
            <img
              src={fileUrl}
              alt="uploaded file"
              className="w-full h-40 object-cover rounded-lg"
            />
          )}
          {isPDF(fileUrl) && (
            <iframe
              src={fileUrl}
              className="w-full h-60"
              title="PDF Preview"
            />
          )}
          {isExcel(fileUrl) && (
            <div className="text-gray-700 p-4 bg-green-100 rounded-lg text-center">
              📊 ملف Excel جاهز للتحميل
            </div>
          )}
          {isWord(fileUrl) && (
            <div className="text-gray-700 p-4 bg-blue-100 rounded-lg text-center">
              📝 ملف Word جاهز للتحميل
            </div>
          )}
          {isText(fileUrl) && (
            <div className="text-gray-700 p-4 bg-gray-100 rounded-lg text-center">
              📄 ملف نصي جاهز للتحميل
            </div>
          )}
          {/* أي ملفات أخرى */}
          {!isImage(fileUrl) && !isPDF(fileUrl) && !isExcel(fileUrl) && !isWord(fileUrl) && !isText(fileUrl) && (
            <div className="text-gray-700 p-4 bg-gray-200 rounded-lg text-center">
              الملف جاهز للتحميل
            </div>
          )}
        </div>
</>
      )}

      {/* عرض نص الرسالة مع روابط */}
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

      {/* معاينة الرابط */}
      {meta?.title && (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
          {meta.image && <img src={meta.image} alt={meta.title} className="w-full h-40 object-cover" />}
          <div className="p-3">
            <h3 className="font-semibold text-gray-800 text-sm">{meta.title}</h3>
            {meta.description && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{meta.description}</p>
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
