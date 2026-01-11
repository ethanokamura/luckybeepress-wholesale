"use client";

import { useState } from "react";
import { updateDoc, Timestamp } from "firebase/firestore";
import { docs } from "@/lib/firebase-helpers";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const { firebaseUser, userData, isApproved, refreshUserData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || "",
    phone: userData?.phone || "",
  });

  const handleSave = async () => {
    if (!firebaseUser) return;

    setSaving(true);
    try {
      await updateDoc(docs.user(firebaseUser.uid), {
        displayName: formData.displayName,
        phone: formData.phone || null,
        updatedAt: Timestamp.now(),
      });
      await refreshUserData();
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AuthGuard requireAuth>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Account Settings
        </h1>

        {/* Account Status */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Account Status</h2>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusColor(
                userData?.accountStatus || "pending"
              )}`}
            >
              {userData?.accountStatus || "pending"}
            </span>
            {userData?.role === "admin" && (
              <span className="px-3 py-1 rounded-full text-sm font-medium border bg-purple-100 text-purple-800 border-purple-200">
                Admin
              </span>
            )}
          </div>

          {!isApproved && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Pending Approval:</strong> Your account is currently
                pending approval. Once approved, you&apos;ll be able to browse
                products and place orders. We typically review accounts within
                1-2 business days.
              </p>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Profile Information</h2>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={firebaseUser?.email || ""}
                  disabled
                  className="w-full px-3 py-2 rounded-md border bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Display Name</p>
                <p className="font-medium">
                  {userData?.displayName || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{firebaseUser?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{userData?.phone || "Not set"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
