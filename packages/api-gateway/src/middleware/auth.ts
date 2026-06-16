import jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

export function createAuthContext(req: Request): AuthContext {
  const token = extractTokenFromRequest(req);
  
  if (!token) {
    return {
      user: null,
      isAuthenticated: false,
    };
  }

  const user = verifyToken(token);
  
  return {
    user,
    isAuthenticated: user !== null,
  };
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: '24h',
  });
}

// Mock login function for demo purposes
// In production, this would validate against a user database
export function mockLogin(email: string, password: string): AuthUser | null {
  // Demo credentials
  const demoUsers: Record<string, { password: string; user: AuthUser }> = {
    'admin@example.com': {
      password: 'admin123',
      user: {
        userId: 'user_admin',
        email: 'admin@example.com',
        role: 'MANAGER',
      },
    },
    'agent@example.com': {
      password: 'agent123',
      user: {
        userId: 'user_agent',
        email: 'agent@example.com',
        role: 'AGENT',
      },
    },
  };

  const userRecord = demoUsers[email];
  if (userRecord && userRecord.password === password) {
    return userRecord.user;
  }

  return null;
}

// Made with Bob
