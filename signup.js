// 

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBIfSNGn9NAR-5-ShO1LJkNMBI0zI8We8o",
    authDomain: "bandhu-f8fc3.firebaseapp.com",
    projectId: "bandhu-f8fc3",
    storageBucket: "bandhu-f8fc3.firebasestorage.app",
    messagingSenderId: "849087476902",
    appId: "1:849087476902:web:a68604d0df86bda1b0b067",
    measurementId: "G-SFHW73QZK1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Signup event listener
const signup = document.getElementById("signup");
signup.addEventListener("click", function (event) {
    event.preventDefault();

    // Get input elements
    const fullname = document.getElementById("fullname");
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    // Get the email and password values
    const userEmail = email.value;
    const userPassword = password.value;

    // Create user with email and password
    createUserWithEmailAndPassword(auth, userEmail, userPassword)
        .then((userCredential) => {
            // Signed up
            const user = userCredential.user;
            alert("Signup successful! Welcome " + user.email);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Error: " + errorMessage); // Show error message in alert
        });
});
