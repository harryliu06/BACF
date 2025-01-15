import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabase, ref, child, get, remove } from "firebase/database";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./public/js/firebase.js";
import env from "dotenv";

env.config();

// Initialize Firebase
const application = initializeApp(firebaseConfig);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";

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

app.get("/admin", (req, res) => {
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
  });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
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

app.get("/posts/delete/:id", (req, res) => {
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

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
