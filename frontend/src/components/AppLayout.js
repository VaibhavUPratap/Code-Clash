import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  LayoutDashboard, 
  Bell, 
  BarChart2, 
  LogOut, 
  Terminal, 
  Zap,
  Cpu,
  Layers,
  Fingerprint
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

/**
 * AppLayout — v6.0 (High Precision Alignment & 144Hz Transitions)
 * Optimized sidebar and HW-accelerated page transitions.
 */
export default function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleSignOut = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-hidden gpu-accelerated">
            
            {/* HW-Accelerated Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-grid-white opacity-[0.02]"></div>
                <div className="absolute top-0 left-1/4 w-[40vw] h-[40vw] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse-subtle"></div>
            </div>

            {/* Sidebar Navigation — Precision Alignment */}
            <nav className="w-72 border-r border-white/5 glass-panel hidden lg:flex flex-col h-full z-20 shadow-xl relative shrink-0">
                <div className="p-8 pb-8 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_18px_rgba(79,70,229,0.25)] group shrink-0">
                        <Terminal className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-200" />
                    </div>
                   <div className="flex flex-col min-w-0">
                        <span className="font-black text-sm tracking-[0.2em] text-white uppercase italic truncate">Crisis Intel</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">v6.0.4 - ACTIVE</span>
                   </div>
                </div>

                <div className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto scrollbar-hide py-3">
                    <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.35em] mb-3 px-5 flex items-center gap-3">
                        <Layers className="w-3 h-3 opacity-30" />
                        Infrastructure
                    </div>
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `
                                    group flex items-center justify-between px-5 py-3.5 rounded-[1.25rem] interactive-fast relative
                                    ${isActive 
                                        ? "bg-white/[0.04] text-white border border-white/5 shadow-lg" 
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02]"}
                                `}
                            >
                                <div className="flex items-center gap-5 relative z-10 w-full">
                                    <div className={`p-2.5 rounded-xl interactive-fast ${isActive ? "bg-indigo-600/30 text-indigo-400" : "bg-white/[0.03] text-zinc-600 group-hover:text-zinc-400"}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[12px] font-black uppercase tracking-widest ${isActive ? "text-white" : "group-hover:translate-x-1 transition-transform duration-150"}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {isActive && (
                                    <motion.div 
                                        layoutId="active-pill"
                                        className="absolute right-6 w-1 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.9)]"
                                    />
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Sidebar Footer — User Integrity Stats */}
                <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-indigo-400 shadow-inner shrink-0">
                            {user?.email?.slice(0, 2).toUpperCase() || <Fingerprint className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black text-zinc-100 truncate italic">{user?.email || "GUEST_NODE"}</span>
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                OPERATOR_SYNCED
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="group w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 hover:text-red-400 hover:bg-red-500/5 interactive-fast border border-white/[0.02] hover:border-red-500/10"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Terminate_Session
                    </button>
                </div>
            </nav>

            {/* Main Content Area — Optimized for 144Hz */}
            <main className="flex-1 flex flex-col min-w-0 z-10 relative overflow-hidden h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 h-full overflow-y-auto overflow-x-hidden"
                    >
                        <div className="min-h-full w-full">
                           <Outlet />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
