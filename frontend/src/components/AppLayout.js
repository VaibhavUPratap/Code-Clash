import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
    { to: "/", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { to: "/dashboard", label: "Dashboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { to: "/alerts", label: "Alerts", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    { to: "/insights", label: "Insights", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
    { to: "/prediction", label: "Predictions", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { to: "/research", label: "Research", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
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
                    <div className="w-7 h-7 rounded-sm bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center glow-indigo">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
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
                                <svg
                                    className={`w-4 h-4 transition-colors duration-200 ${isActive ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-400"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={isActive ? 2.5 : 2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
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
                        <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
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
