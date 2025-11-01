const functions = require("firebase-functions/v1");
const app = require("./server.cjs");

exports.api = functions.https.onRequest(app);
