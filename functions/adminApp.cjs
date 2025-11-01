const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

// const {fileURLToPath} = require("url");
// const {dirname, join} = require("path");

const configPath = path.join(__dirname, "./config/serviceAccountKey.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: "https://bacf-66b3b-default-rtdb.firebaseio.com",
});

// const db = admin.firestore();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

module.exports = app;
