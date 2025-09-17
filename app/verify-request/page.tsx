// app/verify-request/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function VerifyRequestPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm p-8">
          <div className="mb-6 text-6xl">📧</div>
          
          <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
          
          <p className="text-white/70 mb-6 leading-relaxed">
            We've sent you a magic link! Click the link in your email to sign in to your account.
          </p>
          
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
            <h3 className="font-medium mb-2">📍 What to do next:</h3>
            <ul className="text-sm text-white/60 space-y-1 text-left">
              <li>1. Check your email inbox</li>
              <li>2. Look for an email from Needix</li>
              <li>3. Click the "Sign in" link</li>
              <li>4. You'll be automatically signed in</li>
            </ul>
          </div>
          
          <div className="text-xs text-white/50 mb-6">
            <p>Didn't receive the email? Check your spam folder or try again.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link href="/signin">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Back to Sign In
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
        
        <p className="mt-6 text-xs text-white/40">
          Having trouble? Contact us at{" "}
          <a href="mailto:needix2025@gmail.com" className="text-purple-400 hover:text-purple-300">
            needix2025@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}