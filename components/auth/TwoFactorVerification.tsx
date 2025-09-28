// components/auth/TwoFactorVerification.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface TwoFactorVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onResendCode: () => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function TwoFactorVerification({
  email,
  onVerify,
  onResendCode,
  onCancel,
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const toast = useToast();

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-focus first input
  useEffect(() => {
    const firstInput = inputRefs.current[0];
    if (firstInput) {
      firstInput.focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (value && !/^\d$/.test(value)) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      void handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((pastedText) => {
        const digits = pastedText.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          const newCode = digits.split('');
          setCode(newCode);
          void handleVerify(digits);
        }
      }).catch(() => {
        // Ignore clipboard errors
      });
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setIsLoading(true);
    try {
      const result = await onVerify(verificationCode);
      if (!result.success) {
        toast(result.error || "Invalid verification code", "error");
        setCode(['', '', '', '', '', '']);
        const firstInput = inputRefs.current[0];
        if (firstInput) {
          firstInput.focus();
        }
      }
    } catch (error) {
      toast("Verification failed. Please try again.", "error");
      setCode(['', '', '', '', '', '']);
      const firstInput = inputRefs.current[0];
      if (firstInput) {
        firstInput.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await onResendCode();
      if (result.success) {
        toast("New verification code sent!", "success");
        setTimeLeft(600);
        setCanResend(false);
        setCode(['', '', '', '', '', '']);
        const firstInput = inputRefs.current[0];
        if (firstInput) {
          firstInput.focus();
        }
      } else {
        toast(result.error || "Failed to resend code", "error");
      }
    } catch (error) {
      toast("Failed to resend code. Please try again.", "error");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple to-cyan rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verify Your Account</h1>
            <p className="text-white/60 text-sm">
              We've sent a 6-digit verification code to<br />
              <span className="font-medium text-white">{maskedEmail}</span>
            </p>
          </div>

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex gap-3 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    if (el) {
                      inputRefs.current[index] = el;
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition-colors"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {timeLeft > 0 ? (
              <p className="text-sm text-white/60">
                Code expires in <span className="font-medium text-white">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-400">Code has expired</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => void handleVerify(code.join(''))}
              disabled={isLoading || code.some(digit => digit === '') || timeLeft <= 0}
              className="w-full bg-gradient-to-r from-purple to-cyan"
              size="lg"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={() => void handleResend()}
                disabled={isResending || !canResend}
                variant="secondary"
                className="flex-1"
                size="sm"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
              
              <Button
                onClick={onCancel}
                variant="secondary"
                className="flex-1"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-white/60 text-center">
              💡 <strong>Tip:</strong> You can paste the 6-digit code directly into the first field
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}