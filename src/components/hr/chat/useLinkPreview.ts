import { useEffect, useState } from "react";

export function useLinkPreview(url: string | null) {
  const [meta, setMeta] = useState<{ title?: string; description?: string; image?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);

    // ✅ نستخدم API خارجي بسيط لجلب metadata
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        setMeta({
          title: data?.data?.title,
          description: data?.data?.description,
          image: data?.data?.image?.url,
        });
      })
      .catch(() => setMeta({}))
      .finally(() => setLoading(false));
  }, [url]);

  return { meta, loading };
}
