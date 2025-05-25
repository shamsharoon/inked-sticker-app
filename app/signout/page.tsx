"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut();
      router.push("/signin");
    };
    handleSignOut();
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-600 dark:text-slate-400">Signing out...</p>
    </div>
  );
}
