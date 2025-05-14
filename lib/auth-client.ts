import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"
import { adminClient } from "better-auth/client/plugins"
import { organizationClient } from "better-auth/client/plugins"
import { magicLinkClient } from "better-auth/client/plugins"
import { emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  plugins: [
    twoFactorClient(),
    adminClient(),
    organizationClient(),
    magicLinkClient(),
    emailOTPClient()
  ],
  // baseURL: process.env.BETTER_AUTH_URL
})
export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient;
