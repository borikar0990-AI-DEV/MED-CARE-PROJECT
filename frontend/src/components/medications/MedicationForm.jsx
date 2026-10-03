import { Info, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { aiService } from "../../services/resourceServices";
import { useToast } from "../../context/UIContext";
import { FREQUENCIES, INSTRUCTIONS, MEDICATION_TYPES } from "../../utils/constants";
import { isDateRangeValid, required } from "../../utils/validators";
import { LoadingSpinner } from "../common/Feedback";

const todayISO = () => new Date().toISOString().slice(0, 10);

function emptyForm() {
  return {
    name: "",
    type: "tablet",
    dosage: "",
    quantity: "",
    frequency: "once_daily",
    instructions: "after_food",
    notes: "",
    start_date: todayISO(),
    end_date: "",
    schedules: [{ time: "08:00", days_of_week: "ALL" }],
  };
}

export function medicationToFormValues(med) {
  if (!med) return emptyForm();
  return {
    name: med.name,
    type: med.type,
    dosage: med.dosage,
    quantity: med.quantity ?? "",
    frequency: med.frequency,
    instructions: med.instructions,
    notes: med.notes || "",
    start_date: med.start_date,
    end_date: med.end_date || "",
    schedules: med.schedules.length ? med.schedules.map((s) => ({ time: s.time.slice(0, 5), days_of_week: s.days_of_week })) : [{ time: "08:00", days_of_week: "ALL" }],
  };
}

function fieldClass(hasError) {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:bg-white/5 dark:text-white dark:focus:ring-primary-900/40 ${
    hasError ? "border-danger-300" : "border-slate-200 dark:border-white/10"
  }`;
}

export function MedicationForm({ initialValues, onSubmit, onCancel, submitLabel = "Save Medication" }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(() => initialValues || emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleFrequencyChange = (value) => {
    const freq = FREQUENCIES.find((f) => f.value === value);
    set({ frequency: value, schedules: freq.defaultTimes.map((t) => ({ time: t, days_of_week: "ALL" })) });
  };

  const addTime = () => set({ schedules: [...form.schedules, { time: "12:00", days_of_week: "ALL" }] });
  const removeTime = (idx) => set({ schedules: form.schedules.filter((_, i) => i !== idx) });
  const updateTime = (idx, time) =>
    set({ schedules: form.schedules.map((s, i) => (i === idx ? { ...s, time } : s)) });

  const runAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiNote(null);
    try {
      const parsed = await aiService.parseMedicationText(aiText);
      set({
        name: parsed.name || form.name,
        type: parsed.type,
        dosage: parsed.dosage,
        frequency: parsed.frequency,
        instructions: parsed.instructions,
        schedules: parsed.schedules.map((s) => ({ time: s.time, days_of_week: "ALL" })),
      });
      setAiNote(parsed.note);
    } catch {
      showToast("Couldn't parse that text. Please fill the form in manually.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const validate = () => {
    const next = {};
    next.name = required(form.name, "Medicine name is required.");
    next.dosage = required(form.dosage, "Dosage is required.");
    next.start_date = required(form.start_date, "Start date is required.");
    if (!isDateRangeValid(form.start_date, form.end_date)) next.end_date = "End date cannot be before start date.";
    if (form.quantity !== "" && (Number.isNaN(Number(form.quantity)) || Number(form.quantity) < 0)) {
      next.quantity = "Enter a valid quantity (0 or more).";
    }
    if (form.schedules.length === 0) next.schedules = "Add at least one reminder time.";
    Object.keys(next).forEach((k) => next[k] == null && delete next[k]);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        quantity: form.quantity === "" ? null : Number(form.quantity),
        end_date: form.end_date || null,
        notes: form.notes || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="rounded-2xl border border-dashed border-accent-200 bg-accent-50/50 p-4 dark:border-accent-900/40 dark:bg-accent-900/10">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-accent-700 dark:text-accent-300">
          <Sparkles size={15} /> Describe it in plain English (optional)
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="e.g. Paracetamol 500mg twice daily after food"
            className={fieldClass(false)}
          />
          <button
            type="button"
            onClick={runAiParse}
            disabled={aiLoading || !aiText.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
          >
            {aiLoading ? <LoadingSpinner size={15} /> : <Sparkles size={15} />} Fill form
          </button>
        </div>
        {aiNote && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-accent-700 dark:text-accent-300">
            <Info size={13} className="mt-0.5 shrink-0" /> {aiNote}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Medicine Name</label>
          <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Paracetamol" className={fieldClass(errors.name)} />
          {errors.name && <p className="mt-1 text-xs text-danger-500">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Medicine Type</label>
          <select value={form.type} onChange={(e) => set({ type: e.target.value })} className={fieldClass(false)}>
            {MEDICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Dosage</label>
          <input type="text" value={form.dosage} onChange={(e) => set({ dosage: e.target.value })} placeholder="e.g. 500 mg or 1 tablet" className={fieldClass(errors.dosage)} />
          {errors.dosage && <p className="mt-1 text-xs text-danger-500">{errors.dosage}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Quantity in stock</label>
          <input type="number" min="0" value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} placeholder="Optional — for refill alerts" className={fieldClass(errors.quantity)} />
          {errors.quantity && <p className="mt-1 text-xs text-danger-500">{errors.quantity}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Frequency</label>
          <select value={form.frequency} onChange={(e) => handleFrequencyChange(e.target.value)} className={fieldClass(false)}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Start Date</label>
          <input type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} className={fieldClass(errors.start_date)} />
          {errors.start_date && <p className="mt-1 text-xs text-danger-500">{errors.start_date}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">End Date</label>
          <input type="date" value={form.end_date} onChange={(e) => set({ end_date: e.target.value })} placeholder="Optional" className={fieldClass(errors.end_date)} />
          {errors.end_date && <p className="mt-1 text-xs text-danger-500">{errors.end_date}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Instructions</label>
          <select value={form.instructions} onChange={(e) => set({ instructions: e.target.value })} className={fieldClass(false)}>
            {INSTRUCTIONS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Reminder Times</label>
          <button type="button" onClick={addTime} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
            <Plus size={13} /> Add another time
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {form.schedules.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="time" value={s.time} onChange={(e) => updateTime(idx, e.target.value)} className={fieldClass(false)} />
              {form.schedules.length > 1 && (
                <button type="button" onClick={() => removeTime(idx)} aria-label="Remove this time" className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-900/20">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.schedules && <p className="mt-1 text-xs text-danger-500">{errors.schedules}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Notes</label>
        <textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional notes for yourself" className={fieldClass(false)} />
      </div>

      <div className="mt-2 flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:opacity-60">
          {saving && <LoadingSpinner size={16} />} {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default MedicationForm;
