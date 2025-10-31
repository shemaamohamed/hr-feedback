import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // 🔐 1. Authorization
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        Authorization:
          "Basic " +
          btoa(`${process.env.NEXT_PUBLIC_B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`),
      },
    });
    const authData = await authRes.json();

    // 🌐 2. Get upload URL
    const uploadUrlRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: "POST",
      headers: { Authorization: authData.authorizationToken },
      body: JSON.stringify({ bucketId: process.env.NEXT_PUBLIC_B2_BUCKET_ID }),
    });
    const uploadData = await uploadUrlRes.json();

    // 📤 3. Upload file
    const arrayBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(uploadData.uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadData.authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(file.name),
        "Content-Type": file.type || "b2/x-auto",
        "X-Bz-Content-Sha1": "do_not_verify",
      },
      body: Buffer.from(arrayBuffer),
    });

    const uploaded = await uploadRes.json();
    if (!uploaded.fileId) throw new Error("Upload failed");

    return NextResponse.json({
      fileName: uploaded.fileName,
      fileId: uploaded.fileId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
