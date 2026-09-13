const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --------------------------------------------------
// VARIABLES
// --------------------------------------------------

let jumpPressed = false;
let collectedFireflies = 0;
let deaths = 0;
const respawnPoint = {
    x: 120,
    y: 300
}
const savedFirefliesIndices = [];
let levelComplete = false;
let isDying = false;
let deathTimer = 0;
const DEATH_DURATION = 40;
let screenShake = 0;
let currentLevel = 1;
const levelStartTime = performance.now();
let completionTime = 0;

// --------------------------------------------------
// INPUT
// --------------------------------------------------

const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
        if (!keys.space) {
            jumpPressed = true;
        }
        keys.space = true;
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;

    if (event.code === "Space") {
        keys.space = false;
    }
});

canvas.addEventListener("click", (event) => {
    if (!levelComplete) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (camera.height / rect.height);

    const button = {
        x: WIDTH / 2 - 110,
        y: 390,
        width: 220,
        height: 50
    };

    if (
        mouseX >= button.x &&
        mouseX <= button.x + button.width &&
        mouseY >= button.y &&
        mouseY <= button.y + button.height
    ) {
        if (levels[currentLevel + 1]) {
            loadLevel(currentLevel+1);
        }
    }
});

// --------------------------------------------------
// WORLD
// --------------------------------------------------

const levels = {
    1: {
        platforms: [
            { x: 0,    y: 470, width: 700, height: 70 },
            { x: 800,  y: 410, width: 300, height: 130 },
            { x: 1200, y: 350, width: 250, height: 190 },
            { x: 1550, y: 440, width: 350, height: 100 },
            { x: 2000, y: 380, width: 320, height: 160 },
            { x: 2450, y: 300, width: 300, height: 240 }
        ],

        spikes: [
            {
                x: 520,
                y: 450,
                width: 100,
                height: 20
            },
            {
                x: 900,
                y: 390,
                width: 80,
                height: 20
            },
            {
                x: 1280,
                y: 330,
                width: 80,
                height: 20
            },
            {
                x: 1650,
                y: 420,
                width: 100,
                height: 20
            },
            {
                x: 2100,
                y: 360,
                width: 100,
                height: 20
            }
        ],

        fireflies: [
            { x: 350, y: 390 },
            { x: 600, y: 330 },
            { x: 950, y: 330 },
            { x: 1320, y: 270 },
            { x: 1740, y: 370 },
            { x: 2140, y: 310 },
            { x: 2580, y: 230 }
        ],

        checkpoints: [
            {
                x: 1260,
                y: 290,
                width: 24,
                height: 60
            },
            {
                x: 2080,
                y: 320,
                width: 24,
                height: 60
            }
        ],

        goal: {
            x: 2650,
            y: 220,
            width: 55,
            height: 80
        }
    },

    2: {
        platforms: [
            { x: 0,    y: 470, width: 450, height: 70 },
            { x: 560,  y: 420, width: 220, height: 120 },
            { x: 900,  y: 350, width: 180, height: 190 },
            { x: 1180, y: 430, width: 180, height: 110 },
            { x: 1460, y: 330, width: 220, height: 210 },
            { x: 1810, y: 400, width: 200, height: 140 },
            { x: 2140, y: 300, width: 220, height: 240 },
            { x: 2500, y: 220, width: 350, height: 320 }
        ],

        spikes: [
            {
                x: 300,
                y: 450,
                width: 80,
                height: 20
            },
            {
                x: 630,
                y: 400,
                width: 60,
                height: 20
            },
            {
                x: 1500,
                y: 310,
                width: 80,
                height: 20
            },
            {
                x: 1850,
                y: 380,
                width: 80,
                height: 20
            },
            {
                x: 2200,
                y: 280,
                width: 80,
                height: 20
            }
        ],

        fireflies: [
            { x: 180, y: 390 },
            { x: 650, y: 350 },
            { x: 960, y: 280 },
            { x: 1240, y: 390 },
            { x: 1570, y: 260 },
            { x: 1880, y: 360 },
            { x: 2210, y: 230 },
            { x: 2650, y: 150 }
        ],

        checkpoints: [
            {
                x: 1180,
                y: 370,
                width: 24,
                height: 60
            },
            {
                x: 2140,
                y: 240,
                width: 24,
                height: 60
            }
        ],

        goal: {
            x: 2740,
            y: 140,
            width: 55,
            height: 80
        }
    }
};
let platforms = [];
let spikes = [];
let fireflies = [];
let checkpoints = [];
const goal = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

