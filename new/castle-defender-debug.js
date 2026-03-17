// castle-defender-debug.js
class CastleDefender {
    constructor() {
      // Debug mode
      this.debugMode = true;
      this.initializationStage = 0;
      this.debugElement = null;
      
      // Create debug overlay
      this.createDebugOverlay();
      this.logDebug("Starting Castle Defender initialization");
      
      // Game configuration with explicit canvas
      this.config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-canvas',
        backgroundColor: '#2d3748',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: this.debugMode
          }
        },
        scene: {
          init: this.init.bind(this),
          preload: this.preload.bind(this),
          create: this.create.bind(this),
          update: this.update.bind(this)
        },
        callbacks: {
          postBoot: (game) => {
            this.logDebug("Phaser game booted successfully");
          }
        }
      };
  
      // Game constants
      this.BLOCK_SIZE = 20;
      this.CASTLE_SIZE = 100;
      this.BALL_RADIUS = 10;
      this.BALL_SPEED = 300;
      this.GLOVE_WIDTH = 60;
      this.GLOVE_HEIGHT = 20;
      this.GLOVE_SPEED = 0.04;
      this.AI_REACTION_TIME = 0.7;
  
      // Game state
      this.gameStarted = false;
      this.gameOver = false;
      this.winner = null;
      this.playerIndex = 2;
      this.keys = null;
      this.castles = [];
      this.gloves = [];
      this.ball = null;
      this.spaceReleased = true;
  
      try {
        // Initialize game with error handling
        this.logDebug("Creating Phaser game instance");
        this.game = new Phaser.Game(this.config);
        this.logDebug("Phaser Game instance created");
      } catch (error) {
        this.logDebug("ERROR creating Phaser game: " + error.message);
        this.fallbackToCanvas();
      }
    }
  
    createDebugOverlay() {
      // Create debug element if in debug mode
      if (this.debugMode) {
        this.debugElement = document.createElement('div');
        this.debugElement.style.position = 'absolute';
        this.debugElement.style.top = '10px';
        this.debugElement.style.left = '10px';
        this.debugElement.style.background = 'rgba(0,0,0,0.7)';
        this.debugElement.style.color = '#00ff00';
        this.debugElement.style.padding = '10px';
        this.debugElement.style.fontFamily = 'monospace';
        this.debugElement.style.fontSize = '12px';
        this.debugElement.style.zIndex = '1000';
        this.debugElement.style.maxHeight = '300px';
        this.debugElement.style.overflowY = 'auto';
        document.body.appendChild(this.debugElement);
      }
    }
  
    logDebug(message) {
      console.log("[Castle Defender]", message);
      if (this.debugMode && this.debugElement) {
        const time = new Date().toLocaleTimeString();
        this.debugElement.innerHTML += `<div>[${time}] ${message}</div>`;
        this.debugElement.scrollTop = this.debugElement.scrollHeight;
      }
    }
  
    fallbackToCanvas() {
      this.logDebug("Activating canvas fallback mode");
      
      // Clear game container
      const gameContainer = document.getElementById('game-canvas');
      if (gameContainer) {
        gameContainer.innerHTML = '';
      }
      
      // Create canvas manually
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      canvas.style.backgroundColor = '#2d3748';
      
      if (gameContainer) {
        gameContainer.appendChild(canvas);
      } else {
        document.body.appendChild(canvas);
      }
      
      // Draw fallback content
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Castle Defender', canvas.width / 2, 50);
        
        ctx.font = '16px Arial';
        ctx.fillText('Phaser initialization failed - Check console for details', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Click to try again', canvas.width / 2, canvas.height / 2 + 40);
        
        // Add click handler to restart
        canvas.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }
  
    init() {
      this.logDebug("Scene init called");
      this.initializationStage = 1;
    }
  
    preload() {
      this.logDebug("Scene preload called");
      this.initializationStage = 2;
      
      // Preload a test image to verify Phaser is working
      this.load.image('test', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
    }
  
    create() {
      this.logDebug("Scene create started");
      this.initializationStage = 3;
      
      try {
        // Test image to verify rendering
        const testSprite = this.add.image(400, 300, 'test');
        this.logDebug("Test sprite created successfully");
        
        // Initialize input
        this.keys = this.input.keyboard.addKeys({
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
          altLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
          altRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
          space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
        this.logDebug("Keyboard input initialized");
  
        // Initialize game objects
        this.createCastles();
        this.createGloves();
        this.createBall();
        this.logDebug("Game objects created");
  
        // Add text for game state
        this.startText = this.add.text(400, 300, 'Press any key to start', {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ffffff'
        }).setOrigin(0.5);
  
        this.instructionsText = this.add.text(400, 350, 'Use A/D keys to move your glove\nPress SPACE to catch and release the ball', {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5);
        this.logDebug("Game text created");
  
        // Add overlay for start screen
        this.overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        
        // Game start handler
        this.input.keyboard.on('keydown', () => {
          if (!this.gameStarted) {
            this.startGame();
          }
        });
        
        this.logDebug("Scene creation complete");
        this.initializationStage = 4;
      } catch (error) {
        this.logDebug("ERROR in create: " + error.message);
        this.fallbackToCanvas();
      }
    }
  
    createCastles() {
      this.logDebug("Creating castles");
      const castleColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308]; // Red, Blue, Green, Yellow
      
      // Define castle positions
      const positions = [
        { x: 0, y: 0 },
        { x: this.config.width - this.CASTLE_SIZE, y: 0 },
        { x: 0, y: this.config.height - this.CASTLE_SIZE },
        { x: this.config.width - this.CASTLE_SIZE, y: this.config.height - this.CASTLE_SIZE }
      ];
  
      // Create castles
      for (let i = 0; i < 4; i++) {
        // Create castle container
        const castle = {
          x: positions[i].x,
          y: positions[i].y,
          blocks: [],
          color: castleColors[i],
          graphics: this.add.graphics()
        };
  
        // Create blocks for the castle
        for (let j = 0; j < 10; j++) {
          const row = Math.floor(j / 5);
          const col = j % 5;
          
          const block = {
            x: castle.x + col * this.BLOCK_SIZE,
            y: castle.y + row * this.BLOCK_SIZE,
            width: this.BLOCK_SIZE,
            height: this.BLOCK_SIZE
          };
          
          castle.blocks.push(block);
        }
  
        this.castles.push(castle);
      }
      this.logDebug(`Created ${this.castles.length} castles`);
    }
  
    // Rest of your methods...
    // (createGloves, createBall, update, etc.)
  
    // Add a render method specifically for debugging
    renderDebug() {
      if (!this.debugMode) return;
      
      const debugInfo = this.add.text(10, 10, [
        `FPS: ${Math.round(this.game.loop.actualFps)}`,
        `Initialization Stage: ${this.initializationStage}`,
        `Game Started: ${this.gameStarted}`,
        `Castles: ${this.castles.length}`,
        `Gloves: ${this.gloves.length}`,
        `Ball Position: ${this.ball ? `${Math.round(this.ball.x)},${Math.round(this.ball.y)}` : 'N/A'}`
      ].join('\n'), {
        font: '12px monospace',
        fill: '#00ff00',
        backgroundColor: '#00000088'
      });
      debugInfo.setDepth(1000);
      
      // Auto-destroy after one frame
      setTimeout(() => {
        debugInfo.destroy();
      }, 0);
    }
  
    update() {
      // Add the debug renderer call
      this.renderDebug();
      
      // Rest of your update logic...
    }
  }
  
  // Start the game with error handling
  window.onload = () => {
    console.log("Window loaded, starting Castle Defender");
    try {
      window.game = new CastleDefender();
    } catch (error) {
      console.error("Fatal error starting game:", error);
      // Show error on page
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.style.padding = '20px';
      errorDiv.style.textAlign = 'center';
      errorDiv.innerHTML = `<h2>Error Starting Game</h2><p>${error.message}</p>`;
      document.body.appendChild(errorDiv);
    }
  };