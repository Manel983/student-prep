"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: "▦",
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: "♙",
  },
  {
    name: "Question Bank",
    href: "/admin/questions",
    icon: "☷",
  },
  {
    name: "Subjects",
    href: "/admin/subjects",
    icon: "◈",
  },
  {
    name: "Topics",
    href: "/admin/topics",
    icon: "◇",
  },
  {
    name: "Exams",
    href: "/admin/exams",
    icon: "▣",
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: "◆",
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: "₵",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: "⚙",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-slate-950 text-white">
      {/* Logo */}
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
            SP
          </div>

          <div>
            <h1 className="font-bold">Student Prep</h1>
            <p className="text-xs text-slate-400">
              Administration
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span className="w-5 text-center">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        <LogoutButton />
      </div>
    </aside>
  );
}