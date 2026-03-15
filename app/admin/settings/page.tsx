import Link from "next/link";
import { getPlatformSettings } from "@/lib/admin/queries";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getPlatformSettings();

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      <SettingsForm settings={settingsMap} />
    </div>
  );
}
