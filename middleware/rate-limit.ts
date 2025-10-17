import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs: _windowMs,
    max: _max,
    message: _message = 'Too many requests',
  } = options;

  return (_req: NextRequest) => {
    // Simple rate limiting implementation
    // In production, use Redis or similar for distributed rate limiting
    return NextResponse.next();
  };
};

export const rateLimitHelpers = {
  createRateLimiter: rateLimit,
  defaultOptions: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
};
