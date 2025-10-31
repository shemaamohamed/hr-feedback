import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // 🔐 1. Authorization
    const keyId = process.env.B2_KEY_ID || process.env.NEXT_PUBLIC_B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY || process.env.NEXT_PUBLIC_B2_APPLICATION_KEY;

    if (!keyId || !appKey) {
      return NextResponse.json({ error: "Missing Backblaze credentials in environment" }, { status: 500 });
    }

    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${keyId}:${appKey}`).toString("base64"),
      },
    });

    if (!authRes.ok) {
      // Try to parse JSON body from B2 for a clearer error message
      let b2Err: unknown = null;
      try {
        b2Err = await authRes.json();
      } catch {
        b2Err = await authRes.text().catch(() => null);
      }

      console.error("B2 authorize failed:", authRes.status, b2Err);

      // Handle Backblaze transaction cap exceeded specifically for clearer guidance
      if (
        authRes.status === 403 &&
        b2Err &&
        typeof b2Err === "object" &&
        ("code" in (b2Err as Record<string, unknown>)
          ? (String((b2Err as Record<string, unknown>).code).toLowerCase() === "transaction_cap_exceeded")
          : false || /cap_exceeded/i.test(String((b2Err as Record<string, unknown>).message || "")))
      ) {
        const code = (b2Err as Record<string, unknown>).code ?? null;
        const message = (b2Err as Record<string, unknown>).message ?? b2Err;
        return NextResponse.json(
          {
            error: "transaction_cap_exceeded",
            code,
            message,
            hint: "Backblaze transaction cap exceeded. Increase your transaction cap in the Backblaze Caps & Alerts page or reduce request rate.",
          },
          { status: 429 }
        );
      }

      // Forward the B2 error payload (or textual body) with the original status so it's easier to debug
      return NextResponse.json({ error: "B2 authorize failed", details: b2Err }, { status: authRes.status });
    }

    const authData = await authRes.json();

    if (!authData.apiUrl || !authData.authorizationToken) {
      console.error("B2 auth response missing fields", authData);
      return NextResponse.json({ error: "Authorization response invalid", details: authData }, { status: 502 });
    }

    // 🌐 2. Get upload URL
    const uploadUrlRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: "POST",
      headers: { Authorization: authData.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId: process.env.NEXT_PUBLIC_B2_BUCKET_ID || process.env.B2_BUCKET_ID }),
    });

    if (!uploadUrlRes.ok) {
      let b2Err: unknown = null;
      try {
        b2Err = await uploadUrlRes.json();
      } catch {
        b2Err = await uploadUrlRes.text().catch(() => null);
      }
      console.error("b2_get_upload_url failed:", uploadUrlRes.status, b2Err);
      return NextResponse.json({ error: "Failed to get upload url", details: b2Err }, { status: uploadUrlRes.status });
    }

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

    // The upload response may be a JSON object with file metadata or an error
    const uploadedText = await uploadRes.text();
    let uploaded: unknown = null;
    try {
      uploaded = JSON.parse(uploadedText);
    } catch {
      uploaded = uploadedText;
    }

    if (!uploadRes.ok) {
      console.error("File upload failed:", uploadRes.status, uploaded);
      return NextResponse.json({ error: "File upload failed", details: uploaded }, { status: uploadRes.status });
    }

    // Ensure we have an object with expected fields
    const uploadedObj = typeof uploaded === "object" && uploaded !== null ? (uploaded as Record<string, unknown>) : null;
    if (!uploadedObj || !("fileId" in uploadedObj)) {
      console.error("Upload did not return expected metadata", uploaded);
      return NextResponse.json({ error: "Upload returned unexpected response", details: uploaded }, { status: 502 });
    }

    const fileName = typeof uploadedObj.fileName === "string" ? uploadedObj.fileName : null;
    const fileId = typeof uploadedObj.fileId === "string" ? uploadedObj.fileId : String(uploadedObj.fileId);

    return NextResponse.json({ fileName, fileId });
  } catch (error: unknown) {
    console.error("Unexpected error in upload route:", error);

    // Safely extract fields from unknown `error`
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

    return NextResponse.json({ error: "Upload failed", details: maybeMessage || String(error) }, { status: 500 });
  }
}
