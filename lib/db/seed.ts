import { db } from "./index";
import { platformSettings } from "./schema";
import { WHOLESALE_PRICING } from "./schema";

const defaults = [
  {
    key: "shipping_rate",
    value: "15.00",
    description: "Flat shipping rate per order in USD",
  },
  {
    key: "new_customer_minimum",
    value: "150.00",
    description: "Minimum order amount for first-time customers in USD",
  },
  {
    key: "returning_customer_minimum",
    value: "100.00",
    description: "Minimum order amount for returning customers in USD",
  },
  {
    key: "max_featured_products",
    value: "12",
    description: "Maximum number of featured products on homepage",
  },
  {
    key: "at_risk_threshold_days",
    value: "90",
    description: "Days since last order before customer is flagged as at-risk",
  },
  {
    key: "reorder_email_delay_days",
    value: "35",
    description:
      "Days after last order to send reorder window reminder email",
  },
  {
    key: "net30_eligibility_threshold",
    value: "3",
    description:
      "Number of completed orders required for Net 30 payment eligibility",
  },
  {
    key: "admin_notification_email",
    value: "",
    description: "Email address for admin notifications (new orders, alerts)",
  },
];

async function seed() {
  console.log("Seeding platform settings...");

  for (const setting of defaults) {
    await db
      .insert(platformSettings)
      .values(setting)
      .onConflictDoNothing({ target: platformSettings.key });
  }

  console.log(`Seeded ${defaults.length} platform settings.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
