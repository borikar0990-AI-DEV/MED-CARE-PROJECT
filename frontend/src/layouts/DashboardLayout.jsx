import { BellRing } from "lucide-react";
import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { MobileNav, MobileSidebarDrawer, Navbar, Sidebar } from "../components/common/Navigation";
import { PageLoader } from "../components/common/Feedback";
import { ReminderModal } from "../components/reminders/ReminderModal";
import { useAuth } from "../context/AuthContext";
import { useReminderEngine } from "../hooks/useReminderEngine";

const DISMISS_KEY = "medicare_notif_prompt_dismissed";

function NotificationPermissionBanner({ permission, onEnable }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  if (permission !== "default" || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl bg-primary-50 px-4 py-3 text-sm text-primary-800 dark:bg-primary-900/20 dark:text-primary-200 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <BellRing size={18} className="shrink-0" />
        <span>Turn on browser notifications so reminders reach you even in another tab.</span>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEnable}
          className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600"
        >
          Enable
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-white/5"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reminder = useReminderEngine({ enabled: isAuthenticated });

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-surface-soft dark:bg-surface-darker">
      <Sidebar />
      <MobileSidebarDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <NotificationPermissionBanner permission={reminder.permission} onEnable={reminder.requestPermission} />
        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pb-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      <ReminderModal
        reminder={reminder.activeReminder}
        onTaken={reminder.markTaken}
        onSkip={reminder.markSkipped}
        onSnooze={reminder.snooze}
      />
    </div>
  );
}

export default DashboardLayout;
