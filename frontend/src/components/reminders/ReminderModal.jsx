import { Clock, SkipForward } from "lucide-react";

import { INSTRUCTIONS, MEDICATION_TYPES, labelFor } from "../../utils/constants";
import { formatTime } from "../../utils/dateUtils";
import { Modal } from "../common/Modals";

export function ReminderModal({ reminder, onTaken, onSkip, onSnooze }) {
  if (!reminder) return null;
  const TypeIcon = MEDICATION_TYPES.find((t) => t.value === reminder.medication_type)?.icon;

  return (
    <Modal open={!!reminder} onClose={onSnooze} title="🔔 Medication Reminder" size="sm">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
          {TypeIcon ? <TypeIcon size={30} /> : <span className="text-3xl">💊</span>}
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">Time to take</p>
        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{reminder.medication_name}</h3>
        <p className="mt-1 text-xs text-slate-400">Scheduled for {formatTime(reminder.scheduled_time)}</p>

        <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/5">
            <p className="text-xs text-slate-400">Dosage</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{reminder.dosage}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/5">
            <p className="text-xs text-slate-400">Instruction</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {labelFor(INSTRUCTIONS, reminder.instructions)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onTaken}
          className="rounded-xl bg-secondary-500 px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-secondary-600"
        >
          Taken
        </button>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onSkip}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:ring-amber-900/50 dark:hover:bg-amber-900/20"
          >
            <SkipForward size={15} /> Skip
          </button>
          <button
            type="button"
            onClick={onSnooze}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5"
          >
            <Clock size={15} /> Remind Later
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ReminderModal;
