
// src/lib/authUtils.ts
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: 'Admin' | 'User';
  name: string;
  iat: number;
  exp: number;
}

export async function verifyAuth(req: NextRequest, requiredRole?: 'Admin' | 'User'): Promise<{ user?: DecodedToken; error?: string; status?: number }> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // Bearer Token

  if (!token) {
    return { error: 'Authorization token not provided.', status: 401 };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined');
    return { error: 'Internal server configuration error.', status: 500 };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    if (requiredRole && decoded.role !== requiredRole) {
      return { error: 'Forbidden: Insufficient permissions.', status: 403 };
    }
    return { user: decoded };
  } catch (error) {
    console.error('JWT verification error:', error);
    if (error instanceof jwt.TokenExpiredError) {
        return { error: 'Token expired.', status: 401 };
    }
    if (error instanceof jwt.JsonWebTokenError) {
        return { error: 'Invalid token.', status: 401 };
    }
    return { error: 'Unauthorized.', status: 401 };
  }
}
