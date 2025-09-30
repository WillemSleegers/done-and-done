interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}