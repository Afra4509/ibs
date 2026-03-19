import { SignJWT, jwtVerify } from 'jose';
import QRCode from 'qrcode';

const QR_SIGN_SECRET = process.env.QR_SIGN_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// =============================================
// TICKET CODE GENERATOR
// Format: IBS-XXXXXXXX (8 random alphanumeric)
// =============================================

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars (0,O,1,I)

export function generateTicketCode(): string {
  const chars: string[] = [];
  const array = new Uint8Array(8);

  // Use crypto.getRandomValues for secure randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Node.js fallback
    const nodeCrypto = require('crypto');
    const buf = nodeCrypto.randomBytes(8);
    buf.forEach((byte: number, i: number) => {
      array[i] = byte;
    });
  }

  array.forEach((byte) => {
    chars.push(ALPHABET[byte % ALPHABET.length]);
  });

  return `IBS-${chars.join('')}`;
}

// =============================================
// QR TOKEN (SIGNED JWT - HMAC-SHA256)
// =============================================

function getSecretKey() {
  return new TextEncoder().encode(QR_SIGN_SECRET);
}

/**
 * Create a signed JWT token for QR code
 * Includes ticket_code + expiry to prevent forgery
 */
export async function createQrToken(ticketCode: string, expiresAt?: Date): Promise<string> {
  const expiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
  
  const token = await new SignJWT({ 
    tc: ticketCode,  // tc = ticket_code (short to keep QR compact)
    type: 'ibs-ticket'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode a QR token
 * Returns ticket_code if valid, throws if invalid/expired
 */
export async function verifyQrToken(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    
    if (payload.type !== 'ibs-ticket' || typeof payload.tc !== 'string') {
      throw new Error('Invalid token type');
    }
    
    return payload.tc;
  } catch (err) {
    throw new Error('QR token invalid or expired');
  }
}

// =============================================
// QR CODE IMAGE GENERATOR
// =============================================

/**
 * Generate QR code as base64 data URL
 * Encodes a signed JWT token (not plain ticket_code)
 */
export async function generateQrDataUrl(ticketCode: string, expiresAt?: Date): Promise<string> {
  const token = await createQrToken(ticketCode, expiresAt);
  
  const dataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#0A1F44',
      light: '#FFFFFF',
    },
  });
  
  return dataUrl;
}

/**
 * Generate QR code as SVG string
 */
export async function generateQrSvg(ticketCode: string, expiresAt?: Date): Promise<string> {
  const token = await createQrToken(ticketCode, expiresAt);
  
  const svg = await QRCode.toString(token, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
  });
  
  return svg;
}

// =============================================
// EVENT DATE UTILITIES
// =============================================

export function getEventDate(): Date {
  const dateStr = process.env.NEXT_PUBLIC_EVENT_DATE || '2026-05-01';
  return new Date(dateStr + 'T00:00:00+07:00'); // WIB timezone
}

export function getTicketExpiry(): Date {
  const eventDate = getEventDate();
  const expiry = new Date(eventDate);
  expiry.setDate(expiry.getDate() + 1); // H+1
  expiry.setHours(23, 59, 59, 999); // End of day H+1
  return expiry;
}
