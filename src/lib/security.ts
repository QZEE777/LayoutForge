import { NextRequest, NextResponse } from 'next/server';
import { hashApiKey } from '@/lib/encryption';

export async function validateApiKey(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const apiKey = authHeader.substring(7);
  return hashApiKey(apiKey);
}

export function createErrorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message, timestamp: new Date().toISOString() },
    { status }
  );
}

export function validateInputs(data: Record<string, unknown>, schema: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(schema)) {
    if (data[key] === undefined && value === 'required') {
      return false;
    }
  }
  return true;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '').substring(0, 1000);
}

export function setSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  return response;
}

export async function logAuditEvent(
  userId: string | null,
  action: string,
  resource: string,
  request: NextRequest,
  status: string = 'success'
) {
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  console.log({ userId, action, resource, ipAddress, userAgent, status, timestamp: new Date().toISOString() });
}
