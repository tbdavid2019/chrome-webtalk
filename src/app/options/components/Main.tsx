import { type ReactNode, type FC } from 'react'

export interface MainProps {
  children?: ReactNode
}

const Main: FC<MainProps> = ({ children }) => {
  return (
    <main className="grid min-h-screen min-w-screen items-center justify-center">
      <div className="relative rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xl">
        <div className="flex flex-col items-center gap-10 py-12">{children}</div>
      </div>
    </main>
  )
}

Main.displayName = 'Main'

export default Main
