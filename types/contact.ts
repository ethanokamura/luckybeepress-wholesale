import { FirebaseDoc, CreateDoc, UpdateDoc } from "./base_types";
import { Timestamp } from "firebase/firestore";

export type ContactStatus = "new" | "in_progress" | "resolved" | "closed";
export type ContactPriority = "low" | "medium" | "high" | "urgent";
export type ContactType =
  | "general"
  | "order_issue"
  | "product_question"
  | "return_request"
  | "complaint"
  | "other";

export interface ContactMessage extends FirebaseDoc {
  // Sender info
  userId: string | null; // null if guest
  name: string;
  email: string;
  phone: string | null;

  // Message
  type: ContactType;
  subject: string;
  message: string;

  // Related order (if applicable)
  orderId: string | null;
  orderNumber: string | null;

  // Admin handling
  status: ContactStatus;
  priority: ContactPriority;
  assignedTo: string | null; // admin user ID

  // Response
  response: string | null;
  respondedAt: Timestamp | null;
  respondedBy: string | null;
}

export type CreateContactMessage = CreateDoc<ContactMessage>;
export type UpdateContactMessage = UpdateDoc<ContactMessage>;
