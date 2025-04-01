import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import {
    getAuth,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Your web app's Firebase configuration (ensure this is correct)
const firebaseConfig = {
  apiKey: "AIzaSyBM-8tjoT6pNo9R9xSzdsy7EthVEuRcV3Q", // MAKE SURE THIS IS YOUR ACTUAL KEY
  authDomain: "fir-frontend-b76f8.firebaseapp.com",
  projectId: "fir-frontend-b76f8",
  storageBucket: "fir-frontend-b76f8.appspot.com", // Usually ends with .appspot.com
  messagingSenderId: "782791943362",
  appId: "1:782791943362:web:55fca49ed8e626c24cc75b",
  measurementId: "G-CNQ1FVBZVR" // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Only if you need analytics

// Get Firebase services using V9 functions
const auth = getAuth(app);
const db = getFirestore(app);

// Get DOM Elements
const changeUsernameForm = document.getElementById('changeUsernameForm');
const updateFirstNameInput = document.getElementById('updateFirstName');
const updateLastNameInput = document.getElementById('updateLastName');

const changePasswordForm = document.getElementById('changePasswordForm');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

const createAccountSection = document.getElementById('createAccountSection');
const createAccountForm = document.getElementById('createAccountForm');
const createFirstNameInput = document.getElementById('createFirstName');
const createLastNameInput = document.getElementById('createLastName');
const createEmailInput = document.getElementById('createEmail');
const createPasswordInput = document.getElementById('createPassword');
const createConfirmPasswordInput = document.getElementById('createConfirmPassword');
const createPositionSelect = document.getElementById('createPosition');

const statusMessage = document.getElementById('statusMessage');
const errorMessage = document.getElementById('errorMessage');

const profileNameElement = document.querySelector('.profile-text h3');
const profilePositionElement = document.querySelector('.profile-text p');
const logoutButton = document.querySelector('.logout-link');

// --- Utility function to clear messages ---
function clearMessages() {
    if (statusMessage) statusMessage.textContent = '';
    if (errorMessage) errorMessage.textContent = '';
}

// --- Check Auth State and User Role ---
onAuthStateChanged(auth, async (user) => { // Use async for await getDoc
    clearMessages(); // Clear messages on auth state change
    if (user) {
        console.log("User is logged in:", user.uid);
        const userDocRef = doc(db, 'users', user.uid); // V9 doc reference

        try {
            const docSnap = await getDoc(userDocRef); // V9 getDoc

            if (docSnap.exists()) {
                const userData = docSnap.data();

                // Populate current username fields (optional, good for UX)
                updateFirstNameInput.value = userData.firstName || '';
                updateLastNameInput.value = userData.lastName || '';

                // Update sidebar profile display
                if (profileNameElement) profileNameElement.textContent = `${userData.lastName || ''}, ${userData.firstName || ''}`;
                if (profilePositionElement) profilePositionElement.textContent = userData.position || 'Employee'; // Default to Employee if missing?

                // Show "Create New Account" section ONLY for Admins
                if (userData.position === 'Admin') {
                    if (createAccountSection) createAccountSection.style.display = 'block';
                } else {
                    if (createAccountSection) createAccountSection.style.display = 'none';
                }
            } else {
                console.error("No user data found in Firestore for UID:", user.uid);
                if (errorMessage) errorMessage.textContent = "Could not load user profile data.";
                // Consider logging out user if profile data is essential and missing
                // await signOut(auth);
            }
        } catch (error) {
            console.error("Error getting user data:", error);
            if (errorMessage) errorMessage.textContent = "Error loading user profile.";
        }

    } else {
        console.log("User is logged out.");
        // Redirect to login page if not already there
        // Check current path carefully to avoid redirect loops
        if (!window.location.pathname.toUpperCase().includes('LOGIN.HTML')) {
            window.location.href = 'http://127.0.0.1:5500/ADMIN/LOGIN/LOGIN.html'; // Adjust path as needed
        }
    }
});

// --- Event Listener for Change Username ---
if (changeUsernameForm) {
    changeUsernameForm.addEventListener('submit', async (e) => { // Use async for await updateDoc
        e.preventDefault();
        clearMessages();

        const newFirstName = updateFirstNameInput.value.trim();
        const newLastName = updateLastNameInput.value.trim();
        const user = auth.currentUser; // Get current user

        if (!user) {
            if (errorMessage) errorMessage.textContent = "No user logged in. Please refresh.";
            return;
        }
        if (!newFirstName || !newLastName) {
            if (errorMessage) errorMessage.textContent = "First and Last Name cannot be empty.";
            return;
        }

        const userDocRef = doc(db, 'users', user.uid); // V9 doc reference

        try {
            await updateDoc(userDocRef, { // V9 updateDoc
                firstName: newFirstName,
                lastName: newLastName
            });
            console.log("Username updated successfully in Firestore.");
            if (statusMessage) statusMessage.textContent = "Username updated successfully!";

            // Update sidebar display immediately
            if (profileNameElement) profileNameElement.textContent = `${newLastName}, ${newFirstName}`;

        } catch (error) {
            console.error("Error updating username:", error);
            if (errorMessage) errorMessage.textContent = "Error updating username: " + error.message;
        }
    });
}

// --- Event Listener for Change Password ---
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => { // Use async for await reauthenticate/update
        e.preventDefault();
        clearMessages();

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;
        const user = auth.currentUser;

        if (!user) {
            if (errorMessage) errorMessage.textContent = "No user logged in. Please refresh.";
            return;
        }
        if (!currentPassword || !newPassword || !confirmNewPassword) {
             if (errorMessage) errorMessage.textContent = "Please fill all password fields.";
             return;
        }
        if (newPassword !== confirmNewPassword) {
            if (errorMessage) errorMessage.textContent = "New passwords do not match.";
            return;
        }
        if (newPassword.length < 6) {
            if (errorMessage) errorMessage.textContent = "New password should be at least 6 characters.";
            return;
        }

        // Re-authenticate user before changing password for security
        const credential = EmailAuthProvider.credential(user.email, currentPassword); // V9 credential

        try {
            await reauthenticateWithCredential(user, credential); // V9 reauthenticate
            // User re-authenticated successfully, now update password
            await updatePassword(user, newPassword); // V9 updatePassword

            console.log("Password updated successfully.");
            if (statusMessage) statusMessage.textContent = "Password updated successfully!";
            changePasswordForm.reset(); // Clear the form fields

        } catch (error) {
            console.error("Error updating password:", error);
            if (error.code === 'auth/wrong-password') {
                if (errorMessage) errorMessage.textContent = "Incorrect current password.";
            } else if (error.code === 'auth/weak-password') {
                if (errorMessage) errorMessage.textContent = "New password is too weak.";
            } else {
                if (errorMessage) errorMessage.textContent = "Error updating password: " + error.message;
            }
        }
    });
}

// --- Event Listener for Create New Account ---
if (createAccountForm) {
    createAccountForm.addEventListener('submit', async (e) => { // Use async for await createUser/setDoc
        e.preventDefault();
        clearMessages();

        const firstName = createFirstNameInput.value.trim();
        const lastName = createLastNameInput.value.trim();
        const email = createEmailInput.value.trim();
        const password = createPasswordInput.value;
        const confirmPassword = createConfirmPasswordInput.value;
        const position = createPositionSelect.value;

        // Validations
        if (!firstName || !lastName || !email || !password || !confirmPassword || !position) {
            if (errorMessage) errorMessage.textContent = "Please fill out all fields.";
            return;
        }
        if (password !== confirmPassword) {
            if (errorMessage) errorMessage.textContent = "Passwords do not match.";
            return;
        }
        if (password.length < 6) {
            if (errorMessage) errorMessage.textContent = "Password should be at least 6 characters long.";
            return;
        }

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password); // V9 createUser
            const newUser = userCredential.user;
            console.log("User created in Auth:", newUser.uid);

            // Now, create the user profile document in Firestore
            const newUserDocRef = doc(db, 'users', newUser.uid); // V9 doc ref
            await setDoc(newUserDocRef, { // V9 setDoc
                firstName: firstName,
                lastName: lastName,
                email: email, // Store email here too
                position: position,
                createdAt: serverTimestamp() // V9 serverTimestamp
            });

            console.log("User profile created in Firestore.");
            if (statusMessage) statusMessage.textContent = `Account for ${email} created successfully!`;
            createAccountForm.reset(); // Clear the form

        } catch (error) {
            console.error("Error creating new account:", error);
            if (error.code == 'auth/email-already-in-use') {
                if (errorMessage) errorMessage.textContent = 'The email address is already in use by another account.';
            } else if (error.code == 'auth/invalid-email') {
                if (errorMessage) errorMessage.textContent = 'The email address is not valid.';
            } else if (error.code == 'auth/weak-password') {
                if (errorMessage) errorMessage.textContent = 'The password is too weak.';
            } else {
                if (errorMessage) errorMessage.textContent = "Error creating account: " + error.message;
            }
        }
    });
}

// --- Logout Functionality ---
if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => { // Use async for await signOut
        e.preventDefault();
        clearMessages();
        console.log("Logout button clicked");
        try {
            await signOut(auth); // V9 signOut
            console.log('User signed out successfully');
            // Redirect will be handled by onAuthStateChanged
            // window.location.href = 'http://127.0.0.1:5500/ADMIN/LOGIN/LOGIN.html'; // Optional explicit redirect
        } catch (error) {
            console.error('Sign out error', error);
            if (errorMessage) errorMessage.textContent = "Error signing out: " + error.message;
        }
    });
} else {
    console.error("Logout button not found!"); // Add this check
}

console.log("SETTINGS.js loaded and listeners attached."); // Confirmation message