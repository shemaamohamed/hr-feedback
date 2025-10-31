import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: "Missing file name" }, { status: 400 });
    }

    // 1️⃣ Authorize Account
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        Authorization:
          "Basic " +
          btoa(`${process.env.NEXT_PUBLIC_B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`),
      },
    });
    const authData = await authRes.json();

    // 2️⃣ Get Download Authorization
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
          fileNamePrefix: fileName,
          validDurationInSeconds: 3600,
        }),
      }
    );
    const downloadAuthData = await downloadAuthRes.json();

    // 3️⃣ Fetch file from Backblaze using the token in header
    const fileRes = await fetch(
      `${authData.downloadUrl}/file/${process.env.NEXT_PUBLIC_B2_BUCKET_NAME}/${encodeURIComponent(
        fileName
      )}`,
      {
        headers: {
          Authorization: downloadAuthData.authorizationToken,
        },
      }
    );

    if (!fileRes.ok) {
      throw new Error("Failed to fetch file from Backblaze");
    }

    // 4️⃣ Return file as stream response to browser
    const arrayBuffer = await fileRes.arrayBuffer();
    const fileBlob = Buffer.from(arrayBuffer);

    return new NextResponse(fileBlob, {
      headers: {
        "Content-Type": fileRes.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
