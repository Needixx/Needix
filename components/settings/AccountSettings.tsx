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
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [isSavingName, setIsSavingName] = useState(false);
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

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast("Name cannot be empty", "error");
      return;
    }

    setIsSavingName(true);
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast("Name updated successfully! Refreshing...", "success");
        setIsEditingName(false);
        
        // Force a hard refresh to get new session data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast(data.error || "Failed to update name", "error");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast("Failed to update name", "error");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user.name || "");
    setIsEditingName(false);
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
            <label className="block text-sm font-medium text-white/70 mb-2">Name</label>
            {isEditingName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter your name"
                  disabled={isSavingName}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    variant="primary"
                    size="sm"
                  >
                    {isSavingName ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={isSavingName}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white">{user.name || "Not set"}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
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

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div>
              <div className="font-medium text-red-400">Delete Account</div>
              <div className="text-sm text-white/60">Permanently delete your account and all data</div>
            </div>
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="secondary"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-3">Sign Out</h3>
            <p className="text-white/70 mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSignOutModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSignOut}
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-3">⚠️ Delete Account</h3>
            <p className="text-white/70 mb-6">
              This action cannot be undone. All your data will be permanently deleted.
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
                variant="primary"
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}