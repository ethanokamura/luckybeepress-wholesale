import Link from "next/link";
import { getPendingApplications } from "@/lib/admin/queries";

export default async function ApplicationsPage() {
  const applications = await getPendingApplications();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Application Queue</h1>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">
            No pending applications at this time.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">
                  Business Name
                </th>
                <th className="text-left px-4 py-3 font-medium">Owner</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">
                  Business Type
                </th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {app.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{app.ownerName}</td>
                  <td className="px-4 py-3">{app.email}</td>
                  <td className="px-4 py-3 capitalize">{app.businessType}</td>
                  <td className="px-4 py-3">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
