import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import functions from "firebase-functions";
import { getDatabase, ref, child, get, remove } from "firebase/database";
import { initializeApp } from "firebase/app";
import admin from 'firebase-admin';
import env from "dotenv/config";

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

const port = process.env.PORT || 4000;


const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();
const server = express();

server.set("view engine", "ejs");
server.set("views", path.join(ROOT, "views"));

server.use(express.static(path.join(process.cwd(), "public")));
const application = initializeApp(firebaseConfig);



   
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.set('view engine', 'ejs');
server.set('views', path.join(process.cwd(), 'views'));

const dbRef = ref(getDatabase());

server.get("/", (req, res) => {
  get(child(dbRef, `posts/`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const posts = snapshot.val();

        const postsArray = Object.keys(posts).map((key) => {
          return { id: key, ...posts[key] };
        });

        console.log(postsArray[0]);
        res.render("user.ejs", { posts: postsArray });
      } else {
        console.log("No data available");
        res.render("user.ejs", { posts: [] });
      }
    })
    .catch((error) => {
      console.error(error);
      res.render("user.ejs", { posts: [] });
    });
});

server.get("/admin", (req, res) => {
  get(child(dbRef, `posts/`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const posts = snapshot.val();

        const postsArray = Object.keys(posts).map((key) => {
          return { id: key, ...posts[key] };
        });

        console.log(postsArray[0]);
        res.render("index.ejs", { posts: postsArray });
      } else {
        console.log("No data available");
        res.render("index.ejs", { posts: [] });
      }
    })
    .catch((error) => {
      console.error(error);
      res.render("index.ejs", { posts: [] });
    });
});

// Route to render the edit page
server.get("/new", (req, res) => {
  res.render("modify.ejs", {
    heading: "New Post",
    submit: "Create Post",
  });
});

server.get("/login", (req, res) => {
  res.render("login.ejs", {firebaseConfig});
});
server.get("/posts/view/:id", (req, res) => {
  const id = req.params.id;

  get(child(dbRef, `posts/`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const posts = snapshot.val();

        const postsArray = Object.keys(posts).map((key) => {
          return { id: key, ...posts[key] };
        });

        let selectedPost = postsArray.find((post) => post.id === id);
        res.render("display.ejs", {
          post: selectedPost,
        });
      } else {
        console.log("No data available");
        res.render("index.ejs", { posts: [] });
      }
    })
    .catch((error) => {
      console.error(error);
      res.render("index.ejs", { posts: [] });
    });
});

server.get("/posts/edit/:id", (req, res) => {
  const id = req.params.id;

  get(child(dbRef, `posts/`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const posts = snapshot.val();

        const postsArray = Object.keys(posts).map((key) => {
          return { id: key, ...posts[key] };
        });

        let selectedPost = postsArray.find((post) => post.id === id);
        res.render("modify.ejs", {
          post: selectedPost,
          heading: "Editing Page",
          submit: "Submit",
        });
      } else {
        console.log("No data available");
        res.render("index.ejs", { posts: [] });
      }
    })
    .catch((error) => {
      console.error(error);
      res.render("index.ejs", { posts: [] });
    });
});


server.get("/posts/delete/:id", (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send("Post ID is required.");
  }

  const postRef = ref(getDatabase(), `posts/${id}`);

  remove(postRef)
    .then(() => {
      console.log(`Post with ID: ${id} deleted successfully.`);
      res.redirect("/admin");
    })
    .catch((error) => {
      console.error(`Error deleting post with ID: ${id}`, error);
      res.status(500).send("Failed to delete the post. Please try again.");
    });
});

server.get('/config.json', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(firebaseConfig);
});
server.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});


export const app = functions.https.onRequest(server);
