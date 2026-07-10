// Utility validation and sanitization functions

export function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .trim()
}

export function containsProfanity(text: string): boolean {
  const profanityList = [
    'badword1', 'badword2' // Example placeholders
  ]
  const lowerText = text.toLowerCase()
  return profanityList.some(word => lowerText.includes(word))
}

export function isSpam(content: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/i, // Repeated characters
    /(https?:\/\/[^\s]+.*){5,}/i, // Multiple URLs
    /buy now|click here|limited time|act fast/i, // Spam phrases
  ]
  return spamPatterns.some(pattern => pattern.test(content))
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

export function validateImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
  return imageExtensions.test(url)
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" }
  }
  if (username.length > 30) {
    return { valid: false, error: "Username must not exceed 30 characters" }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, hyphens, and underscores" }
  }
  const reservedNames = ['admin', 'moderator', 'system', 'support', 'help', 'api', 'www']
  if (reservedNames.includes(username.toLowerCase())) {
    return { valid: false, error: "This username is reserved" }
  }
  return { valid: true }
}

export function handleActionError(error: unknown): { success: false; error: string } {
  console.error("Action error:", error)
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    }
  }
  return {
    success: false,
    error: "An unexpected error occurred"
  }
}
