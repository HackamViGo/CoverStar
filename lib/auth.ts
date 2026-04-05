import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const BCRYPT_ROUNDS = 12;
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface User {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
}

/**
 * Ensures the data directory and users file exist.
 */
function ensureDataFile() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(USERS_FILE)) {
    writeFileSync(USERS_FILE, JSON.stringify([]), 'utf-8');
  }
}

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

  ensureDataFile();
  try {
    const users: User[] = JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ?? null;
  } catch (error) {
    console.error('Error reading users file:', error);
    return null;
  }
}

/**
 * Register a new user.
 */
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  ensureDataFile();
  const hashedPassword = await hashPassword(password);
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    hashedPassword,
  };

  const users: User[] = JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
  users.push(user);
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  
  return user;
}
