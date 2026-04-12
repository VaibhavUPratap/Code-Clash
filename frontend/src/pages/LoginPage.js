import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  ChevronRight, 
  Loader2, 
  Lock, 
  Fingerprint,
  Mail,
  Zap,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Secure Access Gateway — v5.1 (Elite SaaS Edition)
 * Optimized for industrial high-security aesthetics.
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
            setError(err.message || "Failed to establish secure handshake.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
            
            {/* Background Neural Network Aesthetic */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="glass-card rounded-[4rem] border-white/[0.05] p-12 md:p-20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-50" />
                    
                    <div className="text-center mb-16">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(79,70,229,0.15)] relative overflow-hidden group-hover:scale-110 transition-transform duration-700">
                             <Shield className="w-10 h-10 text-indigo-400 relative z-10" />
                             <div className="absolute inset-0 bg-indigo-500/5 transition-opacity opacity-0 group-hover:opacity-100" />
                        </div>
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">Access Gateway</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 leading-relaxed">Secure Node Encryption Terminal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                className="px-8 py-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-6">
                            <div className="relative group/field">
                                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700 mb-3 block ml-4 group-focus-within/field:text-indigo-400 transition-colors">Credential Email</label>
                                <div className="absolute inset-y-0 left-8 flex items-center top-9 pointer-events-none">
                                    <Mail className="w-5 h-5 text-zinc-800" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter authorized relay address..."
                                    required
                                    className="w-full pl-20 pr-8 py-7 bg-white/[0.02] border border-white/[0.08] focus:border-indigo-500/30 focus:bg-white/[0.04] rounded-3xl text-white outline-none transition-all font-black italic tracking-tighter placeholder-zinc-800"
                                />
                            </div>

                            <div className="relative group/field">
                                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700 mb-3 block ml-4 group-focus-within/field:text-indigo-400 transition-colors">Access Keycard</label>
                                <div className="absolute inset-y-0 left-8 flex items-center top-9 pointer-events-none">
                                    <Lock className="w-5 h-5 text-zinc-800" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter encrypted key..."
                                    required
                                    className="w-full pl-20 pr-8 py-7 bg-white/[0.02] border border-white/[0.08] focus:border-indigo-500/30 focus:bg-white/[0.04] rounded-3xl text-white outline-none transition-all font-black italic tracking-tighter placeholder-zinc-800"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-black tracking-widest px-4">
                            <label className="flex items-center gap-3 text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded-lg bg-zinc-900 border-white/5 accent-indigo-600" />
                                PERSIST SESSION
                            </label>
                            <button type="button" className="text-indigo-500 hover:text-indigo-400 transition-colors uppercase">LOST KEY?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 text-white font-black rounded-3xl transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> }
                            {loading ? "Establishing Link..." : "Authenticate"}
                        </button>
                    </form>

                    <div className="mt-16 pt-10 border-t border-white/5 text-center space-y-8">
                         <div className="flex flex-col items-center gap-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 leading-relaxed">Authorized Personnel Access Only</p>
                            <div className="flex items-center gap-4 px-6 py-2.5 bg-white/[0.02] border border-white/5 rounded-full">
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Relay Node:</span>
                                <span className="text-[10px] font-black text-indigo-400 font-mono tracking-tight glow-indigo-text">test@test.com</span>
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-center gap-8 opacity-40">
                            {[Fingerprint, Zap, Globe].map((Icon, i) => (
                                <Icon key={i} className="w-5 h-5 text-zinc-100" />
                            ))}
                         </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-12 text-[9px] font-black text-zinc-800 uppercase tracking-[0.3em]">
                    <span className="hover:text-zinc-600 cursor-default transition-colors">Neural Core v5.1.0</span>
                    <span className="hover:text-zinc-600 cursor-default transition-colors">Protocols Verified</span>
                    <span className="hover:text-zinc-600 cursor-default transition-colors">256-Bit SSL Handshake</span>
                </div>
            </motion.div>
        </div>
    );
}
