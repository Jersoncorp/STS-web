// -------------------------------------------------- Firebase Imports

import { auth } from "./config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// -------------------------------------------------- Auth State Change

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user); // Log user info
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "../pages/dashboard/dashboard.html";
  }
});

// -------------------------------------------------- Login

async function loginUser(event) {
  event.preventDefault();

  const emailElement = document.getElementById("email");
  const passwordElement = document.getElementById("password");

  if (emailElement && passwordElement) {
    const email = emailElement.value;
    const password = passwordElement.value;

    console.log("Attempting to log in with:", email); // Log email
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login successful:", userCredential); // Log user credential
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
      }).then(() => {
        window.location.href = "../pages/dashboard/dashboard.html";
      });
    } catch (error) {
      console.error("Login error:", error); // Log error details
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Invalid Credentials",
      });
    }
  }
}

async function handleForgotPassword(event) {
  const emailElement = document.getElementById("email");

  if (emailElement) {
    const email = emailElement.value;

    if (email) {
      try {
        console.log("Sending password reset email to:", email); // Debugging email
        await sendPasswordResetEmail(auth, email);
        Swal.fire({
          icon: "success",
          title: "Password Reset Sent",
          text: "Please check your email to reset your password.",
        });
      } catch (error) {
        console.error("Forgot password error:", error); // Log full error object

        let errorMessage = "An error occurred. Please try again.";
        if (error.code === "auth/user-not-found") {
          errorMessage = "No account found with this email address.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address.";
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your email address to reset your password.",
      });
    }
  }
}



// -------------------------------------------------- Form Validation

document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const forms = document.querySelectorAll(".needs-validation");

  forms.forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
          form.classList.add("was-validated");
        } else if (form.id === "loginForm") {
          loginUser(event);
        }
      },
      false
    );
  });

  // Attach the "Forgot Password" handler to the link
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", handleForgotPassword);
  }
});