// --------------------------------------------------
// PLAYER
// --------------------------------------------------

const player = {
    x: 120,
    y: 300,

    width: 30,
    height: 44,

    vx: 0,
    vy: 0,

    speed: 0.8,
    maxSpeed: 5,

    jumpPower: 13,
    gravity: 0.65,

    grounded: false,

    facing: 1,

    animationTime: 0,
    animationState: "idle",

    landingTimer: 0,

    coyoteTimer: 0
};

// 
// LOAD LEVEL
// 

function loadLevel(levelNumber) {
    currentLevel = levelNumber;

    const level = levels[levelNumber];

    platforms.length = 0;
    spikes.length = 0;
    fireflies.length = 0;
    checkpoints.length = 0;

    platforms.push(
        ...level.platforms
    );

    spikes.push(
        ...level.spikes
    );

    for (const firefly of level.fireflies) {
        fireflies.push({
            ...firefly,
            collected: false
        });
    }

    for (const checkpoint of level.checkpoints) {
        checkpoints.push({
            ...checkpoint,
            active: false
        });
    }

    goal.x = level.goal.x;
    goal.y = level.goal.y;
    goal.width = level.goal.width;
    goal.height = level.goal.height;

    // Reset level state
    levelComplete = false;
    completionTime = 0;
    collectedFireflies = 0;
    deaths = 0;

    isDying = false;

    player.x = 120;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;

    camera.x = 0;

    respawnPoint.x = 120;
    respawnPoint.y = 300;

    levelStartTime = performance.now();
}

// --------------------------------------------------
// CAMERA
// --------------------------------------------------

const camera = {
    x: 0
};

// --------------------------------------------------
// PARTICLES
// --------------------------------------------------

const particles = [];

function createParticle(x, y) {
    particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 40 + Math.random() * 20
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i,1);
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life / 50;

        if (p.deathParticle) {
            ctx.fillStyle = "#e85d5d";
        } else {
            ctx.fillStyle = "#ffe58a";
        }


        ctx.beginPath();
        ctx.arc(
            p.x - camera.x,
            p.y,
            2,
            0,
            Math.PI * 2
        );

        ctx.fill()
    }
    ctx.globalAlpha = 1;
}

// --------------------------------------------------
// COLLISION
// --------------------------------------------------

function rectangleOverlap(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// --------------------------------------------------
// PLAYER UPDATE
// --------------------------------------------------

function updatePlayer() {
    const movingLeft = keys["a"] || keys["arrowleft"];
    const movingRight = keys["d"] || keys["arrowright"];

    // Horizontal movement
    if (movingLeft) {
        player.vx -= player.speed;
        player.facing = -1;
    }

    if (movingRight) {
        player.vx += player.speed;
        player.facing = 1;
    }

    // Friction
    if (!movingLeft && !movingRight) {
        player.vx *= 0.8
    }

    // Clamp speed
    player.vx = Math.max(
        -player.maxSpeed,
        Math.min(player.maxSpeed, player.vx)
    );

    // Jump
    if (
        jumpPressed &&
        (player.grounded || player.coyoteTimer > 0)
    ) {
        player.vy = -player.jumpPower;
        player.grounded = false;
        player.coyoteTimer = 0;
    }

    jumpPressed = false;

    // Gravity
    player.vy += player.gravity;

    // Remember where the player's feet were BEFORE moving vertically
    const previousBottom = player.y + player.height

    // Move player
    player.x += player.vx;
    player.y += player.vy

    const currentBottom = player.y + player.height;

    player.grounded = false;

    // Platform collision
    for (const platform of platforms) {
        const horizontallyOverlapping =
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width;
        
        const crossedPlatformTop =
            previousBottom <= platform.y &&
            currentBottom >= platform.y;

        const falling = player.vy >= 0;

        if (horizontallyOverlapping && crossedPlatformTop && falling) {
            // Put player's feet exactly on the platform
            player.y = platform.y - player.height;

            player.vy = 0;
            player.grounded = true;
            player.coyoteTimer = 8;

            break;
        }
    }

    // Coyote Time

    if (!player.grounded) {
        player.coyoteTimer --;
    }

    // Animation
    if (Math.abs(player.vx) > 0.2) {
        player.animationTime += 0.18;
    } else {
        player.animationTime += 0.05;
    }

    // Little dust particles while running
    if (
        player.grounded &&
        Math.abs(player.vx) > 2 &&
        Math.random() < 0.15
    ) {
        createParticle(
            player.x + player.width / 2,
            player.y + player.height
        );
    }

    // Falling off the map
    if (player.y > 700) {
        killPlayer();
    }
}

function resetPlayer() {
    player.x = respawnPoint.x;
    player.y = respawnPoint.y;
    player.vx = 0
    player.vy = 0;
}

function killPlayer() {
    if (isDying) {
        return;
    }

    deaths++;
    isDying = true;
    deathTimer = DEATH_DURATION;
    screenShake = 12;

    // Stop movement
    player.vx = 0;
    player.vy = 0;

    // Create a burst of particles
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,

            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,

            life: 30 + Math.random() * 20,

            deathParticle: true
        });
    }
    resetFireflies();
}

// --------------------------------------------------
// SPIKE UPDATE
// --------------------------------------------------

function updateSpikes() {
    for (const spike of spikes) {
        if (
            player.x < spike.x + spike.width &&
            player.x + player.width > spike.x &&
            player.y < spike.y + spike.height &&
            player.y + player.height > spike.y
        ) {
            killPlayer();
            return;
        }
    }
}

// --------------------------------------------------
// FIREFLY UPDATE
// --------------------------------------------------

function updateFireflies() {
    for (const firefly of fireflies) {
        if (firefly.collected) {
            continue;
        }

        const dx = player.x + player.width / 2 - firefly.x;
        const dy = player.y + player.height / 2 - firefly.y;

        const distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < 30) {
            firefly.collected = true;
            collectedFireflies++;

            // Collection particles
            for (let i = 0; i < 12; i++) {
                createParticle(firefly.x, firefly.y);
            }
        }
    }
}

function resetFireflies() {
    for (const [idx, firefly] of fireflies.entries()) {
        if (!savedFirefliesIndices.includes(idx)) {
            firefly.collected = false;
        }
    }
    collectedFireflies = savedFirefliesIndices.length;
}

// --------------------------------------------------
// CHECKPOINT UPDATE
// --------------------------------------------------

function updateCheckpoints() {
    for (const checkpoint of checkpoints) {
        if (checkpoint.active) {
            continue;
        }

        if (
            player.x < checkpoint.x + checkpoint.width &&
            player.x + player.width > checkpoint.x &&
            player.y < checkpoint.y + checkpoint.height &&
            player.y + player.height > checkpoint.y
        ) {
            // Only one active checkpoint
            for (const other of checkpoints) {
                other.active = false;
            }

            checkpoint.active = true;

            respawnPoint.x = checkpoint.x;
            respawnPoint.y = checkpoint.y - player.height;

            // Save fireflies
            savedFirefliesIndices.length = 0;
            for (const [idx, firefly] of fireflies.entries()) {
                if (firefly.collected) {
                    savedFirefliesIndices.push(idx);
                }
            }
        }
    }
}

// --------------------------------------------------
// GOAL UPDATE
// --------------------------------------------------

function updateGoal() {
    if (levelComplete) {
        return;
    }

    if (
        player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y
    ) {
        completionTime = (performance.now() - levelStartTime) / 1000;
        levelComplete = true;
    }
}

// --------------------------------------------------
// DEATH UPDATE
// --------------------------------------------------

function updateDeath() {
    if (!isDying) {
        return;
    }

    deathTimer--;

    if (deathTimer <= 0) {
        isDying = false;
        resetPlayer();
    }
}

// --------------------------------------------------
// SCREEN SHAKE UPDATE
// --------------------------------------------------

function updateScreenShake() {
    if (screenShake > 0) {
        screenShake *= 0.8;

        if (screenShake < 0.1) {
            screenShake = 0;
        }
    }
}

// --------------------------------------------------
// CAMERA
// --------------------------------------------------

function updateCamera() {
    const targetX = player.x - WIDTH * 0.35;

    camera.x += (targetX - camera.x) * 0.08;

    camera.x = Math.max(0, camera.x);
}

// --------------------------------------------------
// DRAW BACKGROUND
// --------------------------------------------------

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT
    );

    gradient.addColorStop(0, "#0b1628");
    gradient.addColorStop(1, "#162333");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Moon
    ctx.fillStyle = "#fff0b0";

    ctx.beginPath();
    ctx.arc(750, 100, 35, 0, Math.PI * 2);
    ctx.fill();

    // Distant hills
    ctx.fillStyle = "#111c2b"

    ctx.beginPath();
    ctx.moveTo(0, 430);

    for (let x = 0; x <= WIDTH; x += 120) {
        const y = 350 + Math.sin((x+camera.x * 0.15) * 0.01) * 50;

        ctx.lineTo(x, y);
    }

    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);

    ctx.fill();

    // Stars
    ctx.fillStyle = "#dce8ff";

    for (let i = 0; i < 40; i++) {
        const x = ((i * 137) % 1100) - (camera.x * 0.08 % 1100);
        const y = 30 + ((i * 71) % 180);

        ctx.fillRect(x, y, 2, 2);
    }
}

// --------------------------------------------------
// DRAW PLATFORMS
// --------------------------------------------------

function drawPlatforms() {
    for (const platform of platforms) {
        const screenX = platform.x - camera.x;

        // Dirt
        ctx.fillStyle = "#3d2c24";

        ctx.fillRect(
            screenX,
            platform.y,
            platform.width,
            platform.height
        );

        // Grass
        ctx.fillStyle = "#435c3a";

        ctx.fillRect(
            screenX,
            platform.y,
            platform.width,
            12
        );
    }
}

// --------------------------------------------------
// DRAW SPIKES
// --------------------------------------------------

function drawSpikes() {
    for (const spikeArea of spikes) {
        const startX = spikeArea.x - camera.x;

        const spikeWidth = 20;

        const spikeCount = Math.ceil(spikeArea.width / spikeWidth);

        for (let i=0; i < spikeCount; i++) {
            const x = startX + i * spikeWidth;

            const bottom = spikeArea.y + spikeArea.height;

            ctx.beginPath();

            ctx.moveTo(
                x,
                bottom
            );

            ctx.lineTo(
                x + spikeWidth / 2,
                spikeArea.y
            );

            ctx.lineTo(
                x + spikeWidth,
                bottom
            );

            ctx.closePath();

            // Main spike
            ctx.fillStyle = "#d7dce3";
            ctx.fill();

            // Dark edge
            ctx.strokeStyle = "#59616d";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// --------------------------------------------------
// DRAW FIREFLIES
// --------------------------------------------------

function drawFireflies() {
    for (const firefly of fireflies) {
        if (firefly.collected) {
            continue;
        }

        const x = firefly.x - camera.x;
        const pulse = Math.sin(performance.now() * 0.004 + firefly.x) * 0.25 + 0.75;

        // Glow
        const glow = ctx.createRadialGradient(
            x,
            firefly.y,
            2,
            x,
            firefly.y,
            25
        );
        glow.addColorStop(0, "rgba(255, 235, 120, 0.6)");
        glow.addColorStop(1, "rgba(255, 235, 120, 0)");

        ctx.fillStyle = glow;

        ctx.beginPath();
        ctx.arc(
            x,
            firefly.y,
            25,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Firefly
        ctx.globalAlpha = pulse;

        ctx.fillStyle = "#ffe98a";

        ctx.beginPath();
        ctx.arc(
            x,
            firefly.y,
            5,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// --------------------------------------------------
// DRAW CHECKPOINTS
// --------------------------------------------------

function drawCheckpoints() {
    for (const checkpoint of checkpoints) {
        const x = checkpoint.x - camera.x;

        // Post
        ctx.fillStyle = "#5b4635";

        ctx.fillRect(
            x + 9,
            checkpoint.y + 15,
            6,
            45
        );

        // Lantern
        ctx.fillStyle = checkpoint.active ? "#fff19b" : "#705f42";

        ctx.fillRect(
            x + 3,
            checkpoint.y,
            18,
            22
        );

        // Glow when active
        if (checkpoint.active) {
            const glow = ctx.createRadialGradient(
                x + 12,
                checkpoint.y + 10,
                3,
                x + 12,
                checkpoint.y + 10,
                55
            );
            glow.addColorStop(0, "rgba(255, 230, 120, 0.5)");
            glow.addColorStop(1, "rgba(255, 230, 120, 0)");

            ctx.fillStyle = glow;

            ctx.beginPath();

            ctx.arc(
                x + 12,
                checkpoint.y + 10,
                55,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }
}

// --------------------------------------------------
// DRAW CHECKPOINTS
// --------------------------------------------------

function drawGoal() {
    const x= goal.x - camera.x;

    const pulse = Math.sin(performance.now() * 0.004) * 0.15 + 0.85;

    // Glow
    const glow = ctx.createRadialGradient(
        x + goal.width / 2,
        goal.y + goal.height / 2,
        10,
        x + goal.width / 2,
        goal.y + goal.height / 2,
        90
    );
    glow.addColorStop(0, `rgba(180, 210, 255, ${0.35 * pulse})`);
    glow.addColorStop(1, "rgba(180, 210, 255, 0)");

    ctx.fillStyle = glow;

    ctx.beginPath();
    ctx.arc(
        x + goal.width / 2,
        goal.y + goal.height / 2,
        90,
        0,
        Math.PI * 2
    );

    ctx.fill()

    // Door frame
    ctx.fillStyle = "#55677f";

    ctx.fillRect(
        x,
        goal.y,
        goal.width,
        goal.height
    );

    // Door interior
    ctx.fillStyle = "#101a2b";

    ctx.fillRect(
        x + 8,
        goal.y + 9,
        goal.width - 16,
        goal.height - 9
    );

    // Symbol
    ctx.fillStyle = "#d8e9ff";

    ctx.font = "28px Arial";

    ctx.fillText("✦", x + 16, goal.y + 45);
}

// --------------------------------------------------
// PLAYER DRAWING / ANIMATION
// --------------------------------------------------

function drawPlayer() {
    if (isDying) {
        return;
    }

    const screenX = player.x - camera.x;
    const screenY = player.y;

    const moving = Math.abs(player.vx) > 0.2;

    // --------------------------------------------
    // DETERMINE ANIMATION STATE
    // --------------------------------------------

    if (!player.grounded) {
        if (player.vy < 0) {
            player.animationState = "jump";
        } else {
            player.animationState = "fall";
        }
    } else if (moving) {
        player.animationState = "run";
    } else {
        player.animationState = "idle";
    }

    // --------------------------------------------
    // ANIMATION VALUES
    // --------------------------------------------

    let bodyBob = 0;
    let legSwing = 0;
    let armSwing = 0;
    let bodySquash = 1;
    let lanternSwing = 0;

    // IDLE
    if (player.animationState === "idle") {
        bodyBob =
            Math.sin(player.animationTime) * 1.5;

        lanternSwing =
            Math.sin(player.animationTime * 0.8) * 2;
    }

    // RUN
    if (player.animationState === "run") {
        legSwing =
            Math.sin(player.animationTime) * 7;

        armSwing =
            Math.sin(player.animationTime) * 4;

        bodyBob =
            Math.abs(Math.sin(player.animationTime)) * 2;

        lanternSwing =
            Math.sin(player.animationTime + 0.5) * 4;
    }

    // JUMP
    if (player.animationState === "jump") {
        legSwing = 3;
        armSwing = 7;
        bodySquash = 0.95;
    }

    // FALL
    if (player.animationState === "fall") {
        legSwing = -2;
        armSwing = 5;
    }

    // --------------------------------------------
    // DRAW POSITION
    // --------------------------------------------

    const x = screenX;
    const y = screenY + bodyBob;

    const centerX = x + player.width / 2;

    // --------------------------------------------
    // LANTERN GLOW
    // --------------------------------------------

    const lanternX =
        centerX - 7 + lanternSwing;

    const lanternY =
        y + 27;

    const glow = ctx.createRadialGradient(
        lanternX,
        lanternY,
        5,
        lanternX,
        lanternY,
        80
    );

    glow.addColorStop(
        0,
        "rgba(255,220,110,0.28)"
    );

    glow.addColorStop(
        1,
        "rgba(255,220,110,0)"
    );

    ctx.fillStyle = glow;

    ctx.beginPath();
    ctx.arc(
        lanternX,
        lanternY,
        80,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------
    // LEGS
    // --------------------------------------------

    ctx.strokeStyle = "#24313d";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        x + 10,
        y + 31
    );

    ctx.lineTo(
        x + 8 + legSwing,
        y + 44
    );

    ctx.moveTo(
        x + 20,
        y + 31
    );

    ctx.lineTo(
        x + 22 - legSwing,
        y + 44
    );

    ctx.stroke();

    // --------------------------------------------
    // BODY
    // --------------------------------------------

    const bodyHeight = 23 * bodySquash;

    ctx.fillStyle = "#728ba3";

    ctx.fillRect(
        x + 6,
        y + 12,
        18,
        bodyHeight
    );

    // --------------------------------------------
    // HEAD
    // --------------------------------------------

    ctx.fillStyle = "#d8c0a0";

    ctx.beginPath();

    ctx.arc(
        x + 15,
        y + 7,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------
    // HOOD / HAIR
    // --------------------------------------------

    ctx.fillStyle = "#303b48";

    ctx.beginPath();

    ctx.arc(
        x + 15,
        y + 4,
        10,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------
    // ARM
    // --------------------------------------------

    ctx.strokeStyle = "#d8c0a0";
    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(
        x + 5,
        y + 17
    );

    ctx.lineTo(
        x - 1 - armSwing,
        y + 25
    );

    ctx.stroke();

    // --------------------------------------------
    // LANTERN
    // --------------------------------------------

    ctx.fillStyle = "#f7ce55";

    ctx.fillRect(
        lanternX,
        lanternY,
        7,
        9
    );

    // --------------------------------------------
    // EYE
    // --------------------------------------------

    ctx.fillStyle = "#1a1f25";

    const eyeOffset =
        player.facing === 1 ? 3 : -3;

    ctx.fillRect(
        x + 15 + eyeOffset,
        y + 6,
        2,
        2
    );
}

// --------------------------------------------------
// DRAW DEATH EFFECT
// --------------------------------------------------

function drawDeathEffect() {
    if (!isDying) {
        return;
    }

    const progress = 1 - deathTimer / DEATH_DURATION;

    ctx.fillStyle = `rgba(255, 80, 80, ${0.15 * (1-progress)})`;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    ctx.textAlign = "center";

    ctx.fillStyle = `rgba(255, 230, 230, ${1-progress})`;
    ctx.font = "bold 28px Arial";

    ctx.fillText("OUCH!", WIDTH / 2, 140);

    ctx.textAlign = "left";
}

// --------------------------------------------------
// DRAW LEVEL COMPLETE
// --------------------------------------------------

function drawLevelComplete() {
    if (!levelComplete) {
        return;
    }

    // Dark overlay
    ctx.fillStyle = "rgba(5, 10, 18, 0.82)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = "center";

    // Title
    ctx.fillStyle = "#ffe98a";
    ctx.font = "bold 48px Arial";

    ctx.fillText("LEVEL COMPLETE", WIDTH / 2, 190);

    // Stats
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";

    ctx.fillText(`Fireflies: ${collectedFireflies} / ${fireflies.length}`, WIDTH / 2, 250);
    ctx.fillText(`Deaths: ${deaths}`, WIDTH / 2, 290);
    ctx.fillText(`Time: ${completionTime.toFixed(1)} seconds`, WIDTH / 2, 330);

    // Rating
    let rating = "GOOD RUN!";
    if (
        collectedFireflies === fireflies.length &&
        deaths === 0
    ) {
        rating = "PERFECT RUN!";
    } else if (collectedFireflies === fireflies.length) {
        rating = "COMPLETE COLLECTION!";
    }

    ctx.fillStyle = "#f4d66d";
    ctx.font = "bold 28px Arial";

    ctx.fillText(rating, WIDTH / 2, 335);
    
    // Buttons
    const nextLevelExists = levels[currentLevel+1] !== undefined;
    const buttonText = nextLevelExists ? "NEXT LEVEL" : "BACK TO LEVEL SELECT";
    drawButton(WIDTH / 2 - 110, 390, 220, 50, buttonText);

    ctx.textAlign = "left";
}

// --------------------------------------------------
// DRAW BUTTON
// --------------------------------------------------

function drawButton(x, y, width, height, text) {
    ctx.fillStyle = "#34475a";

    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "#ffe98a";
    ctx.lineWidth = 2;

    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";

    ctx.textAlign = "center";

    ctx.fillText(text, x + width / 2, y + height / 2 + 6);

    ctx.textAlign = "left";
}

// --------------------------------------------------
// HUD
// --------------------------------------------------

function drawHUD() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";

    ctx.fillRect(
        20,
        20,
        210,
        100
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";

    ctx.fillText(
        `Level ${currentLevel}`,
        35,
        48
    );

    ctx.fillStyle = "#ffe98a";
    ctx.font = "18px Arial";

    ctx.fillText(
        `Fireflies: ${collectedFireflies} / ${fireflies.length}`,
        35,
        75
    );

    const currentTime =
        levelComplete
            ? completionTime
            : (performance.now() - levelStartTime) / 1000;

    ctx.fillText(
        `Time: ${currentTime.toFixed(1)}s`,
        35,
        102
    );
}

// --------------------------------------------------
// GAME LOOP
// --------------------------------------------------

function update() {
    if (levelComplete) {
        return;
    }

    if (isDying) {
        updateDeath();
        updateParticles();
        updateScreenShake();
        return;
    }

    updatePlayer();
    updateCamera();
    updateParticles();
    updateFireflies();
    updateSpikes();
    updateCheckpoints();
    updateGoal();
}

function draw() {
    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;

    ctx.save();

    ctx.translate(shakeX, shakeY);

    drawBackground();
    drawPlatforms();
    drawSpikes();
    drawCheckpoints();
    drawGoal();
    drawFireflies();
    drawParticles();
    drawPlayer();
    
    ctx.restore();

    drawHUD();
    drawLevelComplete();
    drawDeathEffect();
}

function gameLoop() {
    update();
    draw();

    requestAnimationFrame(gameLoop);
}

loadLevel(1);
gameLoop();