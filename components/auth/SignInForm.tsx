// components/auth/SignInForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export function SignInForm() {
  const router = useRouter();
  const isNative = Capacitor.isNativePlatform();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNativeLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/native-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const { token, user } = await response.json();

      // Store JWT token and user in Capacitor Preferences
      await Preferences.set({ key: 'authToken', value: token });
      await Preferences.set({ key: 'user', value: JSON.stringify(user) });

      console.log('✅ Native login successful, token stored');
      return { success: true };
    } catch (error) {
      console.error('❌ Native login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const handleWebLogin = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: 'Invalid email or password' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Web login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`🔐 Attempting ${isNative ? 'native' : 'web'} login for: ${email}`);
      
      // Use native auth for Capacitor, NextAuth for web
      const result = isNative 
        ? await handleNativeLogin(email, password)
        : await handleWebLogin(email, password);

      if (result.success) {
        console.log('✅ Login successful, redirecting to dashboard...');
        router.push('/dashboard');
        router.refresh(); // Force refresh to update auth state
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      {isNative && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
          Running in native mode (JWT authentication)
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign up
        </a>
      </div>
    </div>
  );
}