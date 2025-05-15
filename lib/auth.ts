import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { twoFactor } from "better-auth/plugins"
import { admin } from "better-auth/plugins"
import { organization } from "better-auth/plugins"
import { magicLink } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins"
import { username } from "better-auth/plugins"
import { prisma } from "@/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data, request) {
      // Send an email to the user with a link to reset their password
      console.log(data, request);
    },
  },
  plugins: [
    twoFactor(),
    admin(),
    username(),
    organization(),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        // send email to user
        console.log(email, token, url, request);
      }
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement the sendVerificationOTP method to send the OTP to the user's email address
        console.log(email, otp, type);
      },
      otpLength: 6,
      expiresIn: 900, // 15 minutes
    })
  ], socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }, github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  appName: process.env.NEXT_PUBLIC_APP_NAME || "OpenForum",
});

