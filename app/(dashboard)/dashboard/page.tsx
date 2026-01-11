"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

// Customer dashboard redirects to appropriate page based on status
export default function DashboardPage() {
  const { firebaseUser, isApproved, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.push("/login");
    } else if (isApproved) {
      router.push("/products");
    } else {
      router.push("/account");
    }
  }, [firebaseUser, isApproved, loading, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Image
        src="/logo.svg"
        alt="Lucky Bee Press"
        width={64}
        height={64}
        className="animate-bounce"
      />
    </div>
  );
}
