"use client";

import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireApproval?: boolean;
  requireAdmin?: boolean;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireApproval = false,
  requireAdmin = false,
}: AuthGuardProps) {
  const { firebaseUser, loading, isApproved, isAdmin, mounted } = useAuth();
  const router = useRouter();

  // Combined loading state to prevent hydration mismatch
  const isLoading = !mounted || loading;

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !firebaseUser) {
      router.push("/login");
      return;
    }

    if (requireApproval && !isApproved) {
      router.push("/account");
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push("/");
      return;
    }
  }, [
    firebaseUser,
    isLoading,
    isApproved,
    isAdmin,
    requireAuth,
    requireApproval,
    requireAdmin,
    router,
  ]);

  // Show loading state until mounted (prevents hydration mismatch)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={64}
            height={64}
            className="mx-auto mb-4 animate-bounce"
          />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !firebaseUser) {
    return null;
  }

  if (requireApproval && !isApproved) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
