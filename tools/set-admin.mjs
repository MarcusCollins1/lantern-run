import {
    initializeApp,
    applicationDefault
} from "firebase-admin/app";

import {
    getAuth
} from "firebase-admin/auth";


// ==================================================
// FIREBASE ADMIN INITIALIZATION
// ==================================================

initializeApp({
    credential: applicationDefault()
});

const auth = getAuth();


// ==================================================
// COMMAND LINE
// ==================================================

const email = process.argv[2];

if (!email) {
    console.error(
        "Usage:\n" +
        "node set-admin.mjs your-email@example.com"
    );
    process.exit(1);
}


// ==================================================
// FIND USER
// ==================================================

try {
    const user = await auth.getUserByEmail(email);
    if (!user.emailVerified) {
        console.error("This user's email address has not been verified.");

        process.exit(1);
    }
    const existingClaims = user.customClaims || {};
    const updatedClaims = {
        ...existingClaims,
        admin: true
    };

    await auth.setCustomUserClaims(user.uid, updatedClaims);

    console.log(`Administrator access granted to ${email}.`);
    console.log("The user must sign out and sign in again, or refresh their ID token, before the claim is available.");
} catch (error) {
    console.error("Could not set administrator access:");
    console.error(error);
    
    process.exit(1);
}