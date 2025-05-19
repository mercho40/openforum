import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"
import { adminClient } from "better-auth/client/plugins"
import { emailOTPClient } from "better-auth/client/plugins"
import { usernameClient } from "better-auth/client/plugins"
// import { inferAdditionalFields } from "better-auth/client/plugins";
// import type { auth } from "./auth";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  plugins: [
    twoFactorClient(),
    adminClient(),
    emailOTPClient(),
    usernameClient(),
    // inferAdditionalFields({
    //   user: {
    //     metadata: {
    //       type: "string",
    //     },
    //     bio: {
    //       type: "string",
    //     },
    //   },
    // }),
    // inferAdditionalFields<typeof auth>()
  ],
  // baseURL: process.env.BETTER_AUTH_URL
})
export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient;

export type Session = typeof authClient.$Infer.Session
