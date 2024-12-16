import { auth } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// -------------------------------------------------- Auth State Change

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../../../index.html';
    } else {
        console.log("User signed in:", user); // Log user information
        includeHTML();
    }
});

// -------------------------------------------------- Include Sidebar

async function includeHTML() {
    try {
        const sideNav = await fetch('../../../resources/temp/side-nav.html');
        if (sideNav.ok) {
            const sidenavHTML = await sideNav.text();
            document.getElementById('side-nav').innerHTML = sidenavHTML;

            attachToggleEventListener();
            attachLogoutEventListener();
            attachDarkModeEventListener(); // Attach dark mode event listener
        } else {
            console.error('Failed to fetch sidenav.html:', sideNav.statusText);
        }
    } catch (error) {
        console.error('Error fetching HTML files:', error);
    }
}

// -------------------------------------------------- Side-Nav Toggle Button

function attachToggleEventListener() {
    const hamBurger = document.querySelector(".toggle-btn");

    if (hamBurger) {
        hamBurger.addEventListener("click", function () {
            document.querySelector("#sidebar").classList.toggle("expand");
        });
    } else {
        console.error("Toggle button not found!");
    }
}

// -------------------------------------------------- Logout functionality

function attachLogoutEventListener() {
    const logoutButton = document.getElementById('logout');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = '../../../index.html';
            } catch (error) {
                console.error('Logout failed:', error);
            }
        });
    } else {
        console.error("Logout button not found!");
    }
}

// -------------------------------------------------- Dark Mode Switch functionality

function attachDarkModeEventListener() {
    const htmlElement = document.documentElement;
    const switchElement = document.getElementById('darkModeSwitch');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentTheme = localStorage.getItem('bsTheme') || (prefersDarkScheme ? 'dark' : 'light');

    htmlElement.setAttribute('data-bs-theme', currentTheme);
    switchElement.checked = currentTheme === 'dark';

    if (switchElement) {
        switchElement.addEventListener('change', function () {
            const newTheme = this.checked ? 'dark' : 'light';
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('bsTheme', newTheme);
        });
    } else {
        console.error("Dark mode switch not found!");
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    // Tooltip activation
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
