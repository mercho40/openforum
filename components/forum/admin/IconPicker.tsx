"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

// Define available icons (easily configurable)
const AVAILABLE_ICONS = [
  "MessageSquare", "FolderTree", "Users", "Settings", "Shield", "Star", "Heart", "Home",
  "User", "Mail", "Phone", "Calendar", "Clock", "MapPin", "Camera", "Image",
  "Video", "Music", "Headphones", "Mic", "Volume2", "Play", "Pause", "Square",
  "Circle", "Triangle", "Diamond", "Hexagon", "Zap", "Flame", "Snowflake", "Sun",
  "Moon", "Cloud", "CloudRain", "Umbrella", "Wind", "Thermometer", "Eye", "EyeOff",
  "Lock", "Unlock", "Key", "CreditCard", "Wallet", "ShoppingCart", "ShoppingBag", "Gift",
  "Package", "Truck", "Car", "Bike", "Plane", "Train", "Bus", "Ship",
  "Rocket", "Satellite", "Globe", "Map", "Navigation", "Compass", "Target", "Flag",
  "Trophy", "Award", "Medal", "Crown", "Gem", "Coins", "DollarSign", "Euro",
  "PoundSterling", "Yen", "Bitcoin", "TrendingUp", "TrendingDown", "BarChart", "PieChart", "Activity",
  "Monitor", "Smartphone", "Tablet", "Laptop", "Desktop", "Server", "Database", "HardDrive",
  "Cpu", "MemoryStick", "Wifi", "WifiOff", "Bluetooth", "Usb", "Power", "Battery",
  "BatteryLow", "Plug", "Cable", "Router", "Printer", "Scanner", "Keyboard", "Mouse",
  "Gamepad2", "Joystick", "Dice1", "Dice2", "Dice3", "Dice4", "Dice5", "Dice6",
  "Spade", "Club", "Heart", "Diamond", "Puzzle", "Gamepad", "Dices", "Casino",
  "Book", "BookOpen", "Library", "GraduationCap", "School", "Pencil", "Pen", "PenTool",
  "Eraser", "Ruler", "Calculator", "Scissors", "Paperclip", "Pin", "Pushpin", "Bookmark",
  "Tag", "Tags", "Label", "Folder", "FolderOpen", "File", "FileText", "FilePlus",
  "FileX", "Download", "Upload", "Share", "Link", "ExternalLink", "Copy", "Cut",
  "Paste", "Clipboard", "ClipboardList", "ClipboardCheck", "ClipboardX", "Archive", "Trash", "Trash2"
]

interface IconPickerProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function IconPicker({ value, onValueChange, placeholder = "Select an icon" }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!debouncedSearch) return AVAILABLE_ICONS
    return AVAILABLE_ICONS.filter(iconName =>
      iconName.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [debouncedSearch])

  // Get the selected icon component
  const SelectedIcon = value && value in LucideIcons 
    ? (LucideIcons as any)[value] 
    : null

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
            {SelectedIcon ? (
              <>
                <SelectedIcon className="h-4 w-4" />
                <span>{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-background/50 border-border/10"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-6 gap-1 p-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = (LucideIcons as any)[iconName]
              if (!IconComponent) return null

              return (
                <Button
                  key={iconName}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 hover:bg-primary/10",
                    value === iconName && "bg-primary/10 text-primary"
                  )}
                  onClick={() => {
                    onValueChange(iconName)
                    setOpen(false)
                  }}
                  title={iconName}
                >
                  <IconComponent className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
          {filteredIcons.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No icons found for &quot;{debouncedSearch}&quot;
            </div>
          )}
        </ScrollArea>
        {value && (
          <div className="p-3 border-t border-border/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SelectedIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{value}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onValueChange("")
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
