import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "Missing file name" }, { status: 400 });
    }

    // 🔐 1. Authorize Backblaze Account
    const keyId = process.env.B2_KEY_ID || process.env.NEXT_PUBLIC_B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY || process.env.NEXT_PUBLIC_B2_APPLICATION_KEY;

    if (!keyId || !appKey) {
      throw new Error("Missing Backblaze credentials in environment variables");
    }

    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${keyId}:${appKey}`).toString("base64"),
      },
    });

    if (!authRes.ok) {
      // Try to parse the B2 error response for better handling
      let b2Err: unknown = null;
      try {
        b2Err = await authRes.json();
      } catch {
        b2Err = await authRes.text().catch(() => null);
      }

      console.error("B2 authorize failed (get-presigned-url):", authRes.status, b2Err);

      const isTransactionCap =
        authRes.status === 403 &&
        b2Err &&
        typeof b2Err === "object" &&
        ("code" in (b2Err as Record<string, unknown>)
          ? String((b2Err as Record<string, unknown>).code).toLowerCase() === "transaction_cap_exceeded"
          : /cap_exceeded/i.test(String((b2Err as Record<string, unknown>).message || "")));

      if (isTransactionCap) {
        return NextResponse.json(
          {
            error: "transaction_cap_exceeded",
            message:
              "Backblaze transaction cap exceeded. Increase cap in Backblaze Caps & Alerts page or reduce request rate.",
            details: b2Err,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: "Authorization failed", details: b2Err }, { status: authRes.status });
    }

    const authData = await authRes.json();

    if (!authData.authorizationToken || !authData.apiUrl || !authData.downloadUrl) {
      throw new Error("Authorization response missing expected fields");
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
    const presignedUrl = `${authData.downloadUrl}/file/${process.env.NEXT_PUBLIC_B2_BUCKET_NAME}/${encodeURIComponent(
      fileName
    )}?Authorization=${downloadAuthData.authorizationToken}`;

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

    const isTransactionCap =
      (maybeCode && maybeCode.toLowerCase() === "transaction_cap_exceeded") ||
      (maybeMessage && /cap_exceeded/i.test(maybeMessage)) ||
      (maybeMessage && maybeMessage.includes("transaction_cap_exceeded"));

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
