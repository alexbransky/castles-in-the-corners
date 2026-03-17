// config.js
const GAME_CONFIG = {
    type: Phaser.CANVAS,
    canvas: document.getElementById('gameCanvas'),
    width: 414,
    height: 736,
    backgroundColor: '#102028',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { x: 0, y: 0 }
        }
    },
    scene: null,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 414,
        height: 736
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true
    }
};

const CONSTANTS = {
    DRAGON_MAX_HP: 5,
    KNIGHT_SPEED: 682,
    BALL_RADIUS: 10,
    BALL_SPEED_PLAYER: 760,
    BALL_SPEED_PLAYER_MAX_BOOST: 260,
    PLAYER_DIRECTION_BLEND: 0.65,
    BALL_SPEED_DRAGON: 460,
    DRAGON_MOVE_DELAY_MS: 850,
    DRAGON_MOVE_DURATION_MS: 620,
    DRAGON_DODGE_COOLDOWN_MS: 260,
    DRAGON_DODGE_DISTANCE: 90,
    DRAGON_DODGE_TRIGGER_DISTANCE: 185,
    CATCH_COOLDOWN_MS: 220,
    DRAGON_THROW_DELAY_MS: 520,
    UI_COLOR: '#f8f6e8'
};

const GameState = {
    INITIALIZING: 'initializing',
    RUNNING: 'running',
    PAUSED: 'paused',
    ERROR: 'error'
};

let gameState = {
    current: GameState.INITIALIZING,
    lastError: null
};

class GameErrorHandler {
    static handle(error, context) {
        console.error('Game Error:', error);
        gameState.lastError = error;
        gameState.current = GameState.ERROR;

        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.innerHTML = `
                Error: ${error.message}<br>
                <button onclick="window.location.reload()">Restart Game</button>
            `;
        }

        if (context && context.scene) {
            context.scene.pause();
        }
    }
}
