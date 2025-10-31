import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "Missing file name" }, { status: 400 });
    }

    // 🔐 1. Authorize Backblaze Account
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        Authorization:
          "Basic " +
          btoa(`${process.env.NEXT_PUBLIC_B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`),
      },
    });
    const authData = await authRes.json();

    if (!authData.authorizationToken) {
      throw new Error("Authorization failed");
    }

    // 🌐 2. Get Download Authorization Token (valid for 1 hour)
    const downloadAuthRes = await fetch(
      `${authData.apiUrl}/b2api/v2/b2_get_download_authorization`,
      {
        method: "POST",
        headers: {
          Authorization: authData.authorizationToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucketId: process.env.NEXT_PUBLIC_B2_BUCKET_ID,
          fileNamePrefix: fileName, // ممكن يكون جزء من الاسم أو الاسم كامل
          validDurationInSeconds: 3600, // صلاحية ساعة واحدة
        }),
      }
    );

    const downloadAuthData = await downloadAuthRes.json();

    if (!downloadAuthData.authorizationToken) {
      throw new Error("Failed to get download authorization");
    }

    // 🔗 3. Generate the full presigned URL
    const presignedUrl = `${authData.downloadUrl}/file/${process.env.NEXT_PUBLIC_B2_BUCKET_NAME}/${encodeURIComponent(
      fileName
    )}?Authorization=${downloadAuthData.authorizationToken}`;

    return NextResponse.json({ presignedUrl });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
