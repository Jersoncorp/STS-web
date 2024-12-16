// -------------------------------------------------- Firebase Imports

import { auth } from './config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// -------------------------------------------------- Auth State Change 

onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user); // Log user info
    if (user && window.location.pathname.endsWith('index.html')) {
        window.location.href = '../pages/dashboard/dashboard.html';
    }
});


// -------------------------------------------------- Login

async function loginUser(event) {
    event.preventDefault();
    
    const emailElement = document.getElementById('email');
    const passwordElement = document.getElementById('password');

    if (emailElement && passwordElement) {
        const email = emailElement.value;
        const password = passwordElement.value;

        console.log("Attempting to log in with:", email); // Log email
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful:", userCredential); // Log user credential
            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'Welcome back!',
            }).then(() => {
                window.location.href = '../pages/dashboard/dashboard.html';
            });

        } catch (error) {
            console.error("Login error:", error); // Log error details
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: "Invalid Credentials",
            });
        }
    }
}

// -------------------------------------------------- Form Validation

document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach((form) => {
        form.addEventListener('submit', (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                form.classList.add('was-validated');
            } else if (form.id === 'loginForm') {
                loginUser(event);
            }
        }, false);
    });
});

