"use client";

import { useState } from "react";

type Category = { id: string; name: string };

export function LineSheetExport({ categories }: { categories: Category[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set("categoryId", categoryId);

      const response = await fetch(`/api/admin/line-sheet?${params}`);
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to generate line sheet");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `line-sheet${categoryId ? `-${categoryId}` : ""}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleExport}
        disabled={loading}
        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {loading ? "Generating..." : "Export Line Sheet"}
      </button>
    </div>
  );
}
