"use client"

import { useEffect, useRef, useState } from "react"

// Game constants
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const BLOCK_SIZE = 20
const CASTLE_SIZE = 100
const BALL_RADIUS = 10
const BALL_SPEED = 5
const GLOVE_LONG = 60 // Long side
const GLOVE_SHORT = 20 // Short side
const GLOVE_SPEED = 5
const AI_REACTION_TIME = 0.7 // 0-1, higher means slower reactions

type Castle = {
  x: number
  y: number
  blocks: { x: number; y: number }[]
  color: string
}

type Glove = {
  x: number
  y: number
  width: number
  height: number
  direction: number
  hasBall: boolean
  position: "top" | "right" | "bottom" | "left"
  color: string
  centerX: number
  centerY: number
  angle: number
  radius: number
  minAngle: number
  maxAngle: number
  castleIndex: number
}

type Ball = {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
  held: boolean
  heldBy: number | null
}

export default function CastleGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const gameStateRef = useRef({
    castles: [] as Castle[],
    gloves: [] as Glove[],
    ball: null as Ball | null,
    keys: {
      left: false,
      right: false,
      space: false,
      spaceReleased: true,
    },
    playerIndex: 2, // Bottom player is human
  })

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = GAME_WIDTH
    canvas.height = GAME_HEIGHT

    // Initialize castles - ensure they're positioned exactly at the corners
    const castles: Castle[] = [
      {
        x: 0,
        y: 0,
        blocks: [],
        color: "#ef4444", // Red
      },
      {
        x: GAME_WIDTH - CASTLE_SIZE,
        y: 0,
        blocks: [],
        color: "#3b82f6", // Blue
      },
      {
        x: 0,
        y: GAME_HEIGHT - CASTLE_SIZE,
        blocks: [],
        color: "#22c55e", // Green
      },
      {
        x: GAME_WIDTH - CASTLE_SIZE,
        y: GAME_HEIGHT - CASTLE_SIZE,
        blocks: [],
        color: "#eab308", // Yellow
      },
    ]

    // Initialize blocks for each castle - make them 5x5 grid with some blocks missing
    // Red castle (top left) - missing blocks at bottom right
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        // Skip some blocks to match the mockup
        if (row >= 3 && col >= 3) {
          continue
        }
        castles[0].blocks.push({
          x: castles[0].x + col * BLOCK_SIZE,
          y: castles[0].y + row * BLOCK_SIZE,
        })
      }
    }

    // Blue castle (top right) - missing blocks at bottom left
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        // Skip some blocks to match the mockup
        if (row >= 3 && col <= 1) {
          continue
        }
        castles[1].blocks.push({
          x: castles[1].x + col * BLOCK_SIZE,
          y: castles[1].y + row * BLOCK_SIZE,
        })
      }
    }

    // Green castle (bottom left) - missing blocks at top right
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        // Skip some blocks to match the mockup
        if (row <= 1 && col >= 3) {
          continue
        }
        castles[2].blocks.push({
          x: castles[2].x + col * BLOCK_SIZE,
          y: castles[2].y + row * BLOCK_SIZE,
        })
      }
    }

    // Yellow castle (bottom right) - missing blocks at top left
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        // Skip some blocks to match the mockup
        if (row <= 1 && col <= 1) {
          continue
        }
        castles[3].blocks.push({
          x: castles[3].x + col * BLOCK_SIZE,
          y: castles[3].y + row * BLOCK_SIZE,
        })
      }
    }

    // Initialize gloves with proper arc parameters and constraints
    const gloves: Glove[] = [
      {
        // Red glove (top left)
        x: 0,
        y: 0,
        width: GLOVE_LONG, // Will be updated in updateGlovePosition
        height: GLOVE_SHORT, // Will be updated in updateGlovePosition
        direction: 0,
        hasBall: false,
        position: "top",
        color: castles[0].color,
        centerX: 0,
        centerY: 0,
        angle: Math.PI / 4, // Starting angle
        radius: 140, // Adjusted radius to stay within screen
        minAngle: 0, // Leftmost position
        maxAngle: Math.PI / 2, // Rightmost position
        castleIndex: 0, // Red castle
      },
      {
        // Blue glove (top right)
        x: 0,
        y: 0,
        width: GLOVE_LONG, // Will be updated in updateGlovePosition
        height: GLOVE_SHORT, // Will be updated in updateGlovePosition
        direction: 0,
        hasBall: false,
        position: "top",
        color: castles[1].color,
        centerX: GAME_WIDTH,
        centerY: 0,
        angle: Math.PI / 2 + Math.PI / 4, // Starting angle
        radius: 140, // Adjusted radius to stay within screen
        minAngle: Math.PI / 2, // Leftmost position
        maxAngle: Math.PI, // Rightmost position
        castleIndex: 1, // Blue castle
      },
      {
        // Green glove (bottom left)
        x: 0,
        y: 0,
        width: GLOVE_LONG, // Will be updated in updateGlovePosition
        height: GLOVE_SHORT, // Will be updated in updateGlovePosition
        direction: 0,
        hasBall: false,
        position: "bottom",
        color: castles[2].color,
        centerX: 0,
        centerY: GAME_HEIGHT,
        angle: 2 * Math.PI - Math.PI / 4, // Starting angle
        radius: 140, // Adjusted radius to stay within screen
        minAngle: (3 * Math.PI) / 2, // Leftmost position
        maxAngle: 2 * Math.PI, // Rightmost position
        castleIndex: 2, // Green castle
      },
      {
        // Yellow glove (bottom right)
        x: 0,
        y: 0,
        width: GLOVE_LONG, // Will be updated in updateGlovePosition
        height: GLOVE_SHORT, // Will be updated in updateGlovePosition
        direction: 0,
        hasBall: false,
        position: "bottom",
        color: castles[3].color,
        centerX: GAME_WIDTH,
        centerY: GAME_HEIGHT,
        angle: Math.PI + Math.PI / 4, // Starting angle
        radius: 140, // Adjusted radius to stay within screen
        minAngle: Math.PI, // Leftmost position
        maxAngle: (3 * Math.PI) / 2, // Rightmost position
        castleIndex: 3, // Yellow castle
      },
    ]

    // Initialize positions for all gloves
    gloves.forEach((glove) => {
      updateGlovePosition(glove)
    })

    // Initialize ball
    const ball: Ball = {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      dx: BALL_SPEED,
      dy: BALL_SPEED,
      radius: BALL_RADIUS,
      held: false,
      heldBy: null,
    }

    // Store game state
    gameStateRef.current = {
      ...gameStateRef.current,
      castles,
      gloves,
      ball,
    }

    // Draw initial game state
    drawGame()
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) {
        setGameStarted(true)
        return
      }

      const { keys } = gameStateRef.current
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        keys.left = true
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        keys.right = true
      }
      if (e.key === " ") {
        keys.space = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const { keys } = gameStateRef.current
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        keys.left = false
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        keys.right = false
      }
      if (e.key === " ") {
        keys.space = false
        keys.spaceReleased = true
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameStarted])

  // Game loop
  useEffect(() => {
    if (!gameStarted) return

    let animationFrameId: number
    let lastTime = 0

    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp
      const deltaTime = timestamp - lastTime
      lastTime = timestamp

      update(deltaTime)
      drawGame()

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop)
      }
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameStarted, gameOver])

  // Update game state
  const update = (deltaTime: number) => {
    const { castles, gloves, ball, keys, playerIndex } = gameStateRef.current
    if (!ball) return

    // Move player glove
    const playerGlove = gloves[playerIndex]
    const prevAngle = playerGlove.angle
    const ANGLE_STEP = 0.04 // Speed of angular movement

    if (keys.left) {
      // Move counterclockwise within constraints
      playerGlove.angle = Math.max(playerGlove.minAngle, playerGlove.angle - ANGLE_STEP)
    }
    if (keys.right) {
      // Move clockwise within constraints
      playerGlove.angle = Math.min(playerGlove.maxAngle, playerGlove.angle + ANGLE_STEP)
    }

    // Calculate new position based on angle for player glove
    updateGlovePosition(playerGlove)

    // Calculate direction based on movement
    playerGlove.direction = playerGlove.angle !== prevAngle ? (playerGlove.angle > prevAngle ? 1 : -1) : 0

    // AI gloves movement and ball handling
    gloves.forEach((glove, index) => {
      if (index === playerIndex) return // Skip player glove

      const prevAngle = glove.angle
      const shouldMove = Math.random() > AI_REACTION_TIME // Add some randomness to AI reactions

      if (shouldMove) {
        // Calculate target angle based on ball position
        let targetAngle = glove.angle

        // Red glove (top left)
        if (glove.castleIndex === 0) {
          // Only move if ball is coming toward this quadrant
          if (ball.y < GAME_HEIGHT / 2 && ball.x < GAME_WIDTH / 2) {
            const dx = ball.x - glove.centerX
            const dy = ball.y - glove.centerY
            targetAngle = Math.atan2(dy, dx)
            if (targetAngle < 0) targetAngle += 2 * Math.PI
            // Constrain to valid range
            targetAngle = Math.max(glove.minAngle, Math.min(glove.maxAngle, targetAngle))
          }
        }
        // Blue glove (top right)
        else if (glove.castleIndex === 1) {
          // Only move if ball is coming toward this quadrant
          if (ball.y < GAME_HEIGHT / 2 && ball.x > GAME_WIDTH / 2) {
            const dx = ball.x - glove.centerX
            const dy = ball.y - glove.centerY
            targetAngle = Math.atan2(dy, dx)
            if (targetAngle < 0) targetAngle += 2 * Math.PI
            // Constrain to valid range
            targetAngle = Math.max(glove.minAngle, Math.min(glove.maxAngle, targetAngle))
          }
        }
        // Green glove (bottom left)
        else if (glove.castleIndex === 2 && index !== playerIndex) {
          // Only move if ball is coming toward this quadrant
          if (ball.y > GAME_HEIGHT / 2 && ball.x < GAME_WIDTH / 2) {
            const dx = ball.x - glove.centerX
            const dy = ball.y - glove.centerY
            targetAngle = Math.atan2(dy, dx)
            if (targetAngle < 0) targetAngle += 2 * Math.PI
            // Constrain to valid range
            targetAngle = Math.max(glove.minAngle, Math.min(glove.maxAngle, targetAngle))
          }
        }
        // Yellow glove (bottom right)
        else if (glove.castleIndex === 3) {
          // Only move if ball is coming toward this quadrant
          if (ball.y > GAME_HEIGHT / 2 && ball.x > GAME_WIDTH / 2) {
            const dx = ball.x - glove.centerX
            const dy = ball.y - glove.centerY
            targetAngle = Math.atan2(dy, dx)
            if (targetAngle < 0) targetAngle += 2 * Math.PI
            // Constrain to valid range
            targetAngle = Math.max(glove.minAngle, Math.min(glove.maxAngle, targetAngle))
          }
        }

        // Move toward target angle
        if (Math.abs(targetAngle - glove.angle) > 0.05) {
          if (
            (targetAngle > glove.angle && targetAngle - glove.angle < Math.PI) ||
            (targetAngle < glove.angle && glove.angle - targetAngle > Math.PI)
          ) {
            glove.angle = Math.min(glove.maxAngle, glove.angle + ANGLE_STEP)
          } else {
            glove.angle = Math.max(glove.minAngle, glove.angle - ANGLE_STEP)
          }
        }

        // Update glove position based on angle
        updateGlovePosition(glove)

        // Calculate direction based on movement
        glove.direction = glove.angle !== prevAngle ? (glove.angle > prevAngle ? 1 : -1) : 0
      }

      // AI ball catch and release
      if (!ball.held && checkBallGloveCollision(ball, glove)) {
        // Catch the ball with some probability
        if (Math.random() > 0.3) {
          ball.held = true
          ball.heldBy = index
        } else {
          // Bounce the ball
          bounceOffGlove(ball, glove)
        }
      } else if (ball.held && ball.heldBy === index) {
        // Release the ball after a short delay
        if (Math.random() > 0.95) {
          ball.held = false
          ball.heldBy = null

          // Set ball direction based on glove movement
          setDirectionBasedOnGloveMovement(ball, glove)
        }
      }
    })

    // Handle ball catch and release for player
    if (keys.space && keys.spaceReleased && !ball.held) {
      // Check if ball is touching the player's glove
      if (checkBallGloveCollision(ball, playerGlove)) {
        ball.held = true
        ball.heldBy = playerIndex
        keys.spaceReleased = false
      }
    } else if (!keys.space && ball.held && ball.heldBy === playerIndex) {
      // Release the ball
      ball.held = false
      ball.heldBy = null

      // Set ball direction based on glove movement
      setDirectionBasedOnGloveMovement(ball, playerGlove)
    }

    // Update ball position if not held
    if (!ball.held) {
      ball.x += ball.dx
      ball.y += ball.dy

      // Ball collision with walls
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > GAME_WIDTH) {
        ball.dx = -ball.dx
        ball.x = ball.x - ball.radius < 0 ? ball.radius : GAME_WIDTH - ball.radius
      }
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > GAME_HEIGHT) {
        ball.dy = -ball.dy
        ball.y = ball.y - ball.radius < 0 ? ball.radius : GAME_HEIGHT - ball.radius
      }

      // Ball collision with gloves (when not catching)
      gloves.forEach((glove, index) => {
        if (!keys.space || ball.heldBy !== null) {
          if (checkBallGloveCollision(ball, glove)) {
            bounceOffGlove(ball, glove)
          }
        }
      })

      // Ball collision with castle blocks
      castles.forEach((castle, castleIndex) => {
        for (let i = castle.blocks.length - 1; i >= 0; i--) {
          const block = castle.blocks[i]
          if (
            ball.x + ball.radius > block.x &&
            ball.x - ball.radius < block.x + BLOCK_SIZE &&
            ball.y + ball.radius > block.y &&
            ball.y - ball.radius < block.y + BLOCK_SIZE
          ) {
            // Remove the block
            castle.blocks.splice(i, 1)

            // Bounce the ball
            // Determine which side of the block was hit
            const dx = ball.x - (block.x + BLOCK_SIZE / 2)
            const dy = ball.y - (block.y + BLOCK_SIZE / 2)

            if (Math.abs(dx) > Math.abs(dy)) {
              ball.dx = dx > 0 ? Math.abs(ball.dx) : -Math.abs(ball.dx)
            } else {
              ball.dy = dy > 0 ? Math.abs(ball.dy) : -Math.abs(ball.dy)
            }

            break
          }
        }
      })
    } else if (ball.heldBy !== null) {
      // Update ball position if held by a glove
      const holdingGlove = gloves[ball.heldBy]

      // Calculate the position based on the glove's angle
      const radialX = Math.cos(holdingGlove.angle)
      const radialY = Math.sin(holdingGlove.angle)

      // Position the ball at the outer edge of the glove
      if (holdingGlove.castleIndex === 0) {
        // Red (top left)
        ball.x = holdingGlove.centerX + (holdingGlove.radius + ball.radius) * radialX
        ball.y = holdingGlove.centerY + (holdingGlove.radius + ball.radius) * radialY
      } else if (holdingGlove.castleIndex === 1) {
        // Blue (top right)
        ball.x = holdingGlove.centerX + (holdingGlove.radius + ball.radius) * radialX
        ball.y = holdingGlove.centerY + (holdingGlove.radius + ball.radius) * radialY
      } else if (holdingGlove.castleIndex === 2) {
        // Green (bottom left)
        ball.x = holdingGlove.centerX + (holdingGlove.radius + ball.radius) * radialX
        ball.y = holdingGlove.centerY + (holdingGlove.radius + ball.radius) * radialY
      } else if (holdingGlove.castleIndex === 3) {
        // Yellow (bottom right)
        ball.x = holdingGlove.centerX + (holdingGlove.radius + ball.radius) * radialX
        ball.y = holdingGlove.centerY + (holdingGlove.radius + ball.radius) * radialY
      }
    }

    // Check game over condition
    const remainingCastles = castles.filter((castle) => castle.blocks.length > 0)
    if (remainingCastles.length <= 1) {
      setGameOver(true)
      if (remainingCastles.length === 1) {
        setWinner(castles.findIndex((castle) => castle.blocks.length > 0))
      }
    }
  }

  // Update glove position based on its angle
  const updateGlovePosition = (glove: Glove) => {
    // Calculate position based on center point and angle
    const radialX = Math.cos(glove.angle)
    const radialY = Math.sin(glove.angle)

    // Calculate the tangent angle (perpendicular to the radial line)
    const tangentAngle = glove.angle + Math.PI / 2
    const tangentX = Math.cos(tangentAngle)
    const tangentY = Math.sin(tangentAngle)

    // Position the glove with its center on the arc
    const centerPosX = glove.centerX + radialX * glove.radius
    const centerPosY = glove.centerY + radialY * glove.radius

    // Rotate the glove to face outward (long side perpendicular to radius)
    glove.x = centerPosX - (GLOVE_LONG / 2) * tangentX
    glove.y = centerPosY - (GLOVE_LONG / 2) * tangentY

    // Set width and height
    glove.width = GLOVE_LONG
    glove.height = GLOVE_SHORT
  }

  // Draw game
  const drawGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { castles, gloves, ball } = gameStateRef.current

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw castles
    castles.forEach((castle) => {
      castle.blocks.forEach((block) => {
        ctx.fillStyle = castle.color
        ctx.fillRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE)
        ctx.strokeStyle = "#000"
        ctx.strokeRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE)
      })
    })

    // Draw gloves with rotation
    gloves.forEach((glove) => {
      ctx.save()

      // Calculate center of the glove
      const gloveCenterX = glove.x + glove.width / 2
      const gloveCenterY = glove.y + glove.height / 2

      // Translate to the center of the glove
      ctx.translate(gloveCenterX, gloveCenterY)

      // Rotate the context to match the glove's angle
      ctx.rotate(glove.angle + Math.PI / 2)

      // Draw the rotated glove
      ctx.fillStyle = glove.color
      ctx.fillRect(-glove.width / 2, -glove.height / 2, glove.width, glove.height)
      ctx.strokeStyle = "#000"
      ctx.strokeRect(-glove.width / 2, -glove.height / 2, glove.width, glove.height)

      // Restore the context
      ctx.restore()
    })

    // Draw ball
    if (ball) {
      ctx.fillStyle = "#fff"
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#000"
      ctx.stroke()
    }

    // Draw game over message
    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#fff"
      ctx.font = "30px Arial"
      ctx.textAlign = "center"

      if (winner !== null) {
        const colors = ["Red", "Blue", "Green", "Yellow"]
        ctx.fillText(`${colors[winner]} Castle Wins!`, canvas.width / 2, canvas.height / 2)
      } else {
        ctx.fillText("Game Over - Draw!", canvas.width / 2, canvas.height / 2)
      }

      ctx.font = "20px Arial"
      ctx.fillText("Click or press any key to restart", canvas.width / 2, canvas.height / 2 + 40)
    } else if (!gameStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#fff"
      ctx.font = "30px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Castle Defender", canvas.width / 2, canvas.height / 2 - 40)
      ctx.font = "20px Arial"
      ctx.fillText("Press any key to start", canvas.width / 2, canvas.height / 2)
      ctx.font = "16px Arial"
      ctx.fillText("Use A/D keys to move your glove (bottom)", canvas.width / 2, canvas.height / 2 + 40)
      ctx.fillText("Press SPACE to catch and release the ball", canvas.width / 2, canvas.height / 2 + 70)
    }
  }

  // Bounce ball off glove
  const bounceOffGlove = (ball: Ball, glove: Glove) => {
    // Calculate the angle of reflection based on the glove's position
    const dx = ball.x - glove.centerX
    const dy = ball.y - glove.centerY
    const angle = Math.atan2(dy, dx)

    // Set the ball's velocity based on the reflection angle
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
    ball.dx = Math.cos(angle) * speed
    ball.dy = Math.sin(angle) * speed
  }

  // Set ball direction based on glove movement
  const setDirectionBasedOnGloveMovement = (ball: Ball, glove: Glove) => {
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)

    // Calculate the radial direction (away from the center)
    const dx = ball.x - glove.centerX
    const dy = ball.y - glove.centerY
    const angle = Math.atan2(dy, dx)

    // Add some influence from the glove's movement direction
    let releaseAngle = angle
    if (glove.direction !== 0) {
      // Adjust the angle slightly based on the glove's movement direction
      releaseAngle += glove.direction * 0.2
    }

    // Set the ball's velocity
    ball.dx = Math.cos(releaseAngle) * speed
    ball.dy = Math.sin(releaseAngle) * speed
  }

  // Check if ball is touching a glove
  const checkBallGloveCollision = (ball: Ball, glove: Glove) => {
    // Calculate the center of the glove based on its position on the arc
    const radialX = Math.cos(glove.angle)
    const radialY = Math.sin(glove.angle)
    const gloveCenterX = glove.centerX + radialX * glove.radius
    const gloveCenterY = glove.centerY + radialY * glove.radius

    // Calculate the distance between the ball and the glove center
    const dx = ball.x - gloveCenterX
    const dy = ball.y - gloveCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if the ball is close enough to the glove
    return distance < ball.radius + Math.max(glove.width, glove.height) / 2
  }

  // Restart game
  const restartGame = () => {
    setGameOver(false)
    setWinner(null)
    setGameStarted(false)

    // Re-initialize game
    const canvas = canvasRef.current
    if (!canvas) return

    const event = new Event("load")
    window.dispatchEvent(event)
  }

  return (
    <div className="relative w-fit h-fit">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="block border border-gray-300 rounded-lg shadow-lg"
        onClick={gameOver ? restartGame : undefined}
      />
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 p-6 rounded-lg text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Castle Defender</h2>
            <p className="mb-2">Press any key to start</p>
            <p className="text-sm">Use A/D keys to move your glove (bottom)</p>
            <p className="text-sm">Press SPACE to catch and release the ball</p>
          </div>
        </div>
      )}
    </div>
  )
}

