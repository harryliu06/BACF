import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabase, ref, child, get } from "firebase/database";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyASafiaDM1GKIxR00mRYfCGRwpwFulIepE",
  authDomain: "philips-30d6b.firebaseapp.com",
  databaseURL: "https://philips-30d6b-default-rtdb.firebaseio.com",
  projectId: "philips-30d6b",
  storageBucket: "philips-30d6b.appspot.com",
  messagingSenderId: "564545381495",
  appId: "1:564545381495:web:f4562110d7ca7c282b1272",
  measurementId: "G-8BBBZ3XL4F",
};

// Initialize Firebase
const application = initializeApp(firebaseConfig);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";
const API_KEY = "AIzaSyAv4rdHwyP1UWGibdPZsKf4ua5A_XwJu08";
const SIGN = "AzgHupgN0r84mnSasNY3YRVAWIM=";

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
  res.render("modify.ejs", { heading: "New Post", submit: "Create Post" });
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
          sign: SIGN,
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
          sign: SIGN,
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
