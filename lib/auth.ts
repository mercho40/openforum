import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins"
import { admin } from "better-auth/plugins"
import { organization } from "better-auth/plugins"
import { emailOTP } from "better-auth/plugins"
import { username } from "better-auth/plugins"
import { prisma } from "@/prisma"
import { sendVerificationEmail, sendForgotPassEmail } from "@/actions/email"
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor(),
    admin(),
    username(),
    organization(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement the sendVerificationOTP method to send the OTP to the user's email address
        if (type === "email-verification") {
          await sendVerificationEmail({ email, otp, type });
        } else if (type === "forget-password") {
          await sendForgotPassEmail({ email, otp, type });
        } else {
          throw new Error("Invalid type");
        }
      },
      otpLength: 6,
      expiresIn: 900, // 15 minutes
      disableSignUp: true,
      sendVerificationOnSignUp: false,

    }),
    nextCookies()
  ], socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }, github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      metadata: {
        type: "string",
        nullable: true,
        input: true,
      },
      bio: {
        type: "string",
        nullable: true,
        input: true,
      },
      signature: {
        type: "string",
        nullable: true,
        input: true,
      },
      website: {
        type: "string",
        nullable: true,
        input: true,
      },
      location: {
        type: "string",
        nullable: true,
        input: true,

      },

    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache duration in seconds
      },
    },
  },
  appName: process.env.APP_NAME || "OpenForum",
});

export type Session = typeof auth.$Infer.Session
