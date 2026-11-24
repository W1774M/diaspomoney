import crypto from 'crypto';

const SECRET = 'feedback-test-secret';

export function feedbackToken(bookingId: string, ageMs = 0): string {
  const timestamp = Date.now() - ageMs;
  const hash = crypto.createHmac('sha256', SECRET).update(`${bookingId}-${timestamp}`).digest('hex');
  return Buffer.from(`${bookingId}:${timestamp}:${hash}`).toString('base64url');
}

export function useFeedbackSecret() {
  process.env['FEEDBACK_SECRET'] = SECRET;
}
