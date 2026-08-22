import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  loginWithGoogle, 
  logoutUser, 
  testFirebaseConnection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from "../services/firebase";

interface FirebaseContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseReady: boolean;
  connectionStatus: "connected" | "checking" | "offline" | "error";
  latencyMs: number;
  login: () => Promise<User>;
  logout: () => Promise<void>;
  syncUserProfile: (user: User) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "checking" | "offline" | "error">("checking");
  const [latencyMs, setLatencyMs] = useState(0);

  useEffect(() => {
    // 1. Test Server Connectivity
    testFirebaseConnection()
      .then((res) => {
        setLatencyMs(res.latencyMs);
        if (res.success) {
          setConnectionStatus("connected");
          setIsFirebaseReady(true);
        } else {
          setConnectionStatus("offline");
        }
      })
      .catch((err) => {
        console.error("Firebase connection test failed:", err);
        setConnectionStatus("error");
      });

    // 2. Listen to Auth State changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        // Sync public user profile
        try {
          await syncUserProfile(user);
        } catch (err) {
          console.warn("User profile sync note:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserProfile = async (user: User) => {
    const userDocRef = doc(db, "users", user.uid);
    try {
      const existing = await getDoc(userDocRef);
      if (!existing.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "Operador",
          handle: (user.email?.split("@")[0] || "user_" + user.uid.slice(0, 5)).replace(/[^a-zA-Z0-9_]/g, "_"),
          avatar: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          isAgent: false,
          role: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const login = async () => {
    try {
      const user = await loginWithGoogle();
      return user;
    } catch (err) {
      console.error("Login with Google error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseReady,
        connectionStatus,
        latencyMs,
        login,
        logout,
        syncUserProfile,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
