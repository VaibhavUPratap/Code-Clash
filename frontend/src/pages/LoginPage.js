import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Loader2, 
  Zap,
  Globe,
  Fingerprint
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Access Gateway — v7.0 (Google-Only Optimized)
 * Pure authentication flow for Elite UX.
 */
export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            await loginWithGoogle();
            navigate("/");
        } catch (err) {
            setError(err.message || "Google authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 md:p-8 relative overflow-hidden selection:bg-indigo-500/30">
            
            {/* Background Neural Ambience */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2 animate-pulse-subtle" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-purple-600/5 blur-[80px] rounded-full pointer-events-none -translate-x-1/2 translate-y-1/2" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
                            Access Gateway
                        </h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-600">
                            Secure Forensic Node
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="min-h-[40px] flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                        className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
                                    >
                                        Error: {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="py-12 flex flex-col items-center">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleGoogleLogin}
                                className="w-full py-7 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 text-white font-black rounded-[2rem] interactive-fast shadow-md shadow-indigo-600/20 uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-4 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                                {loading ? "AUTHENTICATING..." : "CONTINUE_WITH_GOOGLE"}
                            </button>
                            
                            <p className="mt-8 text-center text-[9px] font-black tracking-[0.3em] uppercase text-zinc-700">
                                Authorized Personnel Only <br/>
                                <span className="opacity-50">Identity verified via Google Relay</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                        <div className="flex items-center justify-center gap-8 opacity-20">
                            {[Fingerprint, Zap, Globe].map((Icon, i) => (
                                <Icon key={i} className="w-4 h-4 text-white" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex justify-center gap-10 text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em]">
                    <span>Neural v7.0</span>
                    <span className="w-1 h-1 bg-zinc-900 rounded-full my-auto" />
                    <span>RSA-2048 Secure</span>
                    <span className="w-1 h-1 bg-zinc-900 rounded-full my-auto" />
                    <span>Lighthouse-Synced</span>
                </div>
            </motion.div>
        </div>
    );
}
