import { Github, Moon, Sun } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

import { useTheme } from "../context/UIContext";

function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-white/5 dark:bg-surface-darker/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-lg">💊</span>
          <span className="font-display text-lg font-bold text-slate-900 dark:text-white">MediCare</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400">Features</a>
          <a href="#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400">How it works</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/login"
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5 sm:px-4"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 sm:px-4"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "mailto:hello@medicare.app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white dark:border-white/5 dark:bg-surface-darker">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-base">💊</span>
              <span className="font-display text-base font-bold text-slate-900 dark:text-white">MediCare</span>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              A B.Tech CSE (AI) minor project — smart medication reminders and health management.
            </p>
            {/* Replace with your actual repository link before submitting/deploying. */}
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            >
              <Github size={16} /> View on GitHub
            </a>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MediCare. Built for academic demonstration purposes.</p>
          <p>No real medical advice is provided by this application.</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-darker">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
