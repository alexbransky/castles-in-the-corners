import CastleGame from "@/components/castle-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 overflow-hidden">
      <h1 className="mb-4 text-2xl font-bold">Castle Defender</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Use A/D keys to move your glove (bottom). Press SPACE to catch and release the ball.
      </p>
      <CastleGame />
    </main>
  )
}

