const admin = import("firebase-admin");
const serviceAccount = import("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://philips-30d6b-default-rtdb.firebaseio.com",
});

export default db = admin.firestore();
