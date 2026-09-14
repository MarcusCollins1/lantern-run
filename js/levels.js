// Level definitions

// WORLD
// --------------------------------------------------

export const levels = {
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
            { x: 1320, y: 260 },
            { x: 1740, y: 370 },
            { x: 2140, y: 290 },
            { x: 2580, y: 230 }
        ],

        checkpoints: [
            {
                x: 1240,
                y: 290,
                width: 24,
                height: 60
            },
            {
                x: 2060,
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
            { x: 1880, y: 330 },
            { x: 2210, y: 220 },
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
    },

    3: {
        "platforms": [
            {
                "x": 43,
                "y": 360,
                "width": 240,
                "height": 200
            },
            {
                "x": 360,
                "y": 180,
                "width": 200,
                "height": 20
            },
            {
                "x": 580,
                "y": 300,
                "width": 200,
                "height": 20
            },
            {
                "x": 360,
                "y": 440,
                "width": 600,
                "height": 20
            },
            {
                "x": 680,
                "y": 50,
                "width": 10,
                "height": 250
            },
            {
                "x": 800,
                "y": 180,
                "width": 150,
                "height": 20
            }
        ],
        "spikes": [
            {
                "x": 370,
                "y": 410,
                "width": 80,
                "height": 30
            },
            {
                "x": 690,
                "y": 280,
                "width": 40,
                "height": 20
            }
        ],
        "fireflies": [],
        "checkpoints": [
            {
                "x": 480,
                "y": 380,
                "width": 24,
                "height": 60
            }
        ],
        "goal": {
            "x": 870,
            "y": 100,
            "width": 55,
            "height": 80
        }
    }
};
