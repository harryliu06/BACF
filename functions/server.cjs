const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { getDatabase, ref, child, get, remove } = require("firebase/database");
// const {initializeApp} = require("firebase/app");
// const firebaseConfig = require("../public/js/firebase.cjs");
require("dotenv").config();

const app = express();

// Firebase Initialization
// const application = initializeApp(firebaseConfig);

// Set up EJS and Static Files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
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

        const selectedPost = postsArray.find((post) => post.id === id);
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

        const selectedPost = postsArray.find((post) => post.id === id);
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

module.exports = app;
