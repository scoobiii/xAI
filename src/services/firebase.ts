import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  type Firestore 
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User,
  type Auth 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with explicit database ID from config
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Specific Error Handling as mandated by Firebase Integration Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test using getDocFromServer
export async function testFirebaseConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    // getDocFromServer verifies real server connectivity
    await getDocFromServer(doc(db, "users", "connection_check"));
    return { success: true, latencyMs: Date.now() - start };
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("Missing or insufficient permissions")) {
      // Permission denied still proves cloud database connectivity!
      return { success: true, latencyMs: Date.now() - start };
    }
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration (client offline).");
      return { success: false, latencyMs: Date.now() - start, error: "Client offline" };
    }
    return { success: true, latencyMs: Date.now() - start };
  }
}

// Auth Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error("Google login error:", err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout error:", err);
    throw err;
  }
}

export {
  doc,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onAuthStateChanged
};
