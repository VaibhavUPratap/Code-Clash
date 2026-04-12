import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { Home, LayoutDashboard, Bell, BarChart2, Cpu, Search, LogOut, Terminal } from "lucide-react";

const NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/alerts", label: "Alerts", icon: Bell },
    { to: "/insights", label: "Insights", icon: BarChart2 },
    { to: "/prediction", label: "Predictions", icon: Cpu },
    { to: "/research", label: "Research", icon: Search },
];

export default function AppLayout() {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-indigo-500/30">
            {/* Subtle radial background mesh for depth */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950 to-zinc-950 z-0"></div>

            {/* Sidebar Navigation */}
            <nav className="w-64 border-r border-white/5 glass-panel hidden md:flex flex-col sticky top-0 h-screen z-10 shadow-2xl">
                <div className="p-5 border-b border-white/5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-sm bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center glow-indigo group-hover:scale-105 transition-all">
                        <Terminal className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-all duration-300" />
                    </div>
                    <span className="font-semibold text-sm tracking-wide text-zinc-100">TrendFinder System</span>
                </div>

                <div className="flex-1 py-6 px-3 flex flex-col gap-1.5 overflow-y-auto">
                    <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3 px-3">
                        Views
                    </div>
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 no-underline ${isActive
                                    ? "bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]"
                                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 border border-transparent"
                                    }`}
                            >
                                <item.icon
                                    className={`w-4 h-4 transition-all duration-300 ${isActive ? "text-indigo-400 scale-110" : "text-zinc-600 group-hover:text-zinc-300 group-hover:scale-110"}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/5">
                    <NavLink
                        to="/login"
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-all duration-200 border border-transparent no-underline"
                    >
                        <LogOut className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
                        Sign Out
                    </NavLink>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 z-10">
                <Outlet />
            </main>
        </div>
    );
}
