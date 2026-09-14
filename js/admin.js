import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { auth } from "./firebase.js";

import { levels } from "./levels.js";
import { setSaveHandler } from "./game.js";

// ==================================================
// DOM
// ==================================================

const accessScreen = document.getElementById("accessScreen");
const builderApp = document.getElementById("builderApp");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const accessMessage = document.getElementById("accessMessage");
const returnToGameBtn = document.getElementById("returnToGameBtn");
const logoutBtn = document.getElementById("logoutBtn");
const levelCanvas = document.getElementById("levelCanvas");
const canvasViewport = document.getElementById("canvasViewport");
const ctx = levelCanvas.getContext("2d");
const toolStatus = document.getElementById("toolStatus");
const coordinateStatus = document.getElementById("coordinateStatus");
const objectCount = document.getElementById("objectCount");
const saveStatus = document.getElementById("saveStatus");
const adminUserLabel = document.getElementById("adminUserLabel");
const levelNumberInput = document.getElementById("levelNumberInput");
const worldWidthInput = document.getElementById("worldWidthInput");
const worldHeightInput = document.getElementById("worldHeightInput");
const inspector = document.getElementById("objectInspector");
const selectionMessage = document.getElementById("selectionMessage");
const inspectorType = document.getElementById("inspectorType");
const inspectorX = document.getElementById("inspectorX");
const inspectorY = document.getElementById("inspectorY");
const inspectorWidth = document.getElementById("inspectorWidth");
const inspectorHeight = document.getElementById("inspectorHeight");
const widthField = document.getElementById("widthField");
const heightField = document.getElementById("heightField");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const loadLevelBtn = document.getElementById("loadLevelBtn");
const newLevelBtn = document.getElementById("newLevelBtn");
const exportBtn = document.getElementById("exportBtn");

// ==================================================
// STATE
// ==================================================

const TOOLS = {
    SELECT: "select",
    PLATFORM: "platform",
    SPIKE: "spike",
    FIREFLY: "firefly",
    CHECKPOINT: "checkpoint",
    GOAL: "goal",
    ERASER: "eraser"
};

let currentTool = TOOLS.SELECT;
let currentLevel = createEmptyLevel();
let selectedObject = null;
let dragState = null;
let isDrawingObject = false;
let drawingStart = null;
let mousePosition = {
    x: 0,
    y: 0
};

// ==================================================
// HISTORY
// ==================================================

let history = [];
let historyIndex = -1;


// ==================================================
// LEVEL CREATION
// ==================================================

function createEmptyLevel() {
    return {
        platforms: [],
        spikes: [],
        fireflies: [],
        checkpoints: [],
        goal: {
            x: 2650,
            y: 220,
            width: 55,
            height: 80
        }
    };
}

// ==================================================
// ACCESS CONTROL
// ==================================================

function showAccessMessage(message) {
    accessMessage.textContent = message;
}

async function checkAdmin(user) {
    if (!user) {
        return false;
    }

    try {
        const tokenResult = await user.getIdTokenResult(true);
        return tokenResult.claims.admin === true;
    } catch (error) {
        console.error("Could not check admin status:", error);
        return false;
    }
}

function showBuilder(user) {
    accessScreen.classList.add("hidden");
    builderApp.classList.remove("hidden");
    adminUserLabel.textContent = user.email || "Administrator";
    resizeCanvas();
    resetHistory();
    render();
    setSaveStatus("Ready");
}

function showAccessScreen(message) {
    builderApp.classList.add("hidden");
    accessScreen.classList.remove("hidden");

    if (message) {
        showAccessMessage(message);
    }
}

// ==================================================
// AUTHENTICATION
// ==================================================

adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showAccessMessage("Signing in...");

    try {
        await signInWithEmailAndPassword(
            auth,
            adminEmail.value.trim(),
            adminPassword.value
        );
    } catch (error) {
        console.error(error);
        if (error.code === "auth/invalid-credential") {
            showAccessMessage("Email or password is incorrect.");
        } else if (error.code === "auth/invalid-email") {
            showAccessMessage("Please enter a valid email address.");
        } else {
            showAccessMessage("Could not sign in.");
        }
    }
});

returnToGameBtn.addEventListener("click", () => {
    window.location.href = "index.html";
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            showAccessMessage("Sign in with an administrator account.");
            return;
        }

        showAccessMessage("Checking administrator access...");

        const isAdmin = await checkAdmin(user);

        if (!isAdmin) {
            showAccessScreen("Access denied. This account is not an administrator.");
            return;
        }

        showBuilder(user);
    }
);

// ==================================================
// TOOL SELECTION
// ==================================================

document.querySelectorAll(".tool-button").forEach((button) => {
    button.addEventListener("click", () => {
        setTool(button.dataset.tool);
    });
});

function setTool(tool) {
    currentTool = tool;

    document.querySelectorAll(".tool-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
    });

    const toolNames = {
        select: "Select tool",
        platform: "Platform tool",
        spike: "Spike tool",
        firefly: "Firefly tool",
        checkpoint: "Checkpoint tool",
        goal: "Goal tool",
        eraser: "Eraser tool"
    };

    toolStatus.textContent = toolNames[tool] || "Select tool";

    levelCanvas.style.cursor = tool === TOOLS.SELECT ? "default" : "crosshair";
}

// ==================================================
// CANVAS / WORLD
// ==================================================

function resizeCanvas() {
    const width = Math.max(960, Number(worldWidthInput.value) || 3000);
    const height = Math.max(540, Number(worldHeightInput.value) || 540);

    levelCanvas.width = width;
    levelCanvas.height = height;
    levelCanvas.style.widows = `${width}px`;
    levelCanvas.style.height = `${height}px`;

    render();
}

worldWidthInput.addEventListener("change", () => {
    const oldWidth = levelCanvas.width;
    const newWidth = Math.max(960, Number(worldWidthInput.value) || 3000);
    if (newWidth !== oldWidth) {
        levelCanvas.width = newWidth;
        levelCanvas.style.width = `${newWidth}px`;
    }

    render();
});

worldHeightInput.addEventListener("change", () => {
    const oldHeight = levelCanvas.height;
    const newHeight = Math.max(540, Number(worldHeightInput.value) || 540);

    if (newHeight !== oldHeight) {
        levelCanvas.height = newHeight;
        levelCanvas.style.height = `${newHeight}px`;
    }

    render();
});

// ==================================================
// CANVAS COORDINATES
// ==================================================

function getCanvasPosition(event) {
    const rect = levelCanvas.getBoundingClientRect();
    const scaleX = levelCanvas.width / rect.width;
    const scaleY = levelCanvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

// ==================================================
// MOUSE POSITION
// ==================================================

levelCanvas.addEventListener("mousemove", (event) => {
    mousePosition = getCanvasPosition(event);
    coordinateStatus.textContent = `X: ${Math.round(mousePosition.x)} | Y: ${Math.round(mousePosition.y)}`;
    handlePointerMove(mousePosition);
    render();
});

// ==================================================
// POINTER DOWN
// ==================================================

levelCanvas.addEventListener("pointerdown", (event) => {
    if(event.button !== 0) {
        return;
    }

    const position = getCanvasPosition(event);
    levelCanvas.setPointerCapture(event.pointerId);
    handlePointerDown(position);
});


// ==================================================
// POINTER MOVE
// ==================================================

levelCanvas.addEventListener("pointermove", (event) => {
    const position = getCanvasPosition(event);
    mousePosition = position;
    coordinateStatus.textContent = `X: ${Math.round(position.x)} | Y ${Math.round(position.y)}`;
    handlePointerMove();
});


// ==================================================
// POINTER UP
// ==================================================

levelCanvas.addEventListener("pointerup", (event) => {
    const position = getCanvasPosition(event);
    if (levelCanvas.hasPointerCapture(event.pointerId)) {
        levelCanvas.releasePointerCapture(event.pointerId);
    }
    handlePointerUp(position);
    render();
});


// ==================================================
// POINTER DOWN LOGIC
// ==================================================

function handlePointerDown(position) {{
    if (currentTool === TOOLS.SELECT) {
        const object = findObjectAt(position.x, position.y);
        selectedObject = object;

        if (object) {
            dragState = {
                object,
                startX: object.x,
                startY: object.y,
                mouseStartX: position.x,
                mouseStartY: position.y
            };
        } else {
            dragState = null;
        }

        updateInspector();
        render();
        return;
    }

    if (currentTool === TOOLS.ERASER) {
        const object = findObjectAt(position.x, position.y);

        if (object) {
            deleteObject(object);
        }
        return;
    }

    if (currentTool === TOOLS.PLATFORM || currentTool === TOOLS.SPIKE) {
        isDrawingObject = true;
        drawingStart = {
            x: position.x,
            y: position.y
        };
        return;
    }

    if (currentTool === TOOLS.FIREFLY) {
        addFirefly(position.x, position.y);
        return;
    }

    if (currentTool === TOOLS.CHECKPOINT) {
        addCheckpoint(position.x, position.y);
        return;
    }

    if (currentTool === TOOLS.GOAL) {
        setGoal(position.x, position.y);
    }
}}


// ==================================================
// POINTER MOVE LOGIC
// ==================================================

function handlePointerMove(position) {

    if(currentTool === TOOLS && dragState) {
        const object = dragState.object;

        object.x = dragState.startX + (position.x - dragState.mouseStartX);
        object.y = dragState.startY + (position.y - dragState.mouseStartY);

        clampObjectToWorld(object);

        updateInspector();

        render();
        return;
    }

    if (isDrawingObject && drawingStart) {
        render();

        drawPreviewRectangle(drawingStart.x, drawingStart.y, position.x, position.y);
    }
}


// ==================================================
// POINTER UP LOGIC
// ==================================================

function handlePointerUp(position) {

    if (currentTool === TOOLS.SELECT) {

        if (dragState) {
            
            const object = dragState.object;

            const moved = object.x !== dragState.startX || object.y !== dragState.startY;

            if (moved) {
                recordHistory();
            }
        }

        dragState = null;
        return;
    }

    if (currentTool === TOOLS.PLATFORM || currentTool === TOOLS.SPIKE) {

        if (isDrawingObject && drawingStart) {
            const rectangle = normalizeRectangle(drawingStart.x, drawingStart.y, position.x, position.y);

            if (rectangle.width >= 10 && rectangle.height >= 5) {
                if (currentLevel === TOOLS.PLATFORM) {
                    currentLevel.platforms.push(rectangle);
                } else {
                    currentLevel.spikes.push(rectangle);
                }

                recordHistory();
            }
        }

        isDrawingObject = false;
        drawingStart = null;
        render();
    }
}


// ==================================================
// RECTANGLE HELPERS
// ==================================================

function normalizeRectangle(x1, y1, x2, y2) {
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
    };
}

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function clampObjectToWorld(object) {
    const worldWidth = levelCanvas.width;
    const worldHeight = levelCanvas.height;

    if (object.type === "firefly") {
        object.x = clamp(object.x, 0, worldWidth);
        object.y = clamp(object.y, 0, worldHeight);
        return;
    }
    object.x = clamp(object.x, 0, worldWidth - object.width);
    object.y = clamp(object.y, 0, worldHeight - object.height);
}


// ==================================================
// OBJECT CREATION
// ==================================================

function addFirefly(x, y) {
    currentLevel.fireflies.push({
        x: Math.round(x),
        y: Math.round(y)
    });

    recordHistory();
    render();
}

function addCheckpoint(x, y) {
    const width = 24;
    const height = 60;

    const object = {
        x: Math.round(x - width / 2),
        y: Math.round(y - height / 2),
        width,
        height
    };

    currentLevel.checkpoints.push(object);

    recordHistory();
    render();
}

function setGoal(x, y) {
    currentLevel.goal = {
        x: Math.round(x - 27),
        y: Math.round(y - 40),
        width: 55,
        height: 80
    };

    recordHistory();
    render();
}


// ==================================================
// FIND OBJECTS
// ==================================================

function findObjectAt(x, y) {
    const objectTypes = [
        [
            "goal",
            currentLevel.goal
        ],

        [
            "checkpoints",
            currentLevel.checkpoints
        ],

        [
            "spikes",
            currentLevel.spikes
        ],

        [
            "platforms",
            currentLevel.platforms
        ]
    ];

    for (const [type, collection] of objectTypes) {
        if (Array.isArray(collection)) {
            for (let i = collection.length - 1; i >= 0; i--) {
                const object = collection[i];

                if (rectangleContainsPoint(object, x, y)) {
                    return {
                        type,
                        object,
                        index: i
                    };
                }
            }
        } else if (collection && rectangleContainsPoint(collection, x, y)) {
            return {
                type,
                object: collection,
                index: 0
            };
        }
    }

    for (let i = currentLevel.fireflies.length - 1; i >= 0; i--) {
        const firefly = currentLevel.fireflies[i];

        const distance = Math.sqrt((x - firefly.x) ** 2 + (y - firefly.y) ** 2);

        if (distance <= 15) {
            return {
                type: "fireflies",
                object: firefly,
                index: i
            };
        }
    }

    return null;
}

function rectangleContainsPoint(rectangle, x, y) {
    return (
        x >= rectangle.x &&
        x <= rectangle.x + rectangle.width &&
        y >= rectangle.y &&
        y <= rectangle.y + rectangle.height
    );
}


// ==================================================
// DELETE OBJECT
// ==================================================

function deleteObject(selected) {
    if (!selected) {
        return;
    }

    if (selected.type === "goal") {
        currentLevel.goal = {
            x: 0,
            y: 0,
            width: 35,
            height: 80
        };
    } else {
        currentLevel[selected.type].splice(selected.index, 1);
    }

    if (selectedObject === selected) {
        selectedObject = null;
    }

    recordHistory();
    updateInspector();
    render();
}

deleteSelectedBtn.addEventListener("click", () => {
    if (selectedObject) {
        deleteObject(selectedObject);
    }
});


// ==================================================
// KEYBOARD DELETE
// ==================================================

window.addEventListener("keydown", (event) => {
    if (event.key === "Delete" || event.key === "Backspace") {
        if (document.activeElement && (document.activeElement.tagName === "INPUT")) {
            return;
        }

        if (selectedObject) {
            deleteObject(selectedObject);
        }
    }

    if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
    }

    if (event.ctrlKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
    }
});


// ==================================================
// INSPECTOR
// ==================================================

function updateInspector() {
    if (!selectedObject) {
        inspector.classList.add("hidden");
        selectionMessage.textContent = "Select an object.";
        return;
    }

    inspector.classList.remove("hidden");
    selectionMessage.textContent = "Selected object";

    const {
        type,
        object
    } = selectedObject;

    inspectorType.value = type;
    inspectorX.value = Math.round(object.x);
    inspectorY.value = Math.round(object.y);

    const hasSize = object.width !== undefined && object.height !== undefined;

    widthField.classList.toggle("hidden", !hasSize);
    heightField.classList.toggle("hidden", !hasSize);

    if (hasSize) {
        inspectorWidth.value = Math.round(object.width);
        inspectorHeight.value = Math.round(object.height);
    }

    objectCount.textContent = `Objects: ${getObjectCount()}`;
}


// ==================================================
// INSPECTOR INPUTS
// ==================================================

inspectorX.addEventListener("change", () => {
    if (!selectedObject) {
        return;
    }

    selectedObject.object.x = Number(inspectorX.value);
    clampObjectToWorld(selectedObject.object);
    recordHistory();
    render();
});

inspectorY.addEventListener("change", () => {
    if (!selectedObject) {
        return;
    }

    selectedObject.object.y = Number(inspectorY.value);
    clampObjectToWorld(selectedObject.object);
    recordHistory();
    render();
});

inspectorWidth.addEventListener("change", () => {
    if (!selectedObject || selectedObject.type === "fireflies") {
        return;
    }

    selectedObject.object.width = Math.max(1, Number(inspectorWidth.value));
    clampObjectToWorld(selectedObject.object);

    recordHistory();
    render();
});

inspectorHeight.addEventListener("change", () => {
    if (!selectedObject || selectedObject.type === "fireflies") {
        return;
    }

    selectedObject.object.height = Math.max(1, Number(inspectorHeight.value));
    clampObjectToWorld(selectedObject.object);

    recordHistory();
    render();
});


// ==================================================
// HISTORY
// ==================================================

function cloneLevel(level) {
    return structuredClone(level);
}

function resetHistory() {
    history = [cloneLevel(currentLevel)];
    historyIndex = 0;
    updateHistoryButtons();
}

function recordHistory() {
    const snapshot = cloneLevel(currentLevel);

    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    historyIndex = history.length - 1;

    updateHistoryButtons();
}

function undo() {
    if (historyIndex <= 0) {
        return;
    }

    historyIndex--;

    currentLevel = cloneLevel(history[historyIndex]);

    selectedObject = null;

    updateInspector();
    render();
    setSaveStatus("Undo");
}

function redo() {
    if (historyIndex >= history.length - 1) {
        return;
    }

    historyIndex++;

    currentLevel = cloneLevel(history[historyIndex]);

    selectedObject = null;

    updateInspector();
    render();
    setSaveStatus("Redo");
}

function updateHistoryButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
}

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);


// ==================================================
// LOAD EXISTING LEVEL
// ==================================================

loadLevelBtn.addEventListener("click", () => {
    const levelNumber = Number(levelNumberInput.value);
    const source = levels[levelNumber];

    if (!source) {
        alert(`Level ${levelNumber} does not exist.`);
        return;
    }

    currentLevel = cloneLevel(source);

    worldWidthInput.value = calculateWorldWidth(currentLevel);
    worldHeightInput.value = 540;

    resizeCanvas();

    selectedObject = null;

    updateInspector();
    resetHistory();
    render();
    setSaveStatus(`Loaded Level ${levelNumber}`);
});

function calculateWorldWidth(level) {
    let width = 960;
    for (const platform of level.platforms || []) {
        width = Math.max(width, platform.x + platform.width + 100);
    }

    for (const spike of level.spikes || []) {
        width = Math.max(width, spike.x + spike.width + 100);
    }

    for (const firefly of level.fireflies || []) {
        width = Math.max(width, firefly.x + 100);
    }

    if (level.goal) {
        width = Math.max(width, level.goal.x + level.goal.width + 100);
    }

    return Math.ceil(width / 50) * 50;
}


// ==================================================
// NEW LEVEL
// ==================================================

newLevelBtn.addEventListener("click", () => {
    const confirmed = window.confirm("Create a new empty level?");

    if (!confirmed) {
        return;
    }

    currentLevel = createEmptyLevel();
    selectedObject = null;
    
    levelNumberInput.value = getNextLevelNumber();
    worldWidthInput.value = 3000;
    worldHeightInput.value = 540;

    resizeCanvas();
    updateInspector();
    resetHistory();
    render();
    setSaveStatus("New level");
});


function getNextLevelNumber() {
    const numbers = Object.keys(levels).map(Number).filter(Number.isFinite);

    if (numbers.length === 0) {
        return 1;
    }

    return (Math.max(...numbers) + 1);
}


// ==================================================
// EXPORT
// ==================================================

