/**
 * Seed test accounts into the test database.
 *
 * Run: bun e2e/seed-test-accounts.ts
 *
 * Reads credentials from .env.test.local and creates:
 * 1. Basic approved customer (with shipping address)
 * 2. Net 30 approved customer (with shipping address)
 * 3. Pending (non-approved) customer
 * 4. Admin account (with shipping address)
 *
 * Safe to re-run — skips accounts that already exist.
 */

import dotenv from "dotenv";
import { resolve } from "path";

// Load .env.test.local first for test DATABASE_URL and credentials,
// then .env.local as fallback for any missing vars
dotenv.config({ path: resolve(import.meta.dir, "../.env.test.local") });
dotenv.config({ path: resolve(import.meta.dir, "../.env.local") });

// Use TEST_DATABASE_URL if available, otherwise fall back to DATABASE_URL
const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) throw new Error("No DATABASE_URL or TEST_DATABASE_URL found");
// Override so drizzle/neon uses the right DB
process.env.DATABASE_URL = dbUrl;

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, addresses } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface TestAccount {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  phone: string;
  businessType: string;
  status: "pending" | "active" | "rejected" | "suspended";
  isAdmin: boolean;
  isNet30Eligible: boolean;
  addAddress: boolean;
}

const accounts: TestAccount[] = [
  {
    email: process.env.E2E_CUSTOMER_EMAIL!,
    password: process.env.E2E_CUSTOMER_PASSWORD!,
    ownerName: "Test Customer",
    businessName: "Test Boutique",
    phone: "555-0101",
    businessType: "boutique",
    status: "active",
    isAdmin: false,
    isNet30Eligible: false,
    addAddress: true,
  },
  {
    email: process.env.E2E_NET30_CUSTOMER_EMAIL!,
    password: process.env.E2E_NET30_CUSTOMER_PASSWORD!,
    ownerName: "Net30 Customer",
    businessName: "Net30 Gift Shop",
    phone: "555-0102",
    businessType: "boutique",
    status: "active",
    isAdmin: false,
    isNet30Eligible: true,
    addAddress: true,
  },
  {
    email: process.env.E2E_PENDING_CUSTOMER_EMAIL!,
    password: process.env.E2E_PENDING_CUSTOMER_PASSWORD!,
    ownerName: "Pending Customer",
    businessName: "Pending Store",
    phone: "555-0103",
    businessType: "online_retailer",
    status: "pending",
    isAdmin: false,
    isNet30Eligible: false,
    addAddress: false,
  },
  {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    ownerName: "Test Admin",
    businessName: "Lucky Bee Press",
    phone: "555-0100",
    businessType: "other",
    status: "active",
    isAdmin: true,
    isNet30Eligible: false,
    addAddress: true,
  },
];

async function seed() {
  for (const acct of accounts) {
    if (!acct.email || !acct.password) {
      console.log(`⏭  Skipping — missing env var for ${acct.ownerName}`);
      continue;
    }

    // Check if account already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, acct.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`✓  ${acct.email} already exists (${acct.status})`);

      // Update status/flags in case they changed
      await db
        .update(users)
        .set({
          status: acct.status,
          isAdmin: acct.isAdmin,
          isNet30Eligible: acct.isNet30Eligible,
          passwordHash: await bcrypt.hash(acct.password, 10),
        })
        .where(eq(users.id, existing[0].id));

      console.log(`   ↳ Updated flags: status=${acct.status}, admin=${acct.isAdmin}, net30=${acct.isNet30Eligible}`);

      // Ensure address exists for accounts that need one
      if (acct.addAddress) {
        const existingAddr = await db
          .select({ id: addresses.id })
          .from(addresses)
          .where(eq(addresses.userId, existing[0].id))
          .limit(1);

        if (existingAddr.length === 0) {
          await db.insert(addresses).values({
            userId: existing[0].id,
            recipientName: acct.ownerName,
            street1: "123 Test Street",
            city: "Santa Cruz",
            state: "CA",
            zip: "95060",
            isDefault: true,
          });
          console.log(`   ↳ Added shipping address`);
        }
      }

      continue;
    }

    // Create account
    const passwordHash = await bcrypt.hash(acct.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        email: acct.email,
        passwordHash,
        ownerName: acct.ownerName,
        businessName: acct.businessName,
        phone: acct.phone,
        businessType: acct.businessType,
        status: acct.status,
        isAdmin: acct.isAdmin,
        isNet30Eligible: acct.isNet30Eligible,
        approvedAt: acct.status === "active" ? new Date() : null,
      })
      .returning({ id: users.id });

    console.log(`✚  Created ${acct.email} (${acct.status}, admin=${acct.isAdmin}, net30=${acct.isNet30Eligible})`);

    // Add shipping address
    if (acct.addAddress) {
      await db.insert(addresses).values({
        userId: newUser.id,
        recipientName: acct.ownerName,
        street1: "123 Test Street",
        city: "Santa Cruz",
        state: "CA",
        zip: "95060",
        isDefault: true,
      });
      console.log(`   ↳ Added shipping address`);
    }
  }

  console.log("\n✅ Test accounts ready.");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
