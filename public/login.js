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

import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import app from "./js/firebase.js";
const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence);

// Show error message in the login form
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `color: red;
  font-size: 14px;
  margin-top: 10px;`;
  errorDiv.classList.add("error-message");
  errorDiv.innerText = message;
  document.querySelector(".form-container").appendChild(errorDiv);

  setTimeout(() => errorDiv.remove(), 10000);
}

// Login Functionality
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.currentTarget;
  const email = form.elements.email.value;
  const password = form.elements.password.value;
  const csrfToken = form.elements._csrf.value;
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    const response = await fetch("/sessionLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, csrfToken }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Login failed");
    }

    window.location.assign("/admin");
  } catch (error) {
    showError(error.message || "Wrong email or password");
    console.error("Error logging in:", error.message);
    submitButton.disabled = false;
  }
});

displayThemeButtons();
