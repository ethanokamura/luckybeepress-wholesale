"use client";

import { useState } from "react";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SidebarLayout } from "@/components/shared/SidebarLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { ContactMessage, ContactType } from "@/types";
import Image from "next/image";

const contactTypes: { value: ContactType; label: string }[] = [
  { value: "general", label: "General Inquiry" },
  { value: "product_question", label: "Product Question" },
  { value: "order_issue", label: "Order Issue" },
  { value: "return_request", label: "Return Request" },
  { value: "other", label: "Other" },
];

export default function ContactPage() {
  const { firebaseUser, userData } = useAuth();
  const [formData, setFormData] = useState({
    name: userData?.displayName || "",
    email: firebaseUser?.email || "",
    phone: userData?.phone || "",
    type: "general" as ContactType,
    subject: "",
    message: "",
    orderNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const messageId = `contact-${Date.now()}`;
      const contactData: Omit<ContactMessage, "id"> = {
        userId: firebaseUser?.uid || null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        type: formData.type,
        subject: formData.subject,
        message: formData.message,
        orderId: null,
        orderNumber: formData.orderNumber || null,
        status: "new",
        priority: "medium",
        assignedTo: null,
        response: null,
        respondedAt: null,
        respondedBy: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, "contacts", messageId), contactData);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("There was an error sending your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SidebarLayout>
        <div className="max-w-2xl mx-auto py-8 sm:py-16 text-center">
          <span className="text-5xl sm:text-6xl mb-6 block">✓</span>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Message Sent!</h1>
          <p className="text-muted-foreground mb-8 px-4">
            Thank you for contacting us. We&apos;ll get back to you as soon as
            possible, typically within 1-2 business days.
          </p>
          <Button onClick={() => setSubmitted(false)}>
            Send Another Message
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Have a question? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Contact Info */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="bg-card border rounded-lg p-4 sm:p-6">
              <h3 className="font-bold mb-2">Lucky Bee Press</h3>
              <p className="text-sm text-muted-foreground">
                Artisan letterpress greeting cards since 2008.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-4 sm:p-6">
              <h3 className="font-bold mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond within 1-2 business days.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4 sm:p-6">
              <h3 className="font-bold mb-2">Wholesale Inquiries</h3>
              <p className="text-sm text-muted-foreground">
                Interested in carrying Lucky Bee Press products?{" "}
                <a href="/signup" className="text-primary hover:underline">
                  Apply for wholesale access
                </a>
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <form
              onSubmit={handleSubmit}
              className="bg-card border rounded-lg p-4 sm:p-6 space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Inquiry Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  >
                    {contactTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(formData.type === "order_issue" ||
                formData.type === "return_request") && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Order Number
                  </label>
                  <input
                    type="text"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleChange}
                    placeholder="ORD-2024-XXXXXX"
                    className="w-full px-3 sm:px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-3 sm:px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm sm:text-base"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
