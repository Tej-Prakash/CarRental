
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

export async function verifyAuth(req: NextRequest, requiredRole?: 'Admin' | 'User'): Promise<{ user?: DecodedToken; admin?: DecodedToken; error?: string; status?: number }> {
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

    // If admin role is required and it matches, populate both user and admin fields.
    // The API route specifically checks authResult.admin.userId.
    if (requiredRole === 'Admin' && decoded.role === 'Admin') {
      return { user: decoded, admin: decoded };
    }
    
    // For general user authentication or if requiredRole is 'User' and matches
    if ((requiredRole === 'User' && decoded.role === 'User') || !requiredRole) {
      return { user: decoded };
    }

    // This case should ideally not be reached if requiredRole logic is sound,
    // but acts as a fallback if roles mismatch in an unexpected way after initial checks.
    // For example, if requiredRole is 'Admin' but token role is 'User', it's already caught by the first `if`.
    // If requiredRole is 'User' but token role is 'Admin', it's also caught.
    // This covers if requiredRole is undefined and somehow the role isn't 'User' or 'Admin' (which DecodedToken type prevents).
    // Or if requiredRole is 'Admin' but the earlier check passed, but the user wasn't an admin (defensive).
    console.warn(`verifyAuth: Unhandled role scenario. Token role: ${decoded.role}, Required role: ${requiredRole}`);
    return { error: 'Role mismatch or unauthorized condition.', status: 403 };

  } catch (error: any) {
    console.error('JWT verification error:', error);
    if (error instanceof jwt.TokenExpiredError) {
        return { error: 'Token expired.', status: 401 };
    }
    if (error instanceof jwt.JsonWebTokenError) {
        return { error: 'Invalid token.', status: 401 };
    }
    return { error: 'Unauthorized due to token processing error.', status: 401 };
  }
}
