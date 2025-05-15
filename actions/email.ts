import { Resend } from 'resend';
const resend = new Resend(process.env.AUTH_RESEND_KEY);

export async function sendVerificationEmail({ email, otp, type }: { email: string, otp: string, type: string }) {
  await resend.emails.send({
    from: process.env.APP_NAME + ' <verificaton@' + process.env.APP_DOMAIN,
    to: email,
    subject: 'Verification code',
    html: `Your verification code is ${otp}. This code will expire in 15 minutes. If you did not request this code, please ignore this email.`,
  });
}
export async function sendForgotPassEmail({ email, otp, type }: { email: string, otp: string, type: string }) {
  await resend.emails.send({
    from: process.env.APP_NAME + ' <verificaton@' + process.env.APP_DOMAIN,
    to: email,
    subject: 'Reset password',
    html: `Your reset password code is ${otp}. This code will expire in 15 minutes. If you did not request this code, please ignore this email.`,
  });
}
