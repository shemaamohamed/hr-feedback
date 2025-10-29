import { useLinkPreview } from "./useLinkPreview";

const MessageContent = ({ message }: { message: string }) => {
  const urlMatch = message.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
  const url = urlMatch ? (urlMatch[0].startsWith("http") ? urlMatch[0] : `https://${urlMatch[0]}`) : null;
  const { meta } = useLinkPreview(url);

  return (
    <div className="space-y-2 max-w-[300px]">
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
