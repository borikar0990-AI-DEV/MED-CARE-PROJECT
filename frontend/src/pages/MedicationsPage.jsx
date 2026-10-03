import { ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ConfirmationModal, Modal } from "../components/common/Modals";
import { EmptyState, ErrorState, Skeleton } from "../components/common/Feedback";
import { MedicationCard } from "../components/medications/MedicationCard";
import { useToast } from "../context/UIContext";
import { extractErrorMessage } from "../services/api";
import { medicationService } from "../services/resourceServices";
import { FREQUENCIES, INSTRUCTIONS, MEDICATION_TYPES, labelFor } from "../utils/constants";
import { formatDate } from "../utils/dateUtils";

const PAGE_SIZE = 9;

function ViewMedicationModal({ medication, onClose }) {
  if (!medication) return null;
  const typeInfo = MEDICATION_TYPES.find((t) => t.value === medication.type);
  return (
    <Modal open={!!medication} onClose={onClose} title={medication.name} size="md">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-xs text-slate-400">Type</p><p className="font-medium text-slate-800 dark:text-slate-100">{typeInfo?.label}</p></div>
        <div><p className="text-xs text-slate-400">Dosage</p><p className="font-medium text-slate-800 dark:text-slate-100">{medication.dosage}</p></div>
        <div><p className="text-xs text-slate-400">Frequency</p><p className="font-medium text-slate-800 dark:text-slate-100">{labelFor(FREQUENCIES, medication.frequency)}</p></div>
        <div><p className="text-xs text-slate-400">Instructions</p><p className="font-medium text-slate-800 dark:text-slate-100">{labelFor(INSTRUCTIONS, medication.instructions)}</p></div>
        <div><p className="text-xs text-slate-400">Start Date</p><p className="font-medium text-slate-800 dark:text-slate-100">{formatDate(medication.start_date)}</p></div>
        <div><p className="text-xs text-slate-400">End Date</p><p className="font-medium text-slate-800 dark:text-slate-100">{medication.end_date ? formatDate(medication.end_date) : "Ongoing"}</p></div>
        {medication.quantity !== null && medication.quantity !== undefined && (
          <div><p className="text-xs text-slate-400">Quantity in stock</p><p className="font-medium text-slate-800 dark:text-slate-100">{medication.quantity}</p></div>
        )}
        <div><p className="text-xs text-slate-400">Status</p><p className="font-medium text-slate-800 dark:text-slate-100">{medication.is_active ? "Active" : "Paused"}</p></div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-slate-400">Reminder Times</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {medication.schedules.map((s) => (
            <span key={s.id} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {s.time.slice(0, 5)} {s.days_of_week !== "ALL" && `· ${s.days_of_week}`}
            </span>
          ))}
        </div>
      </div>

      {medication.notes && (
        <div className="mt-4">
          <p className="text-xs text-slate-400">Notes</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{medication.notes}</p>
        </div>
      )}
    </Modal>
  );
}

export default function MedicationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("created_at-desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, type, status, sort]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [sortBy, sortDir] = sort.split("-");
    try {
      const data = await medicationService.list({
        search: debouncedSearch || undefined,
        type: type || undefined,
        isActive: status === "" ? undefined : status === "active",
        sortBy,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load your medications."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, type, status, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTogglePause = async (med) => {
    try {
      const updated = med.is_active ? await medicationService.pause(med.id) : await medicationService.resume(med.id);
      setResult((prev) => ({ ...prev, items: prev.items.map((m) => (m.id === med.id ? updated : m)) }));
      showToast(updated.is_active ? `${med.name} resumed.` : `${med.name} paused.`, "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await medicationService.remove(deleting.id);
      showToast(`${deleting.name} deleted.`, "success");
      setDeleting(null);
      load();
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasActiveFilters = search || type || status;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Medications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{result ? `${result.total} medicine${result.total === 1 ? "" : "s"}` : "Manage your medicines"}</p>
        </div>
        <Link to="/app/medications/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600">
          <Plus size={16} /> Add Medication
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines by name…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-surface-dark dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 sm:w-auto ${
            showFilters ? "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-800" : "text-slate-600 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5"
          }`}
        >
          <SlidersHorizontal size={16} /> Filters {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />}
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 grid gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="">All types</option>
              {MEDICATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="">Active & Paused</option>
              <option value="active">Active only</option>
              <option value="inactive">Paused only</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Sort by</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="created_at-desc">Newest first</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="start_date-desc">Start date (latest)</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : error ? (
        <div className="mt-6"><ErrorState description={error} onRetry={load} /></div>
      ) : result.items.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5">
          <EmptyState
            icon="💊"
            title={hasActiveFilters ? "No medicines match your filters" : "No medicines yet"}
            description={hasActiveFilters ? "Try adjusting your search or filters." : "Add your first medicine to start tracking doses."}
            action={
              !hasActiveFilters && (
                <Link to="/app/medications/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">
                  <Plus size={15} /> Add Medication
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((med, i) => (
              <MedicationCard
                key={med.id}
                medication={med}
                index={i}
                onView={setViewing}
                onEdit={(m) => navigate(`/app/medications/${m.id}/edit`)}
                onDelete={setDeleting}
                onTogglePause={handleTogglePause}
              />
            ))}
          </div>

          {result.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/5">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {result.page} of {result.total_pages}</span>
              <button type="button" disabled={page >= result.total_pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/5">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      <ViewMedicationModal medication={viewing} onClose={() => setViewing(null)} />
      <ConfirmationModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete this medicine?"
        description={deleting ? `"${deleting.name}" and its entire history will be permanently removed. This can't be undone.` : ""}
        confirmLabel="Delete"
      />
    </div>
  );
}
