"use client"

import { MessageSquare, type LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryIconProps {
  iconName?: string | null
  color?: string | null
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

export function CategoryIcon({ iconName, color, className, size = "md" }: CategoryIconProps) {
  // Get the icon component from Lucide with proper typing
  const IconComponent = (iconName && iconName in LucideIcons
    ? LucideIcons[iconName as keyof typeof LucideIcons]
    : MessageSquare) as LucideIcon

  return <IconComponent className={cn(sizeClasses[size], className)} style={{ color: color || "var(--primary)" }} />
}
