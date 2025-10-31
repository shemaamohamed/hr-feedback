import { NextResponse } from "next/server";
import { getB2Auth } from '../../../../src/lib/backblazeAuth';

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "Missing file name" }, { status: 400 });
    }

    // 🔐 1. Authorize Backblaze Account (cached)
    const authData = await getB2Auth();

    if (!authData.authorizationToken || !authData.apiUrl || !authData.downloadUrl) {
      throw new Error("Authorization response missing expected fields");
    }

    // 🌐 2. Get Download Authorization Token (valid for 1 hour)
    const downloadAuthRes = await fetch(
      `${String(authData.apiUrl)}/b2api/v2/b2_get_download_authorization`,
      {
        method: "POST",
        headers: {
          Authorization: String(authData.authorizationToken),
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
      // Attempt to surface B2 error details for download auth
      const maybeErr = downloadAuthData ?? null;
      console.error("b2_get_download_authorization failed:", maybeErr);

      const isDownloadCap =
        downloadAuthRes.status === 403 &&
        maybeErr &&
        typeof maybeErr === "object" &&
        ("code" in (maybeErr as Record<string, unknown>)
          ? String((maybeErr as Record<string, unknown>).code).toLowerCase() === "transaction_cap_exceeded"
          : /cap_exceeded/i.test(String((maybeErr as Record<string, unknown>).message || "")));

      if (isDownloadCap) {
        return NextResponse.json(
          {
            error: "transaction_cap_exceeded",
            message:
              "Backblaze transaction cap exceeded while requesting download authorization. Increase cap or reduce requests.",
            details: maybeErr,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: "Failed to get download authorization", details: maybeErr }, { status: 502 });
    }

    // 🔗 3. Generate the full presigned URL
    const presignedUrl = `${String(authData.downloadUrl)}/file/${process.env.NEXT_PUBLIC_B2_BUCKET_NAME}/${encodeURIComponent(
      fileName
    )}?Authorization=${String(downloadAuthData.authorizationToken)}`;

    return NextResponse.json({ presignedUrl });
  } catch (error: unknown) {
    console.error("Presigned URL error:", error);

    const maybeMessage =
      typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in (error as Record<string, unknown>)
        ? String((error as Record<string, unknown>).message)
        : "";

    const maybeCode =
      error && typeof error === "object" && "code" in (error as Record<string, unknown>)
        ? String((error as Record<string, unknown>).code)
        : "";

    // If helper threw an error with `.body`, check there too
  const maybeBody = error && typeof error === "object" && "body" in (error as Record<string, unknown>) ? (error as Record<string, unknown>).body : null;
    const maybeBodyCode = maybeBody && typeof maybeBody === "object" && "code" in (maybeBody as Record<string, unknown>) ? String((maybeBody as Record<string, unknown>).code) : "";
    const maybeBodyMessage = maybeBody && typeof maybeBody === "object" && "message" in (maybeBody as Record<string, unknown>) ? String((maybeBody as Record<string, unknown>).message) : "";

    const isTransactionCap =
      (maybeCode && maybeCode.toLowerCase() === "transaction_cap_exceeded") ||
      (maybeBodyCode && maybeBodyCode.toLowerCase() === "transaction_cap_exceeded") ||
      (maybeMessage && /cap_exceeded/i.test(maybeMessage)) ||
      (maybeBodyMessage && /cap_exceeded/i.test(maybeBodyMessage)) ||
      (maybeMessage && maybeMessage.includes("transaction_cap_exceeded")) ||
      (maybeBodyMessage && maybeBodyMessage.includes("transaction_cap_exceeded"));

    if (isTransactionCap) {
      return NextResponse.json(
        {
          error: "transaction_cap_exceeded",
          message: "Backblaze transaction cap exceeded. Increase cap in Backblaze Caps & Alerts page or reduce request rate.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
