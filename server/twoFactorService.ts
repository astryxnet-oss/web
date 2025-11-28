// Two-Factor Authentication service using TOTP
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

const APP_NAME = 'Alpha Source';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export async function generateQRCodeDataUrl(email: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(email, APP_NAME, secret);
  return await QRCode.toDataURL(otpauth);
}

export async function setupTwoFactor(email: string): Promise<TwoFactorSetup> {
  const secret = generateTwoFactorSecret();
  const qrCodeUrl = await generateQRCodeDataUrl(email, secret);
  const backupCodes = generateBackupCodes();
  
  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export function verifyBackupCode(storedCodes: string, inputCode: string): { valid: boolean; remainingCodes: string } {
  const codes = storedCodes.split(',').filter(c => c.trim());
  const normalizedInput = inputCode.toUpperCase().replace(/\s/g, '');
  
  const index = codes.findIndex(c => c.replace(/\s/g, '') === normalizedInput);
  
  if (index === -1) {
    return { valid: false, remainingCodes: storedCodes };
  }
  
  codes.splice(index, 1);
  return { valid: true, remainingCodes: codes.join(',') };
}

export function hashBackupCodes(codes: string[]): string {
  return codes.join(',');
}
