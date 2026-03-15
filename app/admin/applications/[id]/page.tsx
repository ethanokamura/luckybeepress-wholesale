import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplicationDetail } from "@/lib/admin/queries";
import { ApplicationActions } from "./application-actions";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplicationDetail(id);

  if (!application) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin" className="hover:underline">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/applications" className="hover:underline">
          Applications
        </Link>
        <span>/</span>
        <span className="text-foreground">{application.businessName}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{application.businessName}</h1>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            application.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : application.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {application.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Business Information */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Business Information</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Business Name</dt>
              <dd className="font-medium">{application.businessName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Owner Name</dt>
              <dd className="font-medium">{application.ownerName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{application.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{application.phone ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Business Type</dt>
              <dd className="font-medium capitalize">
                {application.businessType}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">EIN</dt>
              <dd className="font-medium">{application.ein ?? "N/A"}</dd>
            </div>
          </dl>
        </div>

        {/* Account Details */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Account Details</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tax Exempt</dt>
              <dd className="font-medium">
                {application.isTaxExempt ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Net 30 Eligible</dt>
              <dd className="font-medium">
                {application.isNet30Eligible ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Custom Discount</dt>
              <dd className="font-medium">
                {application.customDiscountPercent
                  ? `${application.customDiscountPercent}%`
                  : "None"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Applied</dt>
              <dd className="font-medium">
                {new Date(application.createdAt).toLocaleDateString()}
              </dd>
            </div>
            {application.approvedAt && (
              <div>
                <dt className="text-muted-foreground">Approved</dt>
                <dd className="font-medium">
                  {new Date(application.approvedAt).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Internal Notes</dt>
              <dd className="font-medium">
                {application.internalNotes ?? "None"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Resale Certificate */}
      {application.resaleCertificateUrl && (
        <div className="rounded-lg border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Resale Certificate</h2>
          <a
            href={application.resaleCertificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
          >
            View / Download Certificate
          </a>
        </div>
      )}

      {/* Actions */}
      {application.status === "pending" && (
        <ApplicationActions applicationId={application.id} />
      )}
    </div>
  );
}
