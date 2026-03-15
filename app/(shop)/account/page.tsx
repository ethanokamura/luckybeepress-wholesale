import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { User, MapPin } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { AddressManager } from "./address-manager";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1>Account Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile and shipping addresses
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs tracking-wide uppercase text-muted-foreground">
          <User className="size-3.5" />
          <span>Profile</span>
        </div>
        <ProfileForm
          defaultValues={{
            ownerName: user.ownerName ?? "",
            businessName: user.businessName ?? "",
            email: user.email,
            phone: user.phone ?? "",
          }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs tracking-wide uppercase text-muted-foreground">
          <MapPin className="size-3.5" />
          <span>Shipping Addresses</span>
        </div>
        <AddressManager addresses={userAddresses} />
      </section>
    </div>
  );
}
