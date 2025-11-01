// server.js
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';

/** ---- Admin SDK init ---- */
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL, 
  });
}
const db = getDatabase();

/** ---- Express setup ---- */
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();

app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));
app.use(express.static(path.join(ROOT, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/** Public Firebase config for the browser */
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

/** Serve config to the client module */
app.get('/config.json', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(firebaseConfig);
});

/** ---- Routes ---- */
app.get('/', async (_req, res) => {
  try {
    const snap = await db.ref('posts').get();
    const posts = snap.exists()
      ? Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }))
      : [];
    res.render('user.ejs', { posts });
  } catch (e) {
    console.error(e);
    res.render('user.ejs', { posts: [] });
  }
});

app.get('/admin', async (_req, res) => {
  try {
    const snap = await db.ref('posts').get();
    const posts = snap.exists()
      ? Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }))
      : [];
    res.render('index.ejs', { posts });
  } catch (e) {
    console.error(e);
    res.render('index.ejs', { posts: [] });
  }
});

app.get('/new', (_req, res) => {
  res.render('modify.ejs', { heading: 'New Post', submit: 'Create Post' });
});

app.get('/login', (_req, res) => {
  // If your login page fetches /config.json you don't need to pass firebaseConfig here.
  res.render('login.ejs', { firebaseConfig });
});

app.get('/posts/view/:id', async (req, res) => {
  try {
    const snap = await db.ref('posts').get();
    const posts = snap.exists()
      ? Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }))
      : [];
    const post = posts.find(p => p.id === req.params.id);
    res.render('display.ejs', { post });
  } catch (e) {
    console.error(e);
    res.render('index.ejs', { posts: [] });
  }
});

app.get('/posts/edit/:id', async (req, res) => {
  try {
    const snap = await db.ref('posts').get();
    const posts = snap.exists()
      ? Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }))
      : [];
    const post = posts.find(p => p.id === req.params.id);
    res.render('modify.ejs', { post, heading: 'Editing Page', submit: 'Submit' });
  } catch (e) {
    console.error(e);
    res.render('index.ejs', { posts: [] });
  }
});

// Create
app.post('/posts', async (req, res) => {
  try {
    const { content, files } = req.body || {};
    if (!content) return res.status(400).json({ error: 'content required' });
    const id = Date.now().toString();
    await db.ref(`posts/${id}`).set({
      content,
      files: Array.isArray(files) ? files : [],
      createdAt: Date.now(),
    });
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error('create failed', e);
    res.status(500).json({ ok: false, error: 'Create failed' });
  }
});

/** Update */
app.post('/posts/:id', async (req, res) => {
  try {
    const { content, files } = req.body || {};
    const patch = { updatedAt: Date.now() };
    if (content !== undefined) patch.content = content;
    if (Array.isArray(files)) patch.files = files;
    await db.ref(`posts/${req.params.id}`).update(patch);
    res.json({ ok: true });
  } catch (e) {
    console.error('update failed', e);
    res.status(500).json({ ok: false, error: 'Update failed' });
  }
});

/** Delete */
app.get('/posts/delete/:id', async (req, res) => {
  try {
    await db.ref(`posts/${req.params.id}`).remove();
    res.redirect('/admin');
  } catch (e) {
    console.error('delete failed', e);
    res.status(500).send('Failed to delete the post.');
  }
});

/** ---- Start ---- */
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server http://localhost:${port}`));

export default app;
