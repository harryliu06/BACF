import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabase, ref, child, get } from "firebase/database";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebase.js";
import env from "dotenv";

env.config();

// Initialize Firebase
const application = initializeApp(firebaseConfig);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";
const API_KEY = process.env.MAP_API;

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dbRef = ref(getDatabase());

app.get("/", (req, res) => {
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
app.get("/new", (req, res) => {
  res.render("modify.ejs", {
    heading: "New Post",
    submit: "Create Post",
    key: API_KEY,
  });
});

app.get("/posts/view/:id", (req, res) => {
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
          key: API_KEY,
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

app.get("/posts/edit/:id", (req, res) => {
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
          key: API_KEY,
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

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
