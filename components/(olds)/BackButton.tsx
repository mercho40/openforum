"use client"
import { ChevronLeft } from "lucide-react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href }: BackButtonProps) {
    const router = useRouter();
    
    // Function to handle the back button click
    const handleBack = () => {
        if (href) {
            router.push(href);
        } else {
            window.history.back();
        }
    }
    
    return (
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
    )
}