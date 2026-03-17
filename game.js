// game.js
window.onload = function() {
    try {
        // Ensure canvas is properly initialized
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Test canvas context
        const testContext = canvas.getContext('2d');
        if (!testContext) {
            throw new Error('Canvas context not available');
        }

        // Set the scene in the config
        GAME_CONFIG.scene = MainGameScene;
        
        // Create the game instance with proper canvas reference
        const game = new Phaser.Game(GAME_CONFIG);
        
        // Add global error handler
        window.onerror = function(message, source, lineno, colno, error) {
            GameErrorHandler.handle(error || new Error(message));
            return true;
        };

        // Add promise rejection handler
        window.onunhandledrejection = function(event) {
            GameErrorHandler.handle(event.reason);
        };

    } catch (error) {
        GameErrorHandler.handle(error);
        console.error('Initialization Error Details:', {
            error: error,
            phaser: Phaser.VERSION,
            browser: navigator.userAgent,
            canvas: document.getElementById('gameCanvas') ? 'exists' : 'missing'
        });
    }
};