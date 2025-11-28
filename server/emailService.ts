// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

// Get fresh Resend client (tokens expire, so never cache)
async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Alpha Source <noreply@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string, baseUrl: string): Promise<boolean> {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 28px;">Alpha Source</h1>
        </div>
        
        <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px;">Verify Your Email</h2>
        
        <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
          Thanks for signing up! Please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
          If you didn't create an account, you can safely ignore this email. This link will expire in 24 hours.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${verifyUrl}" style="color: #a855f7; word-break: break-all;">${verifyUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your Alpha Source email',
    html,
    text: `Verify your email by visiting: ${verifyUrl}`
  });
}

export async function send2FAEnabledEmail(email: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>2FA Enabled</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 28px;">Alpha Source</h1>
        </div>
        
        <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px;">Two-Factor Authentication Enabled</h2>
        
        <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
          Two-factor authentication has been successfully enabled on your account. Your account is now more secure.
        </p>
        
        <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #166534; margin: 0; font-size: 14px;">
            <strong>Important:</strong> Make sure you've saved your backup codes in a safe place. You'll need them if you lose access to your authenticator app.
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
          If you didn't enable 2FA, please contact support immediately and change your password.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Two-Factor Authentication Enabled - Alpha Source',
    html,
    text: 'Two-factor authentication has been successfully enabled on your Alpha Source account.'
  });
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a855f7; margin: 0; font-size: 28px;">Alpha Source</h1>
        </div>
        
        <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px;">Reset Your Password</h2>
        
        <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
          If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your Alpha Source password',
    html,
    text: `Reset your password by visiting: ${resetUrl}`
  });
}
