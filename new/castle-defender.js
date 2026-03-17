// castle-defender.js

class CastleDefender {
  constructor() {
    // Game configuration
    this.config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: this.preload.bind(this),
        create: this.create.bind(this),
        update: this.update.bind(this)
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
    this.AI_REACTION_TIME = 0.7; // Higher means slower reactions

    // Game state
    this.gameStarted = false;
    this.gameOver = false;
    this.winner = null;
    this.playerIndex = 2; // Bottom-left player is human
    this.keys = null;
    this.castles = [];
    this.gloves = [];
    this.ball = null;
    this.spaceReleased = true;

    // Initialize game
    this.game = new Phaser.Game(this.config);
  }

  preload() {
    // No assets to preload for this game
  }

  create() {
    // Initialize input
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      altLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      altRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Initialize game objects
    this.createCastles();
    this.createGloves();
    this.createBall();

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

    // Add overlay for start screen
    this.overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

    // Game start handler
    this.input.keyboard.on('keydown', () => {
      if (!this.gameStarted) {
        this.startGame();
      }
    });
  }

  createCastles() {
    const castleColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xeab308]; // Red, Blue, Green, Yellow
    
    // Define castle positions - exactly at the corners
    const positions = [
      { x: 0, y: 0 },                                       // Top-left
      { x: this.config.width - this.CASTLE_SIZE, y: 0 },    // Top-right
      { x: 0, y: this.config.height - this.CASTLE_SIZE },   // Bottom-left
      { x: this.config.width - this.CASTLE_SIZE, y: this.config.height - this.CASTLE_SIZE } // Bottom-right
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
  }

  createGloves() {
    const positions = ['top', 'top', 'bottom', 'bottom'];
    
    // Define glove parameters for each corner
    const gloveParams = [
      // Red glove (top left)
      {
        centerX: this.CASTLE_SIZE / 2,
        centerY: this.CASTLE_SIZE / 2,
        angle: Math.PI / 4, // Starting angle
        radius: this.CASTLE_SIZE + 30, // Radius of the arc
        minAngle: 0, // Leftmost position
        maxAngle: Math.PI / 2, // Rightmost position
        castleIndex: 0, // Red castle
      },
      // Blue glove (top right)
      {
        centerX: this.config.width - this.CASTLE_SIZE / 2,
        centerY: this.CASTLE_SIZE / 2,
        angle: (3 * Math.PI) / 4, // Starting angle
        radius: this.CASTLE_SIZE + 30,
        minAngle: Math.PI / 2, // Leftmost position
        maxAngle: Math.PI, // Rightmost position
        castleIndex: 1, // Blue castle
      },
      // Green glove (bottom left)
      {
        centerX: this.CASTLE_SIZE / 2,
        centerY: this.config.height - this.CASTLE_SIZE / 2,
        angle: (7 * Math.PI) / 4, // Starting angle
        radius: this.CASTLE_SIZE + 30,
        minAngle: (3 * Math.PI) / 2, // Leftmost position
        maxAngle: 2 * Math.PI, // Rightmost position
        castleIndex: 2, // Green castle
      },
      // Yellow glove (bottom right)
      {
        centerX: this.config.width - this.CASTLE_SIZE / 2,
        centerY: this.config.height - this.CASTLE_SIZE / 2,
        angle: (5 * Math.PI) / 4, // Starting angle
        radius: this.CASTLE_SIZE + 30,
        minAngle: Math.PI, // Leftmost position
        maxAngle: (3 * Math.PI) / 2, // Rightmost position
        castleIndex: 3, // Yellow castle
      }
    ];

    // Create gloves
    for (let i = 0; i < 4; i++) {
      const params = gloveParams[i];
      
      // Calculate initial position based on angle
      const x = params.centerX + Math.cos(params.angle) * params.radius;
      const y = params.centerY + Math.sin(params.angle) * params.radius;
      
      // Adjust x position for right side gloves
      const adjustedX = i === 1 || i === 3 ? x - this.GLOVE_WIDTH : x;
      
      // Adjust y position for bottom gloves
      const adjustedY = i === 2 || i === 3 ? y - this.GLOVE_HEIGHT : y;
      
      // Create glove
      const glove = {
        x: adjustedX,
        y: adjustedY,
        width: this.GLOVE_WIDTH,
        height: this.GLOVE_HEIGHT,
        direction: 0,
        hasBall: false,
        position: positions[i],
        color: this.castles[i].color,
        centerX: params.centerX,
        centerY: params.centerY,
        angle: params.angle,
        radius: params.radius,
        minAngle: params.minAngle,
        maxAngle: params.maxAngle,
        castleIndex: params.castleIndex,
        graphics: this.add.graphics()
      };
      
      this.gloves.push(glove);
    }
  }

  createBall() {
    this.ball = {
      x: this.config.width / 2,
      y: this.config.height / 2,
      dx: this.BALL_SPEED,
      dy: this.BALL_SPEED,
      radius: this.BALL_RADIUS,
      held: false,
      heldBy: null,
      graphics: this.add.graphics()
    };
  }

  startGame() {
    this.gameStarted = true;
    this.overlay.visible = false;
    this.startText.visible = false;
    this.instructionsText.visible = false;
  }

  update() {
    if (!this.gameStarted) return;
    if (this.gameOver) return;

    // Update game objects
    this.updateGloves();
    this.updateBall();
    this.checkGameOver();

    // Draw everything
    this.render();
  }

  updateGloves() {
    const playerGlove = this.gloves[this.playerIndex];
    const prevAngle = playerGlove.angle;

    // Player input
    if (this.keys.left.isDown || this.keys.altLeft.isDown) {
      // Move counterclockwise within constraints
      playerGlove.angle = Math.max(playerGlove.minAngle, playerGlove.angle - this.GLOVE_SPEED);
    }
    if (this.keys.right.isDown || this.keys.altRight.isDown) {
      // Move clockwise within constraints
      playerGlove.angle = Math.min(playerGlove.maxAngle, playerGlove.angle + this.GLOVE_SPEED);
    }

    // Update player glove position
    this.updateGlovePosition(playerGlove);

    // Calculate direction based on movement
    playerGlove.direction = playerGlove.angle !== prevAngle ? (playerGlove.angle > prevAngle ? 1 : -1) : 0;

    // AI gloves movement
    this.gloves.forEach((glove, index) => {
      if (index === this.playerIndex) return; // Skip player glove

      const prevAngle = glove.angle;
      const shouldMove = Math.random() > this.AI_REACTION_TIME; // Add randomness to AI reactions

      if (shouldMove) {
        // Calculate target angle based on ball position
        let targetAngle = glove.angle;

        // Only move if ball is coming toward this quadrant
        const inQuadrant = this.isBallInGloveQuadrant(glove);
        
        if (inQuadrant) {
          const dx = this.ball.x - glove.centerX;
          const dy = this.ball.y - glove.centerY;
          targetAngle = Math.atan2(dy, dx);
          
          if (targetAngle < 0) targetAngle += 2 * Math.PI;
          
          // Constrain to valid range
          targetAngle = Math.max(glove.minAngle, Math.min(glove.maxAngle, targetAngle));

          // Move toward target angle
          if (Math.abs(targetAngle - glove.angle) > 0.05) {
            if (
              (targetAngle > glove.angle && targetAngle - glove.angle < Math.PI) ||
              (targetAngle < glove.angle && glove.angle - targetAngle > Math.PI)
            ) {
              glove.angle = Math.min(glove.maxAngle, glove.angle + this.GLOVE_SPEED);
            } else {
              glove.angle = Math.max(glove.minAngle, glove.angle - this.GLOVE_SPEED);
            }
          }

          // Update glove position
          this.updateGlovePosition(glove);

          // Calculate direction based on movement
          glove.direction = glove.angle !== prevAngle ? (glove.angle > prevAngle ? 1 : -1) : 0;
        }
      }

      // AI ball catch and release
      if (!this.ball.held && this.checkBallGloveCollision(this.ball, glove)) {
        // Catch the ball with some probability
        if (Math.random() > 0.3) {
          this.ball.held = true;
          this.ball.heldBy = index;
        } else {
          // Bounce the ball
          this.bounceOffGlove(this.ball, glove);
        }
      } else if (this.ball.held && this.ball.heldBy === index) {
        // Release the ball after a short delay
        if (Math.random() > 0.95) {
          this.ball.held = false;
          this.ball.heldBy = null;

          // Set ball direction based on glove movement
          this.setDirectionBasedOnGloveMovement(this.ball, glove);
        }
      }
    });
  }

  isBallInGloveQuadrant(glove) {
    // Red glove (top left)
    if (glove.castleIndex === 0) {
      return this.ball.y < this.config.height / 2 && this.ball.x < this.config.width / 2;
    }
    // Blue glove (top right)
    else if (glove.castleIndex === 1) {
      return this.ball.y < this.config.height / 2 && this.ball.x > this.config.width / 2;
    }
    // Green glove (bottom left)
    else if (glove.castleIndex === 2) {
      return this.ball.y > this.config.height / 2 && this.ball.x < this.config.width / 2;
    }
    // Yellow glove (bottom right)
    else if (glove.castleIndex === 3) {
      return this.ball.y > this.config.height / 2 && this.ball.x > this.config.width / 2;
    }
    return false;
  }

  updateGlovePosition(glove) {
    // Calculate position based on center point and angle
    let x = glove.centerX + Math.cos(glove.angle) * glove.radius;
    let y = glove.centerY + Math.sin(glove.angle) * glove.radius;
    
    // Adjust position based on glove index
    if (glove.castleIndex === 1 || glove.castleIndex === 3) {
      // Right side gloves
      x -= glove.width;
    }
    
    if (glove.castleIndex === 2 || glove.castleIndex === 3) {
      // Bottom gloves
      y -= glove.height;
    }
    
    glove.x = x;
    glove.y = y;
  }

  updateBall() {
    // Handle ball catch and release for player
    if (this.keys.space.isDown && this.spaceReleased && !this.ball.held) {
      // Check if ball is touching the player's glove
      if (this.checkBallGloveCollision(this.ball, this.gloves[this.playerIndex])) {
        this.ball.held = true;
        this.ball.heldBy = this.playerIndex;
        this.spaceReleased = false;
      }
    } 
    
    if (!this.keys.space.isDown) {
      this.spaceReleased = true;
      
      if (this.ball.held && this.ball.heldBy === this.playerIndex) {
        // Release the ball
        this.ball.held = false;
        this.ball.heldBy = null;

        // Set ball direction based on glove movement
        this.setDirectionBasedOnGloveMovement(this.ball, this.gloves[this.playerIndex]);
      }
    }

    // Update ball position if not held
    if (!this.ball.held) {
      this.ball.x += this.ball.dx * (1/60);
      this.ball.y += this.ball.dy * (1/60);

      // Ball collision with walls
      if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.config.width) {
        this.ball.dx = -this.ball.dx;
        this.ball.x = this.ball.x - this.ball.radius < 0 ? this.ball.radius : this.config.width - this.ball.radius;
      }
      if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.config.height) {
        this.ball.dy = -this.ball.dy;
        this.ball.y = this.ball.y - this.ball.radius < 0 ? this.ball.radius : this.config.height - this.ball.radius;
      }

      // Ball collision with gloves (when not catching)
      this.gloves.forEach((glove, index) => {
        if (!this.keys.space.isDown || this.ball.heldBy !== null) {
          if (this.checkBallGloveCollision(this.ball, glove)) {
            this.bounceOffGlove(this.ball, glove);
          }
        }
      });

      // Ball collision with castle blocks
      this.castles.forEach((castle, castleIndex) => {
        for (let i = castle.blocks.length - 1; i >= 0; i--) {
          const block = castle.blocks[i];
          if (
            this.ball.x + this.ball.radius > block.x &&
            this.ball.x - this.ball.radius < block.x + this.BLOCK_SIZE &&
            this.ball.y + this.ball.radius > block.y &&
            this.ball.y - this.ball.radius < block.y + this.BLOCK_SIZE
          ) {
            // Remove the block
            castle.blocks.splice(i, 1);

            // Bounce the ball
            // Determine which side of the block was hit
            const dx = this.ball.x - (block.x + this.BLOCK_SIZE / 2);
            const dy = this.ball.y - (block.y + this.BLOCK_SIZE / 2);

            if (Math.abs(dx) > Math.abs(dy)) {
              this.ball.dx = dx > 0 ? Math.abs(this.ball.dx) : -Math.abs(this.ball.dx);
            } else {
              this.ball.dy = dy > 0 ? Math.abs(this.ball.dy) : -Math.abs(this.ball.dy);
            }

            break;
          }
        }
      });
    } else if (this.ball.heldBy !== null) {
      // Update ball position if held by a glove
      const holdingGlove = this.gloves[this.ball.heldBy];
      // Top gloves (Red/Blue)
      if (holdingGlove.position === 'top') {
        this.ball.x = holdingGlove.x + holdingGlove.width / 2;
        this.ball.y = holdingGlove.y + holdingGlove.height + this.ball.radius;
      }
      // Bottom gloves (Green/Yellow)
      else if (holdingGlove.position === 'bottom') {
        this.ball.x = holdingGlove.x + holdingGlove.width / 2;
        this.ball.y = holdingGlove.y - this.ball.radius;
      }
    }
  }

  checkBallGloveCollision(ball, glove) {
    return (
      ball.x + ball.radius > glove.x &&
      ball.x - ball.radius < glove.x + glove.width &&
      ball.y + ball.radius > glove.y &&
      ball.y - ball.radius < glove.y + glove.height
    );
  }

  bounceOffGlove(ball, glove) {
    // Top gloves (Red/Blue)
    if (glove.position === 'top') {
      ball.dy = Math.abs(ball.dy);
    }
    // Bottom gloves (Green/Yellow)
    else if (glove.position === 'bottom') {
      ball.dy = -Math.abs(ball.dy);
    }
  }

  setDirectionBasedOnGloveMovement(ball, glove) {
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

    if (glove.direction !== 0) {
      // Glove is moving, set 45-degree angle
      if (glove.position === 'top') {
        ball.dx = glove.direction * speed * 0.7071;
        ball.dy = speed * 0.7071;
      } else if (glove.position === 'bottom') {
        ball.dx = glove.direction * speed * 0.7071;
        ball.dy = -speed * 0.7071;
      }
    } else {
      // Glove is stationary, set perpendicular direction
      if (glove.position === 'top') {
        ball.dx = 0;
        ball.dy = speed;
      } else if (glove.position === 'bottom') {
        ball.dx = 0;
        ball.dy = -speed;
      }
    }
  }

  checkGameOver() {
    // Check game over condition
    const remainingCastles = this.castles.filter(castle => castle.blocks.length > 0);
    if (remainingCastles.length <= 1) {
      this.gameOver = true;
      
      if (remainingCastles.length === 1) {
        this.winner = this.castles.findIndex(castle => castle.blocks.length > 0);
      }
      
      // Show game over message
      this.overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
      
      let message = this.winner !== null ? 
        ['Red', 'Blue', 'Green', 'Yellow'][this.winner] + ' Castle Wins!' : 
        'Game Over - Draw!';
      
      this.gameOverText = this.add.text(400, 280, message, {
        fontFamily: 'Arial',
        fontSize: '30px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      this.restartText = this.add.text(400, 340, 'Click or press any key to restart', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      // Add restart handler
      this.input.keyboard.once('keydown', this.restartGame, this);
      this.input.once('pointerdown', this.restartGame, this);
    }
  }

  restartGame() {
    // Reset game state
    this.gameStarted = false;
    this.gameOver = false;
    this.winner = null;
    
    // Remove game over elements
    if (this.gameOverText) this.gameOverText.destroy();
    if (this.restartText) this.restartText.destroy();
    if (this.overlay) this.overlay.destroy();
    
    // Reset castles, gloves, and ball
    this.castles.forEach(castle => {
      castle.blocks = [];
      castle.graphics.clear();
    });
    
    this.gloves.forEach(glove => {
      glove.graphics.clear();
    });
    
    if (this.ball) {
      this.ball.graphics.clear();
    }
    
    // Re-create game
    this.create();
  }

  render() {
    // Clear all graphics
    this.castles.forEach(castle => castle.graphics.clear());
    this.gloves.forEach(glove => glove.graphics.clear());
    this.ball.graphics.clear();
    
    // Draw castles
    this.castles.forEach(castle => {
      castle.blocks.forEach(block => {
        castle.graphics.fillStyle(castle.color);
        castle.graphics.fillRect(block.x, block.y, this.BLOCK_SIZE, this.BLOCK_SIZE);
        castle.graphics.lineStyle(1, 0x000000);
        castle.graphics.strokeRect(block.x, block.y, this.BLOCK_SIZE, this.BLOCK_SIZE);
      });
    });
    
    // Draw gloves
    this.gloves.forEach(glove => {
      glove.graphics.fillStyle(glove.color);
      glove.graphics.fillRect(glove.x, glove.y, glove.width, glove.height);
      glove.graphics.lineStyle(1, 0x000000);
      glove.graphics.strokeRect(glove.x, glove.y, glove.width, glove.height);
    });
    
    // Draw ball
    this.ball.graphics.fillStyle(0xffffff);
    this.ball.graphics.fillCircle(this.ball.x, this.ball.y, this.ball.radius);
    this.ball.graphics.lineStyle(1, 0x000000);
    this.ball.graphics.strokeCircle(this.ball.x, this.ball.y, this.ball.radius);
  }
}

// Start the game
window.onload = () => {
  new CastleDefender();
};