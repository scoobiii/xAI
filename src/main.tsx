import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { FirebaseProvider } from "./context/FirebaseContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </ToastProvider>
  </StrictMode>
);
