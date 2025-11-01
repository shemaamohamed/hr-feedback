import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

// Server-side admin user creation endpoint.
// Requires FIREBASE_SERVICE_ACCOUNT env var to be set to the service account JSON string.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      return NextResponse.json({ error: 'Server not configured to create auth users. Set FIREBASE_SERVICE_ACCOUNT.' }, { status: 501 });
    }

    const admin = await import('firebase-admin');
    const serviceAccountRaw = await readFile(process.env.FIREBASE_SERVICE_ACCOUNT_PATH!, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountRaw);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    // Verify caller token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const callerUid = decoded.uid;

    // Ensure caller is HR by checking Firestore users collection
    const db = admin.firestore();
    const callerDoc = await db.doc(`users/${callerUid}`).get();
  const callerData = callerDoc.exists ? (callerDoc.data() as Record<string, unknown>) : null;
    if (!callerData || callerData.role !== 'hr') {
      return NextResponse.json({ error: 'Forbidden: only HR users can create accounts' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, name, role = 'employee' } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create auth user
    const userRecord = await admin.auth().createUser({ email, password });

    // Create user document in Firestore with desired role
    await db.doc(`users/${userRecord.uid}`).set({
      email,
      name,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });
  } catch (error: unknown) {
    console.error('Admin create user failed', error);
    const message = (error instanceof Error) ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
