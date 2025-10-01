// components/SettingsClient.tsx
"use client";

import { type User } from "next-auth";
import SettingsLayout from "@/components/settings/SettingsLayout";

interface SettingsClientProps {
  user: User;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  return <SettingsLayout user={user} />;
}