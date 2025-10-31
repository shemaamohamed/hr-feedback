import { NextResponse } from "next/server";
import { getB2Auth } from '../../../../src/lib/backblazeAuth';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // 🔐 1. Authorization (cached helper)
    let authData: Record<string, unknown> | null = null;
    try {
      authData = await getB2Auth();
    } catch (err) {
      console.error("B2 authorize failed:", err);

      const e = err as Record<string, unknown> & { status?: number; body?: unknown };
      const body = e.body ?? null;

      const bodyCode = body && typeof body === "object" && "code" in (body as Record<string, unknown>) ? String((body as Record<string, unknown>).code) : "";
      const bodyMessage = body && typeof body === "object" && "message" in (body as Record<string, unknown>) ? String((body as Record<string, unknown>).message) : "";

      if ((e.status === 403 && (bodyCode.toLowerCase() === "transaction_cap_exceeded" || /cap_exceeded/i.test(bodyMessage))) || String(e.message || "").includes("transaction_cap_exceeded")) {
        return NextResponse.json(
          {
            error: "transaction_cap_exceeded",
            message: "Backblaze transaction cap exceeded. Increase your transaction cap in the Backblaze Caps & Alerts page or reduce request rate.",
            details: body,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: "B2 authorize failed", details: body ?? e.message }, { status: e.status ?? 502 });
    }

    // 🌐 2. Get upload URL
    const uploadUrlRes = await fetch(`${String(authData.apiUrl)}/b2api/v2/b2_get_upload_url`, {
      method: "POST",
      headers: { Authorization: String(authData.authorizationToken), "Content-Type": "application/json" },
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
