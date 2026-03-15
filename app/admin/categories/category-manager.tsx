"use client";

import { useState, useTransition } from "react";
import {
  createCategory,
  renameCategory,
  reorderCategories,
  deleteCategory,
  reassignProducts,
  toggleBoxSetSupport,
} from "@/lib/admin/actions";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  supportsBoxSet: boolean;
  sortOrder: number;
  productCount: number;
};

export function CategoryManager({
  categories: initialCategories,
}: {
  categories: CategoryItem[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [newSupportsBoxSet, setNewSupportsBoxSet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createCategory(newName.trim(), newSupportsBoxSet);
      if (result.success) {
        setNewName("");
        setNewSupportsBoxSet(false);
        showMessage("success", "Category created.");
      } else {
        showMessage("error", result.error ?? "Failed to create category.");
      }
    });
  };

  const handleRename = (id: string) => {
    if (!editingName.trim()) return;
    startTransition(async () => {
      const result = await renameCategory(id, editingName.trim());
      if (result.success) {
        setEditingId(null);
        setEditingName("");
        showMessage("success", "Category renamed.");
      } else {
        showMessage("error", result.error ?? "Failed to rename category.");
      }
    });
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === categories.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newOrder = [...categories];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setCategories(newOrder);

    const orderedIds = newOrder.map((c, i) => ({ id: c.id, sortOrder: i }));
    startTransition(async () => {
      const result = await reorderCategories(orderedIds);
      if (!result.success) {
        showMessage("error", result.error ?? "Failed to reorder.");
        setCategories(initialCategories);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      if (deleteTarget.productCount > 0 && reassignTo) {
        const reassignResult = await reassignProducts(
          deleteTarget.id,
          reassignTo,
        );
        if (!reassignResult.success) {
          showMessage(
            "error",
            reassignResult.error ?? "Failed to reassign products.",
          );
          return;
        }
      }

      const result = await deleteCategory(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
        setReassignTo("");
        showMessage("success", "Category deleted.");
      } else {
        showMessage("error", result.error ?? "Failed to delete category.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Create New */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <input
            type="checkbox"
            checked={newSupportsBoxSet}
            onChange={(e) => setNewSupportsBoxSet(e.target.checked)}
            className="rounded"
          />
          Box sets
        </label>
        <button
          onClick={handleCreate}
          disabled={isPending || !newName.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Add Category"}
        </button>
      </div>

      {/* Category List */}
      <div className="rounded-md border divide-y">
        {categories.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No categories yet.
          </div>
        ) : (
          categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(cat.id, "up")}
                  disabled={isPending || idx === 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMove(cat.id, "down")}
                  disabled={isPending || idx === categories.length - 1}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              {/* Name / Inline Edit */}
              <div className="flex-1">
                {editingId === cat.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 rounded-md border px-2 py-1 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRename(cat.id);
                        }
                        if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleRename(cat.id)}
                      disabled={isPending}
                      className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-md border px-2 py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({cat.productCount} products)
                    </span>
                    {cat.supportsBoxSet && (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">
                        Box Sets
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {editingId !== cat.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        const result = await toggleBoxSetSupport(cat.id);
                        if (result.success) {
                          showMessage(
                            "success",
                            `Box set support ${cat.supportsBoxSet ? "disabled" : "enabled"}.`,
                          );
                        } else {
                          showMessage("error", result.error ?? "Failed.");
                        }
                      });
                    }}
                    disabled={isPending}
                    className="text-xs text-amber-700 hover:underline"
                  >
                    {cat.supportsBoxSet ? "Disable" : "Enable"} Box Sets
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditingName(cat.name);
                    }}
                    className="text-xs text-primary-text hover:underline"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget(cat);
                      setReassignTo("");
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm font-medium text-red-800">
            Delete &ldquo;{deleteTarget.name}&rdquo;?
          </p>
          {deleteTarget.productCount > 0 && (
            <div>
              <p className="text-sm text-red-700 mb-2">
                This category has {deleteTarget.productCount} product(s).
                Reassign them to:
              </p>
              <select
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select category...</option>
                {categories
                  .filter((c) => c.id !== deleteTarget.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={
                isPending ||
                (deleteTarget.productCount > 0 && !reassignTo)
              }
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Confirm Delete"}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-md border px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
