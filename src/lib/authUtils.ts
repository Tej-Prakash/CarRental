
// src/lib/authUtils.ts
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@/types';

interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  iat: number;
  exp: number;
}

interface AuthResult {
  user?: DecodedToken;   // Populated if token is valid
  admin?: DecodedToken;  // Populated if user.role is 'Admin'
  error?: string;
  status?: number;
}

export async function verifyAuth(req: NextRequest, allowedRoles?: UserRole[]): Promise<AuthResult> {
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

    // First, check if the user's role is among the allowed roles, if allowedRoles are specified
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(decoded.role)) {
        return { error: 'Forbidden: Insufficient permissions.', status: 403, user: decoded };
      }
    }
    
    // If role check passed (or no specific roles were required for this particular verification step)
    // Now, conditionally populate the 'admin' field if the user's role is indeed 'Admin'.
    const result: AuthResult = { user: decoded };
    if (decoded.role === 'Admin') {
      result.admin = decoded; // Specifically populate for 'Admin' role
    }
    return result;

  } catch (error: any) {
    console.error('JWT verification error:', error.name, error.message);
    if (error instanceof jwt.TokenExpiredError) {
        return { error: 'Token expired.', status: 401 };
    }
    if (error instanceof jwt.JsonWebTokenError) {
        return { error: 'Invalid token.', status: 401 };
    }
    return { error: 'Unauthorized due to token processing error.', status: 401 };
  }
}
