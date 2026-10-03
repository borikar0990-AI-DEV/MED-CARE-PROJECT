import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  CalendarDays,
  History as HistoryIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Pill,
  Plus,
  Sun,
  UserCircle,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/UIContext";
import { notificationService } from "../../services/resourceServices";
import { NotificationList } from "../notifications/NotificationPanel";

export const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard, mobile: true },
  { to: "/app/medications", label: "Medications", mobileLabel: "Medicines", icon: Pill, mobile: true },
  { to: "/app/calendar", label: "Calendar", mobileLabel: "Calendar", icon: CalendarDays, mobile: true },
  { to: "/app/history", label: "History", mobileLabel: "History", icon: HistoryIcon, mobile: true },
  { to: "/app/statistics", label: "Statistics", icon: BarChart3, mobile: false },
  { to: "/app/profile", label: "Profile", mobileLabel: "Profile", icon: UserCircle, mobile: true },
];

function NavItemLink({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        }`
      }
    >
      <item.icon size={18} />
      {item.label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-6 dark:border-white/5 dark:bg-surface-dark lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-lg">💊</span>
        <span className="font-display text-lg font-bold text-slate-900 dark:text-white">MediCare</span>
      </div>

      <NavLink
        to="/app/medications/new"
        className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600"
      >
        <Plus size={17} /> Add Medication
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </nav>

      <p className="px-2 text-xs text-slate-400">MediCare · B.Tech CSE (AI) minor project</p>
    </aside>
  );
}

export function MobileNav() {
  const mobileItems = NAV_ITEMS.filter((i) => i.mobile);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-100 bg-white/95 backdrop-blur dark:border-white/5 dark:bg-surface-dark/95 lg:hidden"
      style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))`, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {mobileItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"
            }`
          }
        >
          <item.icon size={20} />
          {item.mobileLabel}
        </NavLink>
      ))}
    </nav>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const unread = await notificationService.list({ unreadOnly: true, limit: 50 });
      setUnreadCount(unread.length);
    } catch {
      /* non-critical background refresh — ignore transient failures */
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 45_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const latest = await notificationService.list({ unreadOnly: false, limit: 6 });
      setItems(latest);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-100 bg-white p-2 shadow-card dark:border-white/10 dark:bg-surface-dark"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/app/notifications");
                }}
                className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                View all
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto scroll-thin">
              <NotificationList
                items={items}
                compact
                onChanged={(updated) => {
                  setItems(updated);
                  refresh();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar({ onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/5 dark:bg-surface-dark/90 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <p className="hidden text-sm text-slate-400 sm:block">{today}</p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">
              {user?.name?.split(" ")[0]}
            </span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1.5 shadow-card dark:border-white/10 dark:bg-surface-dark"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/app/profile");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <UserCircle size={16} /> Profile
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    navigate("/login");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
                >
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export function MobileSidebarDrawer({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white px-4 py-6 dark:bg-surface-dark lg:hidden"
          >
            <div className="mb-8 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-lg">💊</span>
                <span className="font-display text-lg font-bold text-slate-900 dark:text-white">MediCare</span>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            <NavLink
              to="/app/medications/new"
              onClick={onClose}
              className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={17} /> Add Medication
            </NavLink>
            <nav className="flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavItemLink key={item.to} item={item} onClick={onClose} />
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
