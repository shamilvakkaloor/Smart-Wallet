"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
export function OfflineNotice() {
  const [offline, setOffline] = useState(false);
  useEffect(() => { const update = () => setOffline(!navigator.onLine); update(); window.addEventListener("online",update); window.addEventListener("offline",update); return () => { window.removeEventListener("online",update); window.removeEventListener("offline",update); }; }, []);
  return offline ? <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"><WifiOff size={18}/>You’re offline. Reconnect to load or save your entries.</div> : null;
}
