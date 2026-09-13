const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --------------------------------------------------
// INPUT
// --------------------------------------------------

const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
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

// --------------------------------------------------
// WORLD
// --------------------------------------------------

const platforms = [
    { x: 0,    y: 470, width: 700, height: 70 },
    { x: 800,  y: 410, width: 300, height: 130 },
    { x: 1200, y: 350, width: 250, height: 190 },
    { x: 1550, y: 440, width: 350, height: 100 },
    { x: 2000, y: 380, width: 320, height: 160 },
    { x: 2450, y: 300, width: 300, height: 240 }
];

const fireflies = [
    { x: 350, y: 390 },
    { x: 600, y: 330 },
    { x: 950, y: 330 },
    { x: 1320, y: 270 },
    { x: 1740, y: 370 },
    { x: 2140, y: 310 },
    { x: 2580, y: 230 }
]

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

    coyoteTimer: 0
};

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
        ctx.globalAlpha = p.life / 60;

        ctx.fillStyle = "#ffe58a"

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
        keys.space &&
        (player.grounded || player.coyoteTimer > 0)
    ) {
        player.vy = -player.jumpPower;
        player.grounded = false;
        player.coyoteTimer = 0;
    }

    // Gravity
    player.vy += player.gravity;

    // Horizontal movement
    player.x += player.vx

    // Vertical movement
    player.y = player.vy

    player.grounded = false;

    // Platform collision
    for (const platform of platforms) {
        const wasAbove = player.y + player.height - player.vy <= platform.y;

        if (
            rectangleOverlap(player, platform) &&
            player.vy >= 0 &&
            wasAbove
        ) {
            player.y = platform.y - player.height;
            player.vy = 0
            player.grounded = true;
            player.coyoteTimer = 8;
        }
    }

    if (!player.grounded) {
        player.coyoteTimer --;
    }

    // Animation
    if (Math.abs(player.vx) > 0.2) {
        player.animationTime += 0.18;
    } else {
        player.animationTime += 0.05;
    }

    // Falling off the map
    if (player.y > 700) {
        resetPlayer();
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
}

function resetPlayer() {
    player.x = 120;
    player.y = 300;
    player.vx = 0
    player.vy = 0;
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
// BACKGROUND
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
// PLATFORMS
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
// FIREFLIES
// --------------------------------------------------

function drawFireflies() {
    for (const firefly of fireflies) {
        const x = firefly.x - camera.x;
        const pulse = Math.sin(performance.now() * 0.004 + firefly.x) * 0.25 + 0.75;

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
// PLAYER DRAWING / ANIMATION
// --------------------------------------------------

function drawPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y;
    const moving = Math.abs(player.x) > 0.3;

    let bob = 0;
    let legSwing = 0;
    let armSwing = 0;

    // Idle animation
    if (!moving && player.grounded) {
        bob = Math.sin(player.animationTime) * 1.5;
    }

    // Walking animation
    if (moving && player.grounded) {
        legSwing = Math.sin(player.animationTime) * 7;
        armSwing = Math.sin(player.animationTime) * 4;
    }

    // Jump pose
    if (!player.grounded) {
        legSwing = 3;
        armSwing = 6;
    }

    const x = screenX;
    const y = screenY + bob;

    // Lantern glow
    const glow = ctx.createRadialGradient(
        x + player.width / 2,
        y + 20,
        5,
        x + player.width / 2,
        y + 20,
        80
    );
    glow.addColorStop(0, "rgba(255, 220, 110, 0.25)");
    glow.addColorStop(1, "rgba(255, 220, 110, 0)");

    ctx.fillStyle = glow;

    ctx.beginPath();
    ctx.arc(
        x + player.width / 2,
        y + 20,
        80,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Legs
    ctx.strokeStyle = "#24313d";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        x + 10,
        y + 33
    );

    ctx.lineTo(
        x + 8 + legSwing,
        y + 44
    );

    ctx.moveTo(
        x + 20,
        y + 33
    );

    ctx.lineTo(
        x + 22 - legSwing,
        y + 44
    );

    ctx.stroke();

    // Body
    ctx.fillStyle = "#728ba3"

    ctx.fillRect(
        x + 6,
        y + 12,
        18,
        23
    );

    // Head
    ctx.fillStyle = "#d8c0a0";

    ctx.beginPath();
    ctx.arc(
        x + 15,
        y + 8,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Hair / hood
    ctx.fillStyle = "#303b48";

    ctx.beginPath();
    ctx.arc(
        x + 15,
        y + 5,
        10,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    // Arm
    ctx.strokeStyle = "#d8c0a0";
    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(
        x + 5,
        y + 16
    );

    ctx.lineTo(
        x - 1 - armSwing,
        y + 25
    );

    ctx.stroke();

    // Lantern
    ctx.fillStyle = "#f7ce55";

    ctx.fillRect(
        x - 8,
        y + 23,
        7,
        9
    );

    // Eye
    ctx.fillStyle = "#1a1f25";

    const eyeOffset = player.facing === 1 ? 3 : -3;

    ctx.fillRect(
        x + 15 + eyeOffset,
        y + 6,
        2,
        2
    );
}

// --------------------------------------------------
// GAME LOOP
// --------------------------------------------------

function update() {
    updatePlayer();
    updateCamera();
    updateParticles();
}

function draw() {
    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    drawBackground();
    drawPlatforms();
    drawFireflies();
    drawParticles();
    drawPlayer();
}

function gameLoop() {
    update();
    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();