// server.js
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import express from 'express';

import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env') });

/** ---- Admin SDK init ---- */
const requiredConfig = [
  'PROJECT_ID',
  'DATABASE_URL',
  'API_KEY',
  'AUTH_DOMAIN',
  'STORAGE_BUCKET',
  'MESSAGING_SENDER_ID',
  'APP_ID',
  'ADMIN_UIDS',
];
const missingConfig = requiredConfig.filter((name) => !process.env[name]);

if (missingConfig.length) {
  throw new Error(`Missing configuration in .env: ${missingConfig.join(', ')}`);
}

const configuredCredentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
const credentialPath = configuredCredentialPath
  ? path.resolve(ROOT, configuredCredentialPath)
  : path.join(ROOT, 'config', 'serviceAccountKey.json');

if (!fs.existsSync(credentialPath)) {
  throw new Error(
    `Firebase service account key not found at ${credentialPath}. ` +
    'Set GOOGLE_APPLICATION_CREDENTIALS in .env or place the key at config/serviceAccountKey.json.',
  );
}

process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.DATABASE_URL,
  });
}
const db = getDatabase();
const auth = admin.auth();
const adminUids = new Set(
  process.env.ADMIN_UIDS.split(',').map((uid) => uid.trim()).filter(Boolean),
);
const isProduction = process.env.NODE_ENV === 'production';
const sessionDuration = 5 * 24 * 60 * 60 * 1000;

/** ---- Express setup ---- */
const app = express();

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));
app.use(express.static(path.join(ROOT, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
  });
  next();
});

function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1));
    } catch {
      return '';
    }
  }
  return '';
}

function setCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: sessionDuration,
  });
  return token;
}

function ensureCsrfToken(req, res) {
  return getCookie(req, 'csrf') || setCsrfCookie(res);
}

function tokensMatch(expected, received) {
  if (!expected || !received) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isAdminUser(decodedToken) {
  return adminUids.has(decodedToken.uid);
}

async function requireAdmin(req, res, next) {
  try {
    const sessionCookie = getCookie(req, 'session');
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    if (!isAdminUser(decodedToken)) throw new Error('Not an administrator');

    req.admin = decodedToken;
    req.csrfToken = ensureCsrfToken(req, res);
    res.set('Cache-Control', 'no-store');
    next();
  } catch {
    res.clearCookie('session', { path: '/' });
    if (req.method === 'GET') return res.redirect('/login');
    return res.status(401).json({ error: 'Authentication required' });
  }
}

function requireCsrf(req, res, next) {
  const suppliedToken = req.body?._csrf || req.get('X-CSRF-Token');
  if (!tokensMatch(getCookie(req, 'csrf'), suppliedToken)) {
    return res.status(403).json({ error: 'Invalid security token' });
  }
  next();
}

function validPostId(id) {
  return /^[A-Za-z0-9_-]{1,128}$/.test(id);
}

function parsePostPayload(body) {
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 10000) {
    throw new Error('Content must be between 1 and 10,000 characters');
  }

  const files = Array.isArray(body?.files) ? body.files : [];
  if (files.length > 20) throw new Error('A post can contain at most 20 files');

  for (const file of files) {
    if (typeof file !== 'string' || file.length > 2048) throw new Error('Invalid file URL');
    const url = new URL(file);
    if (url.protocol !== 'https:') throw new Error('File URLs must use HTTPS');
  }

  return { content, files };
}

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

app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const snap = await db.ref('posts').get();
    const posts = snap.exists()
      ? Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }))
      : [];
    res.render('index.ejs', { posts, csrfToken: req.csrfToken });
  } catch (e) {
    console.error(e);
    res.render('index.ejs', { posts: [], csrfToken: req.csrfToken });
  }
});

app.get('/new', requireAdmin, (req, res) => {
  res.render('modify.ejs', {
    heading: 'New Post',
    submit: 'Create Post',
    csrfToken: req.csrfToken,
  });
});

app.get('/login', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.render('login.ejs', { csrfToken: setCsrfCookie(res) });
});

app.post('/sessionLogin', async (req, res) => {
  try {
    if (!tokensMatch(getCookie(req, 'csrf'), req.body?.csrfToken)) {
      return res.status(403).json({ error: 'Invalid security token' });
    }

    const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken : '';
    const decodedToken = await auth.verifyIdToken(idToken);
    const signedInRecently = Date.now() / 1000 - decodedToken.auth_time < 5 * 60;
    if (!signedInRecently || !isAdminUser(decodedToken)) {
      return res.status(403).json({ error: 'This account is not an administrator' });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: sessionDuration });
    res.cookie('session', sessionCookie, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: sessionDuration,
    });
    setCsrfCookie(res);
    return res.json({ ok: true });
  } catch (error) {
    console.error('session login failed', error.message);
    return res.status(401).json({ error: 'Login failed' });
  }
});

app.post('/sessionLogout', requireAdmin, requireCsrf, async (req, res) => {
  res.clearCookie('session', { path: '/' });
  res.clearCookie('csrf', { path: '/' });
  try {
    await auth.revokeRefreshTokens(req.admin.uid);
  } catch (error) {
    console.error('token revocation failed', error.message);
  }
  res.redirect('/login');
});

app.get('/posts/view/:id', async (req, res) => {
  if (!validPostId(req.params.id)) return res.status(400).send('Invalid post ID');
  try {
    const snap = await db.ref(`posts/${req.params.id}`).get();
    if (!snap.exists()) return res.status(404).send('Post not found');
    const post = { id: req.params.id, ...snap.val() };
    res.render('display.ejs', { post });
  } catch (e) {
    console.error(e);
    res.status(500).send('Failed to load the post');
  }
});

app.get('/posts/edit/:id', requireAdmin, async (req, res) => {
  if (!validPostId(req.params.id)) return res.status(400).send('Invalid post ID');
  try {
    const snap = await db.ref(`posts/${req.params.id}`).get();
    if (!snap.exists()) return res.status(404).send('Post not found');
    const post = { id: req.params.id, ...snap.val() };
    res.render('modify.ejs', {
      post,
      heading: 'Editing Page',
      submit: 'Submit',
      csrfToken: req.csrfToken,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Failed to load the post');
  }
});

// Create
app.post('/posts', requireAdmin, requireCsrf, async (req, res) => {
  try {
    const { content, files } = parsePostPayload(req.body);
    const id = db.ref('posts').push().key;
    await db.ref(`posts/${id}`).set({
      content,
      files: Array.isArray(files) ? files : [],
      createdAt: Date.now(),
    });
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error('create failed', e);
    const validationError = e instanceof TypeError || !e?.code;
    res.status(validationError ? 400 : 500).json({ ok: false, error: e.message || 'Create failed' });
  }
});

/** Update */
app.post('/posts/:id', requireAdmin, requireCsrf, async (req, res) => {
  if (!validPostId(req.params.id)) return res.status(400).json({ error: 'Invalid post ID' });
  try {
    const { content, files } = parsePostPayload(req.body);
    await db.ref(`posts/${req.params.id}`).update({ content, files, updatedAt: Date.now() });
    res.json({ ok: true });
  } catch (e) {
    console.error('update failed', e);
    const validationError = e instanceof TypeError || !e?.code;
    res.status(validationError ? 400 : 500).json({ ok: false, error: e.message || 'Update failed' });
  }
});

/** Delete */
app.post('/posts/delete/:id', requireAdmin, requireCsrf, async (req, res) => {
  if (!validPostId(req.params.id)) return res.status(400).send('Invalid post ID');
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