exportBtn.addEventListener("click", () => {
    const levelNumber = Math.max(1, Number(levelNumberInput.value) || 1);
    const cleanedLevel = cleanLevelForExport(currentLevel);

    const json = JSON.stringify(cleanedLevel, null, 4);

    const javascriptSnippet = `${levelNumber}: ${json},`;

    navigator.clipboard?.writeText(javascriptSnippet).catch(() => {});

    downloadTextFile(`level-${levelNumber}-snippet.txt`, javascriptSnippet);

    downloadTextFile(`level-${levelNumber}.json`, json);

    setSaveStatus(`Exported Level ${levelNumber}`);

    alert(
        "Export complete.\n\n" +
        "Two files were downloaded:\n" +
        `level-${levelNumber}.json\n` +
        `level-${levelNumber}-snippet.txt\n\n` +
        "The snippet file can be pasted into levels.js."
    );
});

function cleanLevelForExport(level) {
    return {
        platforms:
            level.platforms.map(
                (item) => ({
                    x: Math.round(item.x),
                    y: Math.round(item.y),
                    width: Math.round(item.width),
                    height: Math.round(item.height)
                })
            ),
        
        spikes:
            level.spikes.map(
                (item) => ({
                    x: Math.round(item.x),
                    y: Math.round(item.y),
                    width: Math.round(item.width),
                    height: Math.round(item.height)
                })
            ),

        fireflies:
            level.fireflies.map(
                (item) => ({
                    x: Math.round(item.x),
                    y: Math.round(item.y)
                })
            ),

        checkpoints:
            level.checkpoints.map(
                (item) => ({
                    x: Math.round(item.x),
                    y: Math.round(item.y),
                    width: Math.round(item.width),
                    height: Math.round(item.height)
                })
            ),

        goal: {
            x: Math.round(level.goal.x),
            y: Math.round(level.goal.y),
            width: Math.round(level.goal.width),
            height: Math.round(level.goal.height)
        }
    }
}

function downloadTextFile(filename, contents) {
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = filename;


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


// ==================================================
// STATUS
// ==================================================

function setSaveStatus(message) {
    saveStatus.textContent = message;
}


// ==================================================
// OBJECT COUNT
// ==================================================

function getObjectCount() {
    return (
        currentLevel.platforms.length +
        currentLevel.spikes.length +
        currentLevel.fireflies.length +
        currentLevel.checkpoints.length +
        1
    );
}


// ==================================================
// RENDER
// ==================================================

function render() {

    ctx.clearRect(
        0,
        0,
        levelCanvas.width,
        levelCanvas.height
    );


    drawBackground();
    drawGrid();
    drawPlatforms();
    drawSpikes();
    drawFireflies();
    drawCheckpoints();
    drawGoal();

    if (selectedObject) {
        drawSelection(selectedObject);
    }

    objectCount.textContent = `Objects: ${getObjectCount()}`;

    updateHistoryButtons();
}


// ==================================================
// BACKGROUND
// ==================================================

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, levelCanvas.height);

    gradient.addColorStop(0, "#0b1628");
    gradient.addColorStop(1, "#162333");

    ctx.fillStyle = gradient;

    ctx.fillRect(0, 0, levelCanvas.width, levelCanvas.height);

    // Moon
    ctx.fillStyle = "#fff0b0";

    ctx.beginPath();

    ctx.arc(
        750,
        100,
        35,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


// ==================================================
// GRID
// ==================================================

function drawGrid() {
    const gridSize = 50;

    ctx.strokeStyle = "rgba(160, 180, 210, 0.12)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= levelCanvas.width; x += gridSize) {
        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(x, levelCanvas.height);

        ctx.stroke();
    }


    for (let y = 0; y <= levelCanvas.height; y += gridSize) {
        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(levelCanvas.width, y);

        ctx.stroke();
    }
}


// ==================================================
// DRAW PLATFORMS
// ==================================================

function drawPlatforms() {
    for (const platform of currentLevel.platforms) {

        ctx.fillStyle = "#3d2c24";

        ctx.fillRect(
            platform.x,
            platform.y,
            platform.width,
            platform.height
        );


        ctx.fillStyle ="#435c3a";

        ctx.fillRect(
            platform.x,
            platform.y,
            platform.width,
            Math.min(12, platform.height)
        );
    }
}


// ==================================================
// DRAW SPIKES
// ==================================================

function drawSpikes() {
    for (const spikeArea of currentLevel.spikes) {

        const spikeWidth =20;

        const spikeCount = Math.ceil(spikeArea.width / spikeWidth);

        for (let i = 0; i < spikeCount; i++) {
            
            const x = spikeArea.x + i * spikeWidth;
            const bottom = spikeArea.y + spikeArea.height;

            ctx.beginPath();

            ctx.moveTo(x, bottom);

            ctx.lineTo(x + spikeWidth / 2, spikeArea.y);

            ctx.lineTo(x + spikeWidth, bottom);

            ctx.closePath();


            ctx.fillStyle = "#d7dce3";
            ctx.fill();

            ctx.strokeStyle = "#59616d";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}


// ==================================================
// DRAW FIREFLIES
// ==================================================

function drawFireflies() {
    for (const firefly of currentLevel.fireflies) {

        const glow = ctx.createRadialGradient(
                firefly.x,
                firefly.y,
                2,
                firefly.x,
                firefly.y,
                25
            );

        glow.addColorStop(0, "rgba(255, 235, 120, 0.6)");
        glow.addColorStop(1,"rgba(255, 235, 120, 0)");

        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(
            firefly.x,
            firefly.y,
            25,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle = "#ffe98a";

        ctx.beginPath();

        ctx.arc(
            firefly.x,
            firefly.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// ==================================================
// DRAW CHECKPOINTS
// ==================================================

function drawCheckpoints() {
    for (const checkpoint of currentLevel.checkpoints) {

        ctx.fillStyle = "#5b4635";

        ctx.fillRect(
            checkpoint.x + 9,
            checkpoint.y + 15,
            6,
            45
        );

        ctx.fillStyle = "#fff19b";

        ctx.fillRect(
            checkpoint.x + 3,
            checkpoint.y,
            18,
            22
        );
    }
}


// ==================================================
// DRAW GOAL
// ==================================================

function drawGoal() {
    const goal = currentLevel.goal;

    ctx.fillStyle = "rgba(180, 210, 255, 0.12)";

    ctx.fillRect(
        goal.x - 20,
        goal.y - 20,
        goal.width + 40,
        goal.height + 40
    );


    ctx.fillStyle = "#55677f";

    ctx.fillRect(
        goal.x,
        goal.y,
        goal.width,
        goal.height
    );


    ctx.fillStyle = "#101a2b";

    ctx.fillRect(
        goal.x + 8,
        goal.y + 9,
        goal.width - 16,
        goal.height - 9
    );


    ctx.fillStyle = "#d8e9ff";
    ctx.font = "28px Arial";
    ctx.textAlign = "left";

    ctx.fillText(
        "✦",
        goal.x + 16,
        goal.y + 45
    );
}


// ==================================================
// SELECTION
// ==================================================

function drawSelection(selected) {
    if (!selected) {
        return;
    }

    const object =selected.object;

    ctx.save();


    ctx.strokeStyle = "#ffe98a";
    ctx.lineWidth = 3;

    if (selected.type === "fireflies") {

        ctx.beginPath();

        ctx.arc(
            object.x,
            object.y,
            12,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    } else {

        ctx.strokeRect(
            object.x - 3,
            object.y - 3,
            object.width + 6,
            object.height + 6
        );
    }

    ctx.restore();
}


// ==================================================
// PREVIEW RECTANGLE
// ==================================================

function drawPreviewRectangle(x1, y1, x2, y2) {
    const rectangle = normalizeRectangle(x1, y1, x2, y2);

    ctx.save();

    ctx.fillStyle = currentTool === TOOLS.PLATFORM
            ? "rgba(67, 92, 58, 0.65)"
            : "rgba(215, 220, 227, 0.5)";

    ctx.strokeStyle = "#ffe98a";
    ctx.lineWidth = 2;

    ctx.fillRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
    );

    ctx.strokeRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
    );

    ctx.restore();
}