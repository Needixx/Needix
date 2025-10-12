// components/settings/AccountSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react";

type ToastFn = (message: string, variant?: "success" | "error" | "info") => void;

// NOTE: We keep the prop for backward-compat, but we prefer session data.
// If you can, stop passing this prop entirely and rely on useSession().
interface AccountSettingsProps {
  user?: User;
}

export default function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const toast: ToastFn = useToast();

  // Prefer session.user over prop; fall back to prop only while session is loading
  const effectiveEmail = session?.user?.email ?? user?.email ?? "";
  const effectiveName = session?.user?.name ?? user?.name ?? "";

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Name editing state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(effectiveName);

  // Keep input synced if session name changes elsewhere
  useEffect(() => {
    setNewName(effectiveName);
  }, [effectiveName]);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Reset email form
  const [resetEmail, setResetEmail] = useState(effectiveEmail);
  useEffect(() => {
    setResetEmail(effectiveEmail);
  }, [effectiveEmail]);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
      toast("Signed out successfully", "success");
    } catch (error) {
      console.error("Sign out error:", error);
      toast("Failed to sign out", "error");
    } finally {
      setIsLoading(false);
      setShowSignOutModal(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    toast("Account deletion request submitted", "info");
  };

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast("Name cannot be empty", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        toast(data?.error || "Failed to update name", "error");
        return;
      }

      // 1) Update the NextAuth session in-memory so every client that reads session sees the new name
      await update({ name: trimmed });

      // 2) Close edit UI & notify
      setEditingName(false);
      toast("Name updated successfully", "success");

      // 3) Refresh route so server components (that call auth()) pick up the new session token
      router.refresh();
    } catch (error) {
      console.error("Update name error:", error);
      toast("Failed to update name", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast("Please fill in all password fields", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      toast("Password must be at least 6 characters long", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        toast("Password changed successfully", "success");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast(data?.error || "Failed to change password", "error");
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast("Failed to change password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast("Please enter your email", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();

      if (response.ok) {
        setEmailSentSuccess(true);
        toast("Reset link sent to your email", "success");
      } else {
        toast(data?.error || "Failed to send reset email", "error");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast("Failed to send reset email", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setEmailSentSuccess(false);
    setResetEmail(effectiveEmail);
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">👤 Account Settings</h2>
        <p className="text-white/60">Manage your account information and preferences</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📝 Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-white">
              {effectiveEmail || "—"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple/50"
                  placeholder="Enter your name"
                />
                <Button onClick={handleSaveName} disabled={isLoading} size="sm">
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => {
                    setEditingName(false);
                    setNewName(effectiveName);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white">{effectiveName || "Not set"}</span>
                <Button onClick={() => setEditingName(true)} variant="secondary" size="sm">
                  Edit
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm text-white/50 mt-4">
            Your name will be displayed throughout the app for a more personalized experience.
          </p>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⚙️ Account Actions</h3>
        <div className="space-y-4">
          {/* Change Password */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Change Password</div>
              <div className="text-sm text-white/60">Update your account password</div>
            </div>
            <Button onClick={() => setShowPasswordModal(true)} variant="secondary" size="sm">
              Change Password
            </Button>
          </div>

          {/* Sign Out */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Sign Out</div>
              <div className="text-sm text-white/60">Sign out from your account</div>
            </div>
            <Button onClick={() => setShowSignOutModal(true)} variant="secondary" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/30 p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-4">⚠️ Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-white">Delete Account</div>
            <div className="text-sm text-white/60">Permanently delete your account and all data</div>
          </div>
          <Button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
            size="sm"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Modals (unchanged below, trimmed for brevity) */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">🔒 Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={"password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full p-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple/50"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => {}}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <Eye className="w-5 h-5 opacity-0 pointer-events-none" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={"password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple/50"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => {}}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <Eye className="w-5 h-5 opacity-0 pointer-events-none" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={"password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple/50"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => {}}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <Eye className="w-5 h-5 opacity-0 pointer-events-none" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPasswordModal(false);
                setShowForgotPasswordModal(true);
              }}
              className="text-sm text-cyan-400 hover:text-cyan-300 mt-3"
            >
              Forgot your password?
            </button>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleChangePassword} disabled={isLoading} className="flex-1 bg-gradient-to-r from-purple to-cyan">
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                variant="secondary"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
            {!emailSentSuccess ? (
              <>
                <h3 className="text-xl font-bold text-white mb-4">🔑 Forgot Password</h3>
                <p className="text-white/70 mb-4 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple/50"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button onClick={handleForgotPassword} disabled={isLoading} className="flex-1 bg-gradient-to-r from-purple to-cyan">
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button onClick={closeForgotPasswordModal} variant="secondary" disabled={isLoading}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
                  <p className="text-white/70 mb-4 text-sm">We've sent a password reset link to:</p>
                  <div className="flex items-center gap-2 mb-6 p-3 bg-white/5 border border-white/10 rounded-lg">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span className="text-white font-medium">{resetEmail}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-6">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                  <p className="text-white/50 text-xs mb-4">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setEmailSentSuccess(false);
                      void handleForgotPassword();
                    }}
                    variant="secondary"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Resend Email
                  </Button>
                  <Button onClick={closeForgotPasswordModal} className="flex-1 bg-gradient-to-r from-purple to-cyan">
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSignOutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Sign Out</h3>
            <p className="text-white/70 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <Button onClick={handleSignOut} disabled={isLoading} className="flex-1 bg-gradient-to-r from-purple to-cyan">
                {isLoading ? "Signing out..." : "Yes, Sign Out"}
              </Button>
              <Button onClick={() => setShowSignOutModal(false)} variant="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Delete Account</h3>
            <p className="text-white/70 mb-4">
              This action cannot be undone. All your data including subscriptions, orders, and expenses will be permanently deleted.
            </p>
            <p className="text-white/70 mb-6 font-medium">
              Are you absolutely sure you want to delete your account?
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDeleteAccount} className="flex-1 bg-red-500 hover:bg-red-600">
                Yes, Delete My Account
              </Button>
              <Button onClick={() => setShowDeleteModal(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
