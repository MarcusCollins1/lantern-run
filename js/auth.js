import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { auth } from "./firebase.js";

let isSignUpMode = false;

function authErrorMessage(error) {
    switch (error.code) {
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/email-already-in-use":
            return "That email is already registered.";
        case "auth/weak-password":
            return "Password should be at least 6 characters.";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Email or password is incorrect.";
        default:
            return "Something went wrong. Please try again.";
    }
}

export function setupAuth({ onSignedIn, onSignedOut }) {
    const authScreen = document.getElementById("authScreen");
    const authForm = document.getElementById("authForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const authTitle = document.getElementById("authTitle");
    const authMessage = document.getElementById("authMessage");
    const switchAuthBtn = document.getElementById("switchAuthBtn");

    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        authMessage.textContent = "Please wait...";

        try {
            if (isSignUpMode) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }

            authMessage.textContent = "";
        } catch (error) {
            console.error(error);
            authMessage.textContent = authErrorMessage(error);
        }
    });

    switchAuthBtn.addEventListener("click", () => {
        isSignUpMode = !isSignUpMode;

        authTitle.textContent = isSignUpMode
            ? "Create an account"
            : "Sign in";

        authForm.querySelector("button").textContent = isSignUpMode
            ? "Create Account"
            : "Sign In";

        switchAuthBtn.textContent = isSignUpMode
            ? "Already have an account? Sign in"
            : "Create an account";

        authMessage.textContent = "";
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            authScreen.style.display = "none";
            await onSignedIn(user);
        } else {
            authScreen.style.display = "flex";
            onSignedOut();
        }
    });

    return {
        logout: () => signOut(auth)
    };
}
