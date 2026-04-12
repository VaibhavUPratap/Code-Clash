import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  ChevronRight, 
  Loader2, 
  Lock, 
  Mail,
  Zap,
  Globe,
  Fingerprint
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Access Gateway — v6.0 (144Hz Optimized & Alignment Calibrated)
 * Precision centering and layout shift mitigation for Elite UX.
 */
export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError(err.message || "Invalid or restricted credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 md:p-8 relative overflow-hidden selection:bg-indigo-500/30">
            
            {/* Background Neural Ambience (GPU Threaded) */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2 animate-pulse-subtle" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/2 translate-y-1/2" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="glass-card rounded-[3.5rem] border-white/[0.05] p-10 md:p-16 lg:p-20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                    
                    <div className="text-center mb-16">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(79,70,229,0.15)]"
                        >
                             <Shield className="w-8 h-8 text-indigo-400" />
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">Access Gateway</h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-600">Secure Forensic Node</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Occupy stable space for error message to prevent CLS (Cumulative Layout Shift) */}
                        <div className="min-h-[40px] flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                        className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
                                    >
                                        // Error: {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-700 mb-2 block ml-6 group-focus-within:text-indigo-400 transition-colors">Credential Link</label>
                                <div className="absolute inset-y-0 left-6 flex items-center top-7 pointer-events-none opacity-30 group-focus-within:opacity-100 transition-opacity">
                                    <Mail className="w-5 h-5 text-indigo-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="node@authorized.io"
                                    required
                                    className="w-full pl-16 pr-6 py-6 bg-white/[0.02] border border-white/[0.08] focus:border-indigo-500/30 focus:bg-white/[0.04] rounded-[2rem] text-white outline-none transition-all font-black italic tracking-tighter placeholder-zinc-800"
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-700 mb-2 block ml-6 group-focus-within:text-indigo-400 transition-colors">Access Keycard</label>
                                <div className="absolute inset-y-0 left-6 flex items-center top-7 pointer-events-none opacity-30 group-focus-within:opacity-100 transition-opacity">
                                    <Lock className="w-5 h-5 text-indigo-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-16 pr-6 py-6 bg-white/[0.02] border border-white/[0.08] focus:border-indigo-500/30 focus:bg-white/[0.04] rounded-[2rem] text-white outline-none transition-all font-black italic tracking-tighter placeholder-zinc-800"
                                />
                            </div>
                        </div>

                        {/* Baseline Aligned Footer Rows */}
                        <div className="flex items-center justify-between text-[9px] font-black tracking-[0.3em] px-4 pt-4">
                            <label className="flex items-center gap-3 text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors group">
                                <div className="w-4 h-4 rounded-md border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors overflow-hidden">
                                     <input type="checkbox" className="opacity-0 absolute w-4 h-4 cursor-pointer" />
                                     <div className="w-2 h-2 bg-indigo-500 rounded-sm opacity-0 group-focus-within:opacity-100" />
                                </div>
                                PERSIST_TOKEN
                            </label>
                            <button type="button" className="text-zinc-700 hover:text-indigo-400 transition-colors uppercase">RECOVERY_MODE</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-7 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-4 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> }
                            {loading ? "AUTHENTICATING..." : "ESTABLISH_HANDSHAKE"}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-4 px-6 py-2 bg-white/[0.01] border border-white/5 rounded-full backdrop-blur-md">
                            <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Global Relay:</span>
                            <span className="text-[9px] font-black text-indigo-400/80 font-mono tracking-tight glow-indigo-text">test@test.com</span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-8 opacity-20">
                            {[Fingerprint, Zap, Globe].map((Icon, i) => (
                                <Icon key={i} className="w-4 h-4 text-white" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex justify-center gap-10 text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em]">
                    <span>Neural v6.0</span>
                    <span className="w-1 h-1 bg-zinc-900 rounded-full my-auto" />
                    <span>RSA-2048 Secure</span>
                    <span className="w-1 h-1 bg-zinc-900 rounded-full my-auto" />
                    <span>Lighthouse-Synced</span>
                </div>
            </motion.div>
        </div>
    );
}
