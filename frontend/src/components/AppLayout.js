import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  LayoutDashboard, 
  Bell, 
  BarChart2, 
  Cpu, 
  LogOut, 
  Terminal, 
  Zap,
  Activity,
  Layers,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Operations", icon: LayoutDashboard },
    { to: "/alerts", label: "Crisis Feed", icon: Bell },
    { to: "/insights", label: "Insights", icon: BarChart2 },
    { to: "/research", label: "Root Cause Lab", icon: Zap },
    { to: "/prediction", label: "Horizon", icon: Cpu },
];

export default function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleSignOut = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex min-h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-hidden">
            {/* Elite Background Infrastructure */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-grid-white opacity-[0.03]"></div>
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-subtle"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Sidebar Navigation — Elite Design */}
            <nav className="w-72 border-r border-white/5 glass-panel hidden md:flex flex-col sticky top-0 h-screen z-20 shadow-2xl relative">
                <div className="p-8 pb-10 flex items-center gap-4 transition-all hover:translate-x-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group">
                        <Terminal className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
                    </div>
                   <div className="flex flex-col">
                        <span className="font-black text-xs tracking-[0.2em] text-white uppercase italic">TrendFinder</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Crisis Intel OS</span>
                   </div>
                </div>

                <div className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-4 flex items-center gap-2">
                        <Layers className="w-3 h-3 text-indigo-500/50" />
                        Infrastructure
                    </div>
                    {NAV_ITEMS.map((item, idx) => {
                        const isActive = location.pathname === item.to;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `
                                    group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm transition-all duration-300 relative overflow-hidden
                                    ${isActive 
                                        ? "bg-white/[0.03] text-white border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]" 
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.01] border border-transparent"}
                                `}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? "bg-indigo-600/20 text-indigo-400" : "bg-zinc-800/10 text-zinc-600 group-hover:text-zinc-400"}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className={`font-bold tracking-tight ${isActive ? "text-white" : "group-hover:translate-x-1 transition-transform"}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {isActive && (
                                    <motion.div 
                                        layoutId="active-pill"
                                        className="w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                                    />
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Sidebar Footer — User Stats */}
                <div className="p-6 border-t border-white/5 space-y-4 bg-white/[0.01]">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-400">
                            {user?.email?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-zinc-100 truncate">{user?.email}</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                Operator Verified
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 border border-transparent hover:border-red-500/10"
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Terminate Session
                    </button>
                </div>
            </nav>

            {/* Main Content Area — Smooth Page Transitions */}
            <main className="flex-1 flex flex-col min-w-0 z-10 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                        className="flex-1 h-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
