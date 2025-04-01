import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBM-8tjoT6pNo9R9xSzdsy7EthVEuRcV3Q",
    authDomain: "fir-frontend-b76f8.firebaseapp.com",
    projectId: "fir-frontend-b76f8",
    storageBucket: "fir-frontend-b76f8.firebasestorage.app",
    messagingSenderId: "782791943362",
    appId: "1:782791943362:web:55fca49ed8e626c24cc75b",
    measurementId: "G-CNQ1FVBZVR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
        messageDiv.style.opacity = 0;
    }, 5000);
}

// Handle sign-in
const signIn = document.getElementById('submitSignIn');
signIn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
    const email = document.getElementById('username').value; // Get email
    const password = document.getElementById('password').value; // Get password

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            localStorage.setItem('loggedInUser Id', user.uid); // Store user ID in local storage
            showMessage('Login is successful', 'signInMessage');
            window.location.href = 'http://127.0.0.1:5500/ADMIN/DASHBOARD/Dashboard.html'; // Redirect to homepage.html
        })
        .catch((error) => {
            const errorCode = error.code;
            console.error("Login error:", error); // Log error for debugging
            if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
                showMessage('Incorrect Email or Password', 'signInMessage');
            } else {
                showMessage('An error occurred during login', 'signInMessage');
            }
        });
});