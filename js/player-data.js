import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const COLLECTION = "lantern-run-users";

export async function loadPlayerData(uid) {
    const playerRef = doc(db, COLLECTION, uid);
    const snapshot = await getDoc(playerRef);

    if (snapshot.exists()) {
        return snapshot.data();
    }

    const startingData = {
        highestUnlockedLevel: 1,
        coins: 0,
        totalFireflies: 0,
        levels: {},
        upgrades: {
            speed: 1,
            jump: 1,
            lantern: 1
        }
    };

    await setDoc(playerRef, startingData);
    return startingData;
}

export async function saveLevelResult(uid, { highestUnlockedLevel, levelNumber, levelResult }) {
    const playerRef = doc(db, COLLECTION, uid);

    await setDoc(
        playerRef,
        {
            highestUnlockedLevel,
            levels: {
                [levelNumber]: levelResult
            }
        },
        { merge: true }
    );
}
