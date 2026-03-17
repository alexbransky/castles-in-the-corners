// gameScene.js
class MainGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGame' });
        this.knight = null;
        this.dragon = null;
        this.ball = null;
        this.castles = null;
        this.playerCastles = [];
        this.knightHelmet = null;
        this.knightBody = null;
        this.knightHead = null;
        this.knightPlume = null;
        this.knightShield = null;
        this.knightSword = null;
        this.dragonBody = null;
        this.dragonBelly = null;
        this.dragonHead = null;
        this.dragonEye = null;
        this.dragonHornLeft = null;
        this.dragonHornRight = null;
        this.dragonTail = null;
        this.dragonWingLeft = null;
        this.dragonWingRight = null;

        this.holder = null;
        this.lastCatchTime = 0;
        this.dragonHp = CONSTANTS.DRAGON_MAX_HP;
        this.lastLaunchedBy = null;
        this.knightVelocityX = 0;
        this.previousKnightX = 0;
        this.lastDragonDodgeTime = 0;

        this.pointerHeld = false;
        this.pointerX = 0;
        this.pointerY = 0;

        this.cursors = null;
        this.spaceKey = null;

        this.uiText = null;
        this.infoText = null;
        this.endText = null;
    }

    init() {
        gameState.current = GameState.INITIALIZING;
    }

    create() {
        try {
            const w = this.scale.width;
            const h = this.scale.height;

            this.createBackground(w, h);
            this.createCastles(w, h);
            this.createKnight(w, h);
            this.createDragon(w, h);
            this.createBall(w, h);
            this.createUi(w, h);
            this.setupControls();
            this.setupPhysics();
            this.setupDragonMovement(w, h);

            this.time.delayedCall(700, () => {
                if (gameState.current === GameState.RUNNING) {
                    this.attachBallTo('dragon');
                    this.time.delayedCall(CONSTANTS.DRAGON_THROW_DELAY_MS, () => {
                        if (this.holder === 'dragon') {
                            this.dragonShoot();
                        }
                    });
                }
            });

            this.scale.on('resize', () => this.scene.restart());

            gameState.current = GameState.RUNNING;
        } catch (error) {
            GameErrorHandler.handle(error, this);
        }
    }

    createBackground(w, h) {
        this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x102028);
        this.add.rectangle(w * 0.5, h * 0.23, w, h * 0.46, 0x1f4f52, 0.28);
        this.add.rectangle(w * 0.5, h * 0.84, w, h * 0.32, 0x2f3d45, 0.55);
    }

    createCastles(w, h) {
        this.castles = this.physics.add.group({
            immovable: true,
            allowGravity: false
        });
        const margin = Math.min(w, h) * 0.08;
        const blockSize = Math.floor(Math.min(w, h) * 0.045);
        const castleHalfWidth = blockSize * 2.6;
        const castleAnchorY = h - margin - (blockSize * 1.5);

        const bottomCorners = [
            { x: margin + castleHalfWidth, y: castleAnchorY },
            { x: w - margin - castleHalfWidth, y: castleAnchorY }
        ];

        this.playerCastles = [];

        bottomCorners.forEach((corner) => {
            // Stylized castle footprint built from destructible stone blocks.
            const offsets = [
                { gx: -2, gy: 1 }, { gx: -1, gy: 1 }, { gx: 0, gy: 1 }, { gx: 1, gy: 1 }, { gx: 2, gy: 1 },
                { gx: -2, gy: 0 }, { gx: -1, gy: 0 }, { gx: 0, gy: 0 }, { gx: 1, gy: 0 }, { gx: 2, gy: 0 },
                { gx: -2, gy: -1 }, { gx: 0, gy: -1 }, { gx: 2, gy: -1 },
                { gx: -2, gy: -2 }, { gx: 2, gy: -2 }
            ];

            const parts = offsets.map((offset) => {
                const block = this.add.rectangle(
                    corner.x + (offset.gx * blockSize),
                    corner.y + (offset.gy * blockSize),
                    blockSize - 2,
                    blockSize - 2,
                    offset.gy <= -1 ? 0xd9c79f : 0xc6ad80
                );
                return block;
            });

            // Decorative arch gate to make the silhouette read clearly as a castle.
            this.add.rectangle(corner.x, corner.y + (blockSize * 0.95), blockSize * 0.95, blockSize * 1.1, 0x8d7757, 0.55);
            this.add.rectangle(corner.x, corner.y + (blockSize * 1.1), blockSize * 0.5, blockSize * 0.7, 0x5f4e36, 0.7);

            parts.forEach((part) => {
                part.setStrokeStyle(2, 0xa89168);
                this.physics.add.existing(part);
                part.body.setImmovable(true);
                part.body.setAllowGravity(false);
                this.castles.add(part);
            });

            this.playerCastles.push({
                hp: parts.length,
                parts
            });
        });
    }

    createKnight(w, h) {
        const x = w * 0.5;
        const y = h * 0.86;
        const width = w * 0.13;
        const height = h * 0.04;

        this.knight = this.add.rectangle(x, y, width * 0.85, height * 1.25, 0x000000, 0.01);
        this.physics.add.existing(this.knight);
        this.knight.body.setImmovable(true);
        this.knight.body.setCollideWorldBounds(true);
        this.previousKnightX = x;

        this.knightBody = this.add.rectangle(x, y, width * 0.9, height * 1.35, 0x7d8ca3);
        this.knightBody.setStrokeStyle(2, 0x5b6678);
        this.knightShield = this.add.rectangle(x - width * 0.5, y + height * 0.08, width * 0.32, height * 0.95, 0x4b8fb8);
        this.knightShield.setStrokeStyle(2, 0x2f5d79);
        this.knightHead = this.add.circle(x, y - height * 1.05, height * 0.42, 0xd9e2f2);
        this.knightHelmet = this.add.rectangle(x, y - height * 1.2, width * 0.44, height * 0.38, 0x9ba7ba);
        this.knightPlume = this.add.triangle(x, y - height * 1.45, 0, height * 0.28, width * 0.2, 0, width * 0.4, height * 0.28, 0xc54545);
        this.knightSword = this.add.rectangle(x + width * 0.45, y - height * 0.4, width * 0.12, height * 1.25, 0xdfe9f3);
        this.knightSword.setStrokeStyle(2, 0xa6b2bf);
    }

    createDragon(w, h) {
        const x = w * 0.5;
        const y = h * 0.28;
        const r = Math.min(w, h) * 0.045;

        this.dragon = this.add.circle(x, y, r * 0.95, 0x000000, 0.01);
        this.physics.add.existing(this.dragon);
        this.dragon.body.setImmovable(true);
        this.dragon.body.setAllowGravity(false);

        this.dragonBody = this.add.ellipse(x, y, r * 2.3, r * 1.5, 0xa54633);
        this.dragonBelly = this.add.ellipse(x, y + r * 0.2, r * 1.2, r * 0.8, 0xd17a4f);
        this.dragonHead = this.add.circle(x + r * 1.2, y - r * 0.15, r * 0.55, 0xb75440);
        this.dragonEye = this.add.circle(x + r * 1.36, y - r * 0.25, r * 0.1, 0xffffff);
        this.dragonHornLeft = this.add.triangle(x + r * 1.05, y - r * 0.8, 0, r * 0.35, r * 0.25, 0, r * 0.5, r * 0.35, 0xf0d8a1);
        this.dragonHornRight = this.add.triangle(x + r * 1.38, y - r * 0.75, 0, r * 0.35, r * 0.25, 0, r * 0.5, r * 0.35, 0xf0d8a1);
        this.dragonTail = this.add.triangle(x - r * 1.55, y + r * 0.1, 0, r * 0.35, r * 0.65, r * 0.17, 0, 0, 0x8f3d2f);
        this.dragonWingLeft = this.add.triangle(x - r * 0.4, y - r * 0.05, 0, r * 0.9, r * 1.1, 0, r * 1.35, r * 1.1, 0xc7654f);
        this.dragonWingRight = this.add.triangle(x + r * 0.2, y - r * 0.05, 0, r * 0.9, r * 1.1, 0, r * 1.35, r * 1.1, 0xc7654f);
    }

    createBall(w, h) {
        this.ball = this.add.circle(w * 0.5, h * 0.52, CONSTANTS.BALL_RADIUS, 0xf5f7fa);
        this.physics.add.existing(this.ball);
        this.ball.body.setCircle(CONSTANTS.BALL_RADIUS);
        this.ball.body.setBounce(1, 1);
        this.ball.body.setCollideWorldBounds(true);
    }

    createUi(w, h) {
        this.uiText = this.add.text(w * 0.5, h * 0.03, '', {
            color: CONSTANTS.UI_COLOR,
            fontSize: `${Math.floor(Math.min(w, h) * 0.04)}px`,
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.infoText = this.add.text(w * 0.5, h * 0.07, 'Drag to move. Hold finger to catch. Release to shoot.', {
            color: '#d7e8ed',
            fontSize: `${Math.floor(Math.min(w, h) * 0.028)}px`
        }).setOrigin(0.5, 0);

        this.endText = this.add.text(w * 0.5, h * 0.5, '', {
            color: '#ffffff',
            fontSize: `${Math.floor(Math.min(w, h) * 0.08)}px`,
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        this.updateUi();
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.on('pointerdown', (pointer) => {
            this.pointerHeld = true;
            this.pointerX = pointer.worldX;
            this.pointerY = pointer.worldY;
            this.moveKnightTo(this.pointerX);
        });

        this.input.on('pointermove', (pointer) => {
            this.pointerX = pointer.worldX;
            this.pointerY = pointer.worldY;
            if (this.pointerHeld) {
                this.moveKnightTo(this.pointerX);
            }
        });

        this.input.on('pointerup', (pointer) => {
            this.pointerHeld = false;
            this.pointerX = pointer.worldX;
            this.pointerY = pointer.worldY;

            if (this.holder === 'knight') {
                this.knightShoot();
            }
        });

        this.input.on('pointerupoutside', () => {
            this.pointerHeld = false;
            if (this.holder === 'knight') {
                this.knightShoot();
            }
        });
    }

    setupPhysics() {
        this.physics.add.collider(this.ball, this.castles, this.handleCastleBounce, null, this);

        this.physics.add.overlap(this.ball, this.dragon, () => {
            if (gameState.current !== GameState.RUNNING) {
                return;
            }

            if (this.holder !== null) {
                return;
            }

            if (this.lastLaunchedBy === 'knight') {
                this.dragonHp -= 1;
                this.updateUi('Direct hit on dragon!');
                this.checkForWinLoss();
                if (gameState.current === GameState.RUNNING) {
                    this.attachBallTo('dragon');
                    this.time.delayedCall(CONSTANTS.DRAGON_THROW_DELAY_MS, () => {
                        if (this.holder === 'dragon' && gameState.current === GameState.RUNNING) {
                            this.dragonShoot();
                        }
                    });
                }
                return;
            }

            this.attachBallTo('dragon');
            this.time.delayedCall(CONSTANTS.DRAGON_THROW_DELAY_MS, () => {
                if (this.holder === 'dragon' && gameState.current === GameState.RUNNING) {
                    this.dragonShoot();
                }
            });
        });

        this.physics.add.overlap(this.ball, this.knight, () => {
            if (gameState.current !== GameState.RUNNING) {
                return;
            }

            if (this.holder !== null) {
                return;
            }

            if (this.time.now - this.lastCatchTime < CONSTANTS.CATCH_COOLDOWN_MS) {
                return;
            }

            const guardActive = this.pointerHeld || this.spaceKey.isDown;

            if (this.lastLaunchedBy === 'dragon' && !guardActive) {
                this.updateUi('Dragon shot got through. Guard to catch the next one.');
                if (gameState.current === GameState.RUNNING) {
                    this.resetBallToCenter();
                    this.attachBallTo('dragon');
                    this.time.delayedCall(CONSTANTS.DRAGON_THROW_DELAY_MS, () => {
                        if (this.holder === 'dragon' && gameState.current === GameState.RUNNING) {
                            this.dragonShoot();
                        }
                    });
                }
                return;
            }

            this.attachBallTo('knight');
        });
    }

    setupDragonMovement(w, h) {
        this.time.addEvent({
            delay: CONSTANTS.DRAGON_MOVE_DELAY_MS,
            loop: true,
            callback: () => {
                if (gameState.current !== GameState.RUNNING) {
                    return;
                }

                const minY = h * 0.14;
                const maxY = h * 0.42;
                const minX = w * 0.15;
                const maxX = w * 0.85;

                const targetX = Phaser.Math.Between(minX, maxX);
                const targetY = Phaser.Math.Between(minY, maxY);

                this.tweens.killTweensOf(this.dragon);
                this.tweens.add({
                    targets: this.dragon,
                    x: targetX,
                    y: targetY,
                    duration: CONSTANTS.DRAGON_MOVE_DURATION_MS,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    tryDragonDodge() {
        if (this.lastLaunchedBy !== 'knight' || this.holder !== null) {
            return;
        }

        if (this.time.now - this.lastDragonDodgeTime < CONSTANTS.DRAGON_DODGE_COOLDOWN_MS) {
            return;
        }

        const velocity = this.ball.body.velocity;
        const speed = Math.sqrt((velocity.x * velocity.x) + (velocity.y * velocity.y));
        if (speed < 140) {
            return;
        }

        const toDragonX = this.dragon.x - this.ball.x;
        const toDragonY = this.dragon.y - this.ball.y;
        const distToDragon = Math.sqrt((toDragonX * toDragonX) + (toDragonY * toDragonY));
        if (distToDragon > CONSTANTS.DRAGON_DODGE_TRIGGER_DISTANCE) {
            return;
        }

        const toDragonNormX = toDragonX / Math.max(distToDragon, 1);
        const toDragonNormY = toDragonY / Math.max(distToDragon, 1);
        const approachingSpeed = (velocity.x * toDragonNormX) + (velocity.y * toDragonNormY);

        if (approachingSpeed < 120) {
            return;
        }

        const dodgeDir = this.ball.x < this.dragon.x ? 1 : -1;
        const jitterY = Phaser.Math.Between(-26, 26);
        const dodgeX = Phaser.Math.Clamp(
            this.dragon.x + (dodgeDir * CONSTANTS.DRAGON_DODGE_DISTANCE),
            this.scale.width * 0.15,
            this.scale.width * 0.85
        );
        const dodgeY = Phaser.Math.Clamp(
            this.dragon.y + jitterY,
            this.scale.height * 0.14,
            this.scale.height * 0.42
        );

        this.lastDragonDodgeTime = this.time.now;
        this.tweens.killTweensOf(this.dragon);
        this.tweens.add({
            targets: this.dragon,
            x: dodgeX,
            y: dodgeY,
            duration: 180,
            ease: 'Cubic.easeOut'
        });
    }

    moveKnightTo(xTarget) {
        const halfWidth = this.knight.width * 0.5;
        this.knight.x = Phaser.Math.Clamp(xTarget, halfWidth, this.scale.width - halfWidth);
    }

    attachBallTo(holder) {
        this.holder = holder;
        this.lastCatchTime = this.time.now;
        this.ball.body.setVelocity(0, 0);

        if (holder === 'knight') {
            this.lastLaunchedBy = 'dragon';
        }

        if (holder === 'dragon') {
            this.lastLaunchedBy = 'knight';
        }
    }

    knightShoot() {
        if (this.holder !== 'knight') {
            return;
        }

        const aimX = this.pointerX || this.scale.width * 0.5;
        const aimY = this.pointerY || this.scale.height * 0.15;
        const fallbackY = this.knight.y - 140;

        const targetY = Math.min(aimY, this.knight.y - 30) || fallbackY;
        const dir = new Phaser.Math.Vector2(aimX - this.ball.x, targetY - this.ball.y).normalize();
        const movementRatio = Phaser.Math.Clamp(this.knightVelocityX / CONSTANTS.KNIGHT_SPEED, -1, 1);
        dir.x += movementRatio * CONSTANTS.PLAYER_DIRECTION_BLEND;
        dir.normalize();

        const speedBoost = Math.abs(movementRatio) * CONSTANTS.BALL_SPEED_PLAYER_MAX_BOOST;
        const finalSpeed = CONSTANTS.BALL_SPEED_PLAYER + speedBoost;
        this.ball.body.setVelocity(dir.x * finalSpeed, dir.y * finalSpeed);

        this.holder = null;
        this.lastLaunchedBy = 'knight';
        this.updateUi('Knight launched!');
    }

    dragonShoot() {
        if (this.holder !== 'dragon') {
            return;
        }

        const drift = Phaser.Math.Between(-40, 40);
        const target = new Phaser.Math.Vector2(this.knight.x + drift, this.knight.y);
        const dir = target.subtract(new Phaser.Math.Vector2(this.ball.x, this.ball.y)).normalize();

        this.ball.body.setVelocity(dir.x * CONSTANTS.BALL_SPEED_DRAGON, dir.y * CONSTANTS.BALL_SPEED_DRAGON);
        this.holder = null;
        this.lastLaunchedBy = 'dragon';
        this.updateUi('Dragon fires back!');
    }

    handleCastleBounce(_, castlePart) {
        const damagedCastle = this.playerCastles.find((castle) => castle.parts.includes(castlePart));

        if (damagedCastle && damagedCastle.hp > 0) {
            this.damageCastle(damagedCastle, castlePart, 'Castle block destroyed!');
        }
    }

    damageCastle(castle, hitPart, statusText) {
        if (hitPart && hitPart.active && hitPart.body && hitPart.body.enable) {
            hitPart.body.enable = false;
            hitPart.setVisible(false);
            hitPart.setActive(false);
            castle.hp = Math.max(0, castle.hp - 1);
        }
        this.updateUi(statusText);
    }

    resetBallToCenter() {
        this.ball.x = this.scale.width * 0.5;
        this.ball.y = this.scale.height * 0.52;
        this.ball.body.setVelocity(0, 0);
        this.holder = null;
        this.lastLaunchedBy = null;
    }

    checkForWinLoss() {
        if (this.dragonHp <= 0) {
            this.endGame('You Defeated The Dragon');
            return;
        }

        const remainingCastleHp = this.playerCastles.reduce((sum, castle) => sum + castle.hp, 0);
        if (remainingCastleHp <= 0) {
            this.endGame('All Castles Destroyed');
        }
    }

    endGame(message) {
        gameState.current = GameState.PAUSED;
        this.ball.body.setVelocity(0, 0);
        this.holder = null;

        this.endText.setText(`${message}\nTap to restart`);
        this.endText.setVisible(true);

        this.input.once('pointerdown', () => window.location.reload());
        this.input.keyboard.once('keydown-SPACE', () => window.location.reload());
    }

    updateUi(statusLine) {
        this.uiText.setText(`Dragon HP: ${this.dragonHp}/${CONSTANTS.DRAGON_MAX_HP}`);
        if (statusLine) {
            this.infoText.setText(statusLine);
        }
    }

    update(_, delta) {
        if (gameState.current !== GameState.RUNNING) {
            return;
        }

        this.tryDragonDodge();

        const keyboardMove = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
        if (keyboardMove !== 0) {
            this.knight.x += keyboardMove * CONSTANTS.KNIGHT_SPEED * (delta / 1000);
            this.moveKnightTo(this.knight.x);
        }

        const deltaSeconds = Math.max(delta / 1000, 0.001);
        this.knightVelocityX = (this.knight.x - this.previousKnightX) / deltaSeconds;
        this.previousKnightX = this.knight.x;

        if (this.knightHelmet) {
            this.knightHelmet.x = this.knight.x;
            this.knightHelmet.y = this.knight.y - this.knight.height * 1.1;
        }

        if (this.knightBody) {
            this.knightBody.x = this.knight.x;
            this.knightBody.y = this.knight.y;
            this.knightShield.x = this.knight.x - this.knight.width * 0.62;
            this.knightShield.y = this.knight.y + this.knight.height * 0.08;
            this.knightHead.x = this.knight.x;
            this.knightHead.y = this.knight.y - this.knight.height * 0.95;
            this.knightPlume.x = this.knight.x - this.knight.width * 0.18;
            this.knightPlume.y = this.knight.y - this.knight.height * 1.32;
            this.knightSword.x = this.knight.x + this.knight.width * 0.62;
            this.knightSword.y = this.knight.y - this.knight.height * 0.32;

            const swordTilt = Phaser.Math.Clamp(this.knightVelocityX / CONSTANTS.KNIGHT_SPEED, -1, 1) * 0.35;
            this.knightSword.rotation = swordTilt;
        }

        if (this.dragonBody) {
            const r = this.dragon.radius;
            const flap = Math.sin(this.time.now * 0.015) * (r * 0.25);

            this.dragonBody.x = this.dragon.x;
            this.dragonBody.y = this.dragon.y;
            this.dragonBelly.x = this.dragon.x;
            this.dragonBelly.y = this.dragon.y + r * 0.2;
            this.dragonHead.x = this.dragon.x + r * 1.2;
            this.dragonHead.y = this.dragon.y - r * 0.12;
            this.dragonEye.x = this.dragon.x + r * 1.35;
            this.dragonEye.y = this.dragon.y - r * 0.22;
            this.dragonHornLeft.x = this.dragon.x + r * 1.03;
            this.dragonHornLeft.y = this.dragon.y - r * 0.82;
            this.dragonHornRight.x = this.dragon.x + r * 1.34;
            this.dragonHornRight.y = this.dragon.y - r * 0.76;
            this.dragonTail.x = this.dragon.x - r * 1.7;
            this.dragonTail.y = this.dragon.y + r * 0.08;
            this.dragonWingLeft.x = this.dragon.x - r * 0.55;
            this.dragonWingLeft.y = this.dragon.y - r * 0.18 + flap;
            this.dragonWingRight.x = this.dragon.x + r * 0.02;
            this.dragonWingRight.y = this.dragon.y - r * 0.18 - flap;
        }

        if (this.holder === 'knight') {
            this.ball.x = this.knight.x + this.knight.width * 0.55;
            this.ball.y = this.knight.y - this.knight.height * 0.65;

            if (Phaser.Input.Keyboard.JustUp(this.spaceKey)) {
                this.knightShoot();
            }

            return;
        }

        if (this.holder === 'dragon') {
            this.ball.x = this.dragon.x;
            this.ball.y = this.dragon.y + this.dragon.radius * 1.5;
            return;
        }

        const upperBound = this.scale.height * 0.08;
        if (this.ball.y < upperBound && this.ball.body.velocity.y < 0) {
            this.ball.body.setVelocityY(Math.abs(this.ball.body.velocity.y));
        }
    }
}
