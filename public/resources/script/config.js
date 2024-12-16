// -------------------------------------------------- Firebase Imports

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging.js";

// -------------------------------------------------- Firebase Configuration

const firebaseConfig = {
    apiKey: "AIzaSyDVPWQ9WeiYMVjDEXgDnsjX9tidDp_U5FA",
    authDomain: "smartticketingsystem-307d4.firebaseapp.com",
    projectId: "smartticketingsystem-307d4",
    storageBucket: "smartticketingsystem-307d4.appspot.com",
    messagingSenderId: "498934944671",
    appId: "1:498934944671:web:89a0163548127463c323aa"
  };

// -------------------------------------------------- Firebase Initialization

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage(app);
const database = getDatabase(app)
const firestore = getFirestore(app);
const messaging = getMessaging(app);

export { app, database, storage, firestore, auth, messaging };
