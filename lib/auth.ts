import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { twoFactor } from "better-auth/plugins"
import { admin } from "better-auth/plugins"
import { organization } from "better-auth/plugins"
import { emailOTP } from "better-auth/plugins"
import { username } from "better-auth/plugins"
import { prisma } from "@/prisma"
import { sendVerificationEmail, sendForgotPassEmail } from "@/actions/email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
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
  appName: process.env.APP_NAME || "OpenForum",
});

