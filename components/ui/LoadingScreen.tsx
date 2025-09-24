import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}