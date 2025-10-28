import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from './env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign a JWT token
 */
export function signToken(payload: JWTPayload, expiresIn = '15m'): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

/**
 * Sign a refresh token
 */
export function signRefreshToken(payload: JWTPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
}

/**
 * Set httpOnly cookies for tokens
 */
export function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Clear authentication cookies
 */
export function clearTokenCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

/**
 * Authentication middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7235#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Authentication required',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      type: 'https://tools.ietf.org/html/rfc7235#section-3.1',
      title: 'Unauthorized',
      status: 401,
      detail: 'Invalid or expired token',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7235#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Authentication required',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.3',
        title: 'Forbidden',
        status: 403,
        detail: 'Insufficient permissions',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    next();
  };
}