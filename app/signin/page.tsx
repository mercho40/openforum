"use client"
import { LoginForm } from "@/components/login-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function Home() {

  // Function to handle the back button click
  const handleBack = () => {
    window.history.back()
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="absolute top-4 left-4">
          <Button 
            variant="outline"
            size={"sm"}
            className="text-muted-foreground hover:text-foreground aspect-square w-auto h-auto border-2"
            onClick={() => handleBack()}
          >
              <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
    