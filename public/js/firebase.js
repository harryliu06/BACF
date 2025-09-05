// /public/js/firebase.js
import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

async function loadConfig() {
  if (window.FIREBASE_CONFIG) return window.FIREBASE_CONFIG; // if you sometimes inject
  const r = await fetch("/config.json", { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load /config.json");
  return r.json();
}

const cfg = await loadConfig();

// Reuse existing app if one already exists
const app = getApps().length ? getApp() : initializeApp(cfg);

export default app;
