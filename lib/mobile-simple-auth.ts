// lib/mobile-simple-auth.ts
import { Preferences } from '@capacitor/preferences';
import bcrypt from 'bcryptjs';

interface StoredUser {
  email: string;
  password: string; // hashed
  name: string;
  createdAt: string;
}

interface MobileSession {
  email: string;
  name: string;
  loggedInAt: string;
}

const USERS_KEY = 'needix_mobile_users';
const SESSION_KEY = 'needix_mobile_session';

export class MobileAuth {
  // Create account
  static async signup(email: string, password: string, name: string = 'User'): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing users
      const { value } = await Preferences.get({ key: USERS_KEY });
      const users: StoredUser[] = value ? JSON.parse(value) : [];

      // Check if user already exists
      if (users.find(u => u.email === email)) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Add new user
      const newUser: StoredUser = {
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      await Preferences.set({ key: USERS_KEY, value: JSON.stringify(users) });

      // Auto-login
      await this.createSession(email, name);

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  // Sign in
  static async signin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing users
      const { value } = await Preferences.get({ key: USERS_KEY });
      const users: StoredUser[] = value ? JSON.parse(value) : [];

      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return { success: false, error: 'No account found with this email' };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { success: false, error: 'Invalid password' };
      }

      // Create session
      await this.createSession(email, user.name);

      return { success: true };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: 'Failed to sign in' };
    }
  }

  // Create session
  private static async createSession(email: string, name: string): Promise<void> {
    const session: MobileSession = {
      email,
      name,
      loggedInAt: new Date().toISOString(),
    };
    await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(session) });
  }

  // Get current session
  static async getSession(): Promise<MobileSession | null> {
    try {
      const { value } = await Preferences.get({ key: SESSION_KEY });
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  // Sign out
  static async signout(): Promise<void> {
    await Preferences.remove({ key: SESSION_KEY });
  }

  // Check if logged in
  static async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }
}