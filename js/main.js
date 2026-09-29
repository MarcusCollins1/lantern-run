import { setupAuth } from "./auth.js";
import { loadPlayerData, createPlayerData, saveLevelResult } from "./player-data.js";
import { applyPlayerData, setSaveHandler, startGame } from "./game.js";

setSaveHandler(async ({ highestUnlockedLevel, levelNumber, levelResult }) => {
    const user = window.__lanternRunUser;
    if (!user) return;

    await saveLevelResult(user.uid, {
        highestUnlockedLevel,
        levelNumber,
        levelResult
    });
});

const auth = setupAuth({
    onSignedIn: async (user, { creatingAccount = false } = {}) => {
        try {
            let data;

            if (creatingAccount) {
                data = await createPlayerData(user.uid);
            } else {
                data = await loadPlayerData(user.uid);

                // Firebase knows this user, but Lantern Run doesn't.
                if (!data) {
                    window.__lanternRunUser = null;
                    return false;
                }
            }

            window.__lanternRunUser = user;
            applyPlayerData(data);

            return true;
        } catch (error) {
            console.error("Could not load player data:", error);
            window.__lanternRunUser = null;
            return false;
        }
    },

    onSignedOut: () => {
        window.__lanternRunUser = null;
    }
});

startGame();


const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
    await auth.logout();
});

const adminBtn = document.getElementById("adminBtn");
adminBtn.addEventListener("click", () => {
    location.href = "admin.html";
});