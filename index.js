import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from "node:fs";
import { dirname, join } from "node:path";

const configPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "./config/serviceAccountKey.json"
);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: "https://philips-30d6b-default-rtdb.firebaseio.com",
});

const db = admin.firestore();

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
