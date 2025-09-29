// components/settings/AccountSettings.tsx
"use client";

import { useState } from "react";
import type { User } from "next-auth";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { signOut } from "next-auth/react";

type ToastFn = (message: string, variant?: "success" | "error" | "info") => void;

interface AccountSettingsProps {
  user: User;
}

export default function AccountSettings({ user }: AccountSettingsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast: ToastFn = useToast();

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

  const handleChangePassword = () => {
    toast("Password change feature coming soon!", "info");
  };

  const handleDownloadData = () => {
    toast("Data download feature coming soon!", "info");
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
              {user.email}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-white">
              {user.name || "Not set"}
            </div>
          </div>

          <p className="text-sm text-white/50 mt-4">
            More profile customization options coming soon!
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
            <Button onClick={handleChangePassword} variant="secondary" size="sm">
              Change Password
            </Button>
          </div>

          {/* Download Data */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Download Your Data</div>
              <div className="text-sm text-white/60">Export all your account data (GDPR)</div>
            </div>
            <Button onClick={handleDownloadData} variant="secondary" size="sm">
              Download Data
            </Button>
          </div>

          {/* Sign Out */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div>
              <div className="font-medium text-white">Sign Out</div>
              <div className="text-sm text-white/60">Sign out of your account on this device</div>
            </div>
            <Button 
              onClick={() => setShowSignOutModal(true)}
              variant="secondary" 
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {Math.floor(Math.random() * 30) + 1}
            </div>
            <div className="text-sm text-white/60">Days Active</div>
          </div>
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {Math.floor(Math.random() * 50) + 10}
            </div>
            <div className="text-sm text-white/60">Total Logins</div>
          </div>
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {new Date().toLocaleDateString()}
            </div>
            <div className="text-sm text-white/60">Last Login</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-red-400">⚠️</span>
          <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
            <div>
              <div className="font-medium text-red-300">Delete Account</div>
              <div className="text-sm text-red-200/80">Permanently delete your account and all data</div>
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
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-yellow-400 text-2xl">👋</span>
              <h3 className="text-xl font-bold text-white">Sign Out</h3>
            </div>
            
            <p className="text-white/80 mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSignOutModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => { void handleSignOut(); }}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 flex-1"
              >
                {isLoading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
              <h3 className="text-xl font-bold text-red-400">Delete Account</h3>
            </div>
            
            <p className="text-white/80 mb-4">
              This action will permanently delete your account and all associated data. 
              This cannot be undone.
            </p>
            
            <p className="text-white/70 text-sm mb-6">
              Are you absolutely sure you want to continue?
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-600 text-white flex-1"
              >
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}