"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstall() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => console.warn("Smart Wallet offline support could not be registered."));
    }
    const beforeInstall = (event: Event) => {
      if (window.matchMedia("(display-mode: standalone)").matches) return;
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const installed = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    setBusy(true);
    try { await prompt.prompt(); await prompt.userChoice; }
    finally { setPrompt(null); setBusy(false); }
  }

  if (!prompt) return null;
  return <div className="flex justify-center px-4 py-3"><button className="btn-secondary" disabled={busy} onClick={() => { void install().catch(() => console.warn("Install prompt was unavailable. Use the browser menu to install.")); }}>{busy ? "Opening installer…" : "Install Smart Wallet"}</button></div>;
}
