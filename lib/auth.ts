import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export interface User {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
}

// In-memory demo store — in production replace with a real DB
const DEMO_USERS: User[] = [];

/**
 * Hash a password with bcrypt (12 rounds minimum).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare plaintext password with bcrypt hash.
 * Returns false (never throws) on malformed hash.
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    return false;
  }
}

/**
 * Retrieve a user by email address.
 * Returns null for empty, invalid-format, or non-existent emails.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!email || !email.includes('@') || email.length < 3) {
    return null;
  }

  const user = DEMO_USERS.find((u) => u.email === email);
  return user ?? null;
}

/**
 * Register a new demo user (utility for seeding / integration tests).
 */
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const hashedPassword = await hashPassword(password);
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    hashedPassword,
  };
  DEMO_USERS.push(user);
  return user;
}
