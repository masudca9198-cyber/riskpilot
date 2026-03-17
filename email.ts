// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const baseStyle = `
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #09090f;
  color: #e2e8f0;
`

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: `"RiskPilot" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify your RiskPilot account',
    html: `
      <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1d2e, #141624); border: 1px solid rgba(98,114,241,0.2); border-radius: 16px; padding: 40px;">
          <h1 style="color: #6272f1; margin: 0 0 8px; font-size: 28px;">RiskPilot</h1>
          <p style="color: #94a3b8; margin: 0 0 32px; font-size: 13px;">Financial Risk Intelligence</p>
          <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">Verify your email, ${name}</h2>
          <p style="color: #94a3b8; line-height: 1.6; margin: 0 0 32px;">
            Click the button below to verify your email address and activate your RiskPilot account.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background: #6272f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Verify Email Address
          </a>
          <p style="color: #64748b; font-size: 12px; margin: 32px 0 0;">
            This link expires in 24 hours. If you didn't create an account, ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"RiskPilot" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Reset your RiskPilot password',
    html: `
      <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1d2e, #141624); border: 1px solid rgba(98,114,241,0.2); border-radius: 16px; padding: 40px;">
          <h1 style="color: #6272f1; margin: 0 0 8px; font-size: 28px;">RiskPilot</h1>
          <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">Reset your password</h2>
          <p style="color: #94a3b8; line-height: 1.6; margin: 0 0 32px;">
            Hi ${name}, we received a request to reset your password. Click below to choose a new one.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #6272f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
          <p style="color: #64748b; font-size: 12px; margin: 32px 0 0;">
            This link expires in 1 hour. If you didn't request this, your account is safe.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string, plan: string) {
  await transporter.sendMail({
    from: `"RiskPilot" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Welcome to RiskPilot ${plan} — You're all set!`,
    html: `
      <div style="${baseStyle} padding: 40px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1d2e, #141624); border: 1px solid rgba(98,114,241,0.2); border-radius: 16px; padding: 40px;">
          <h1 style="color: #6272f1; margin: 0 0 32px; font-size: 28px;">RiskPilot</h1>
          <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">Welcome aboard, ${name}! 🎉</h2>
          <p style="color: #94a3b8; line-height: 1.6; margin: 0 0 16px;">
            Your <strong style="color: #6272f1;">${plan}</strong> subscription is now active. 
            Here's what you can do next:
          </p>
          <ul style="color: #94a3b8; line-height: 2; padding-left: 20px;">
            <li>Generate your first API key from the dashboard</li>
            <li>Send transactions to <code style="color: #6272f1;">POST /api/analyze-transaction</code></li>
            <li>Monitor risk scores in real-time</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="display: inline-block; background: #6272f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `,
  })
}
