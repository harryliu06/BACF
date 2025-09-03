import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

const cfg = await fetch('/config.json', { cache: 'no-store' }).then(r => r.json());
if (!cfg?.apiKey) throw new Error('Missing/invalid Firebase config');

const app = initializeApp(cfg);
export default app;         