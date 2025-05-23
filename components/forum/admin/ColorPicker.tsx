"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Define available colors (easily configurable)
export const AVAILABLE_COLORS = [
  { name: "Blue", value: "#3498db", category: "Primary" },
  { name: "Indigo", value: "#6366f1", category: "Primary" },
  { name: "Purple", value: "#8b5cf6", category: "Primary" },
  { name: "Pink", value: "#ec4899", category: "Primary" },
  { name: "Red", value: "#ef4444", category: "Primary" },
  { name: "Orange", value: "#f97316", category: "Primary" },
  { name: "Amber", value: "#f59e0b", category: "Primary" },
  { name: "Yellow", value: "#eab308", category: "Primary" },
  { name: "Lime", value: "#84cc16", category: "Primary" },
  { name: "Green", value: "#22c55e", category: "Primary" },
  { name: "Emerald", value: "#10b981", category: "Primary" },
  { name: "Teal", value: "#14b8a6", category: "Primary" },
  { name: "Cyan", value: "#06b6d4", category: "Primary" },
  { name: "Sky", value: "#0ea5e9", category: "Primary" },

  { name: "Light Blue", value: "#7dd3fc", category: "Light" },
  { name: "Light Purple", value: "#c4b5fd", category: "Light" },
  { name: "Light Pink", value: "#f9a8d4", category: "Light" },
  { name: "Light Red", value: "#fca5a5", category: "Light" },
  { name: "Light Orange", value: "#fdba74", category: "Light" },
  { name: "Light Yellow", value: "#fde047", category: "Light" },
  { name: "Light Green", value: "#86efac", category: "Light" },
  { name: "Light Teal", value: "#5eead4", category: "Light" },

  { name: "Dark Blue", value: "#1e40af", category: "Dark" },
  { name: "Dark Purple", value: "#7c3aed", category: "Dark" },
  { name: "Dark Pink", value: "#be185d", category: "Dark" },
  { name: "Dark Red", value: "#dc2626", category: "Dark" },
  { name: "Dark Orange", value: "#ea580c", category: "Dark" },
  { name: "Dark Yellow", value: "#ca8a04", category: "Dark" },
  { name: "Dark Green", value: "#16a34a", category: "Dark" },
  { name: "Dark Teal", value: "#0f766e", category: "Dark" },

  { name: "Slate", value: "#64748b", category: "Neutral" },
  { name: "Gray", value: "#6b7280", category: "Neutral" },
  { name: "Zinc", value: "#71717a", category: "Neutral" },
  { name: "Stone", value: "#78716c", category: "Neutral" },
]

interface ColorPickerProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function ColorPicker({ value, onValueChange, placeholder = "Select a color" }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  const selectedColor = AVAILABLE_COLORS.find((color) => color.value === value)
  const colorsByCategory = AVAILABLE_COLORS.reduce(
    (acc, color) => {
      if (!acc[color.category]) {
        acc[color.category] = []
      }
      acc[color.category].push(color)
      return acc
    },
    {} as Record<string, typeof AVAILABLE_COLORS>,
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background/50 border-border/10"
        >
          <div className="flex items-center gap-2">
            {selectedColor ? (
              <>
                <div
                  className="h-4 w-4 rounded-full border border-border/20"
                  style={{ backgroundColor: selectedColor.value }}
                />
                <span>{selectedColor.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-4">
          {Object.entries(colorsByCategory).map(([category, colors]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
              <div className="grid grid-cols-7 gap-2">
                {colors.map((color) => (
                  <Button
                    key={color.value}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 p-0 border border-border/20 hover:scale-110 transition-transform",
                      value === color.value && "ring-2 ring-primary ring-offset-2",
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      onValueChange(color.value)
                      setOpen(false)
                    }}
                    title={color.name}
                  >
                    {value === color.value && <Check className="h-3 w-3 text-white drop-shadow-sm" />}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {value && (
          <div className="p-3 border-t border-border/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-border/20" style={{ backgroundColor: value }} />
                <span className="text-sm font-medium">{selectedColor?.name || value}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onValueChange("#3498db") // Default color
                  setOpen(false)
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
