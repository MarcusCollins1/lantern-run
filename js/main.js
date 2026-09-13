import { setupAuth } from "./auth.js";
import { loadPlayerData, saveLevelResult } from "./player-data.js";
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
    onSignedIn: async (user) => {
        window.__lanternRunUser = user;

        try {
            const data = await loadPlayerData(user.uid);
            applyPlayerData(data);
        } catch (error) {
            console.error("Could not load player data:", error);
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
