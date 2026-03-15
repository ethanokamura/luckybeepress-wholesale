"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/lib/admin/actions";

const FIELDS = [
  {
    key: "shipping_rate",
    label: "Shipping Rate (cents)",
    type: "number" as const,
    description: "Flat-rate shipping cost in cents",
  },
  {
    key: "new_customer_minimum",
    label: "New Customer Minimum (cents)",
    type: "number" as const,
    description: "Minimum order total for first-time customers",
  },
  {
    key: "returning_customer_minimum",
    label: "Returning Customer Minimum (cents)",
    type: "number" as const,
    description: "Minimum order total for returning customers",
  },
  {
    key: "featured_limit",
    label: "Featured Limit",
    type: "number" as const,
    description: "Maximum number of featured products",
  },
  {
    key: "at_risk_threshold_days",
    label: "At-Risk Threshold (days)",
    type: "number" as const,
    description: "Days since last order before a customer is considered at risk",
  },
  {
    key: "reorder_email_delay_days",
    label: "Reorder Email Delay (days)",
    type: "number" as const,
    description: "Days after delivery to send reorder reminder",
  },
  {
    key: "net30_threshold",
    label: "Net 30 Threshold (cents)",
    type: "number" as const,
    description: "Minimum lifetime spend to qualify for Net 30",
  },
  {
    key: "admin_notification_email",
    label: "Admin Notification Email",
    type: "email" as const,
    description: "Email address for admin notifications",
  },
];

export function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateSettings(values);
      if (result.success) {
        setMessage("Settings saved successfully.");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to save settings.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {message && (
        <div className="mb-6 rounded-md bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="block text-sm font-medium mb-1"
            >
              {field.label}
            </label>
            <input
              id={field.key}
              type={field.type}
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {field.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-foreground px-6 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
