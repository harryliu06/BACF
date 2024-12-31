const themes = [
  {
    background: "#1A1A2E",
    color: "#FFFFFF",
    primaryColor: "#0F3460",
  },
  {
    background: "#461220",
    color: "#FFFFFF",
    primaryColor: "#E94560",
  },
  {
    background: "#192A51",
    color: "#FFFFFF",
    primaryColor: "#967AA1",
  },
  {
    background: "#F7B267",
    color: "#000000",
    primaryColor: "#F4845F",
  },
  {
    background: "#F25F5C",
    color: "#000000",
    primaryColor: "#642B36",
  },
  {
    background: "#231F20",
    color: "#FFF",
    primaryColor: "#BB4430",
  },
];

const setTheme = (theme) => {
  const root = document.querySelector(":root");
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--color", theme.color);
  root.style.setProperty("--primary-color", theme.primaryColor);
  root.style.setProperty("--glass-color", theme.glassColor);
};

const displayThemeButtons = () => {
  const btnContainer = document.querySelector(".theme-btn-container");
  themes.forEach((theme) => {
    const div = document.createElement("div");
    div.className = "theme-btn";
    div.style.cssText = `background: ${theme.background}; width: 25px; height: 25px`;
    btnContainer.appendChild(div);
    div.addEventListener("click", () => setTheme(theme));
  });
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import firebaseConfig from "./js/firebase.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Show error message in the login form
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `color: red;
  font-size: 14px;
  margin-top: 10px;`;
  errorDiv.classList.add("error-message");
  errorDiv.innerText = message;
  document.querySelector(".form-container").appendChild(errorDiv);

  setTimeout(() => errorDiv.remove(), 10000); // Remove error message after 3 seconds
}

// Login Functionality
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = e.target[0].value; // Get the username (or email) input
  const password = e.target[1].value; // Get the password input

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User logged in:", userCredential.user);
    // Redirect to admin or protected page
    window.location.href = "/admin"; // Adjust based on your setup
  } catch (error) {
    showError("Wrong Username or Password!");
    console.error("Error logging in:", error.message);
    // alert("Invalid login credentials. Please try again.");
  }
});

displayThemeButtons();
