import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function seedAdmin() {
  if (!ADMIN_EMAIL) {
    console.error("ADMIN_EMAIL environment variable is required");
    process.exit(1);
  }

  const result = await db
    .update(users)
    .set({ isAdmin: true })
    .where(eq(users.email, ADMIN_EMAIL))
    .returning({ id: users.id, email: users.email });

  if (result.length === 0) {
    console.error(`No user found with email: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  console.log(`Set isAdmin=true for ${result[0].email} (${result[0].id})`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed admin failed:", err);
    process.exit(1);
  });
