"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

interface WebhookEvent {
  type: 'thread.created' | 'post.created' | 'user.joined' | 'user.banned' | 'report.created'
  data: Record<string, any>
  timestamp: string
  forum_id?: string
}

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  secret: string
  active: boolean
  createdAt: Date
  lastTriggered?: Date
}

// In-memory store for demo - replace with database table in production
const webhookStore = new Map<string, WebhookEndpoint>()

export async function createWebhook(
  url: string,
  events: string[],
  secret?: string
): Promise<{
  success: boolean
  webhook?: WebhookEndpoint
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      throw new Error("Invalid webhook URL")
    }

    // Validate events
    const validEvents = [
      'thread.created',
      'thread.updated',
      'thread.deleted',
      'post.created',
      'post.updated',
      'post.deleted',
      'user.joined',
      'user.banned',
      'report.created'
    ]

    const invalidEvents = events.filter(event => !validEvents.includes(event))
    if (invalidEvents.length > 0) {
      throw new Error(`Invalid events: ${invalidEvents.join(', ')}`)
    }

    const webhook: WebhookEndpoint = {
      id: `webhook_${Date.now()}`,
      url,
      events,
      secret: secret || generateWebhookSecret(),
      active: true,
      createdAt: new Date()
    }

    webhookStore.set(webhook.id, webhook)

    return { success: true, webhook }
  } catch (error) {
    console.error("Error creating webhook:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create webhook"
    }
  }
}

export async function updateWebhook(
  webhookId: string,
  updates: Partial<Pick<WebhookEndpoint, 'url' | 'events' | 'active'>>
): Promise<{
  success: boolean
  webhook?: WebhookEndpoint
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    const webhook = webhookStore.get(webhookId)
    if (!webhook) {
      throw new Error("Webhook not found")
    }

    // Validate URL if provided
    if (updates.url) {
      try {
        new URL(updates.url)
      } catch {
        throw new Error("Invalid webhook URL")
      }
    }

    const updatedWebhook = { ...webhook, ...updates }
    webhookStore.set(webhookId, updatedWebhook)

    return { success: true, webhook: updatedWebhook }
  } catch (error) {
    console.error("Error updating webhook:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update webhook"
    }
  }
}

export async function deleteWebhook(webhookId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    const deleted = webhookStore.delete(webhookId)
    if (!deleted) {
      throw new Error("Webhook not found")
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting webhook:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete webhook"
    }
  }
}

export async function getWebhooks(): Promise<{
  success: boolean
  webhooks?: WebhookEndpoint[]
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    const webhooks = Array.from(webhookStore.values())
    return { success: true, webhooks }
  } catch (error) {
    console.error("Error fetching webhooks:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch webhooks",
      webhooks: []
    }
  }
}

export async function triggerWebhook(event: WebhookEvent): Promise<void> {
  try {
    const webhooks = Array.from(webhookStore.values())
      .filter(webhook => 
        webhook.active && 
        webhook.events.includes(event.type)
      )

    if (webhooks.length === 0) {
      return
    }

    // Trigger webhooks in parallel
    await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          const payload = {
            ...event,
            webhook_id: webhook.id
          }

          const signature = await generateWebhookSignature(
            JSON.stringify(payload),
            webhook.secret
          )

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forum-Signature': signature,
              'X-Forum-Event': event.type,
              'User-Agent': 'OpenForum-Webhooks/1.0'
            },
            body: JSON.stringify(payload)
          })

          if (!response.ok) {
            console.warn(`Webhook ${webhook.id} failed:`, response.status, response.statusText)
          } else {
            // Update last triggered time
            webhook.lastTriggered = new Date()
            webhookStore.set(webhook.id, webhook)
          }
        } catch (error) {
          console.error(`Error triggering webhook ${webhook.id}:`, error)
        }
      })
    )
  } catch (error) {
    console.error("Error triggering webhooks:", error)
  }
}

export async function testWebhook(webhookId: string): Promise<{
  success: boolean
  response?: {
    status: number
    statusText: string
    responseTime: number
  }
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    const webhook = webhookStore.get(webhookId)
    if (!webhook) {
      throw new Error("Webhook not found")
    }

    const testEvent: WebhookEvent = {
      type: 'thread.created',
      data: {
        test: true,
        message: 'This is a test webhook delivery'
      },
      timestamp: new Date().toISOString()
    }

    const payload = {
      ...testEvent,
      webhook_id: webhook.id
    }

    const signature = await generateWebhookSignature(
      JSON.stringify(payload),
      webhook.secret
    )

    const startTime = Date.now()
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forum-Signature': signature,
        'X-Forum-Event': testEvent.type,
        'User-Agent': 'OpenForum-Webhooks/1.0'
      },
      body: JSON.stringify(payload)
    })
    const responseTime = Date.now() - startTime

    return {
      success: response.ok,
      response: {
        status: response.status,
        statusText: response.statusText,
        responseTime
      }
    }
  } catch (error) {
    console.error("Error testing webhook:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to test webhook"
    }
  }
}

// Utility functions
function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function generateWebhookSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  )
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Helper function to be called from other actions
export async function emitWebhookEvent(
  type: WebhookEvent['type'],
  data: Record<string, any>
): Promise<void> {
  const event: WebhookEvent = {
    type,
    data,
    timestamp: new Date().toISOString()
  }
  
  // Fire and forget - don't await
  triggerWebhook(event).catch(error => {
    console.error("Failed to trigger webhook event:", error)
  })
}
