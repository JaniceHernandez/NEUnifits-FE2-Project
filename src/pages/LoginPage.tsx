import React from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Lock 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { handleGoogleLogin, loginError, authLoading } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-blue to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white relative overflow-hidden font-sans select-none">
      {/* Ambient background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10"
      >
        {/* University Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-brand-orange text-brand-blue rounded-3xl flex items-center justify-center font-black shadow-xl shadow-brand-orange/20 mb-4 border-2 border-white/20">
            <GraduationCap size={36} />
          </div>
          
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-1">
            New Era University
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white font-display">
            NEU<span className="text-brand-orange">NIFITS</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Official Online Uniform Ordering & Inventory System
          </p>
        </div>

        {/* Error Alert Message */}
        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-200 text-xs"
          >
            <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">
              {loginError}
            </div>
          </motion.div>
        )}

        {/* Google SSO Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            id="google-sso-login-btn"
          >
            {/* Standard Google SVG Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="flex items-center gap-2 justify-center text-[11px] text-slate-300 pt-2 font-medium">
            <Lock size={12} className="text-brand-orange" />
            <span>Domain Restricted: <strong>@neu.edu.ph</strong> accounts only</span>
          </div>
        </div>

        {/* Feature Highlights Card */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <ShoppingBag size={18} className="mx-auto text-brand-orange mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-200">Real-time Stock</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <Clock size={18} className="mx-auto text-brand-orange mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-200">Pickup Tracking</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <ShieldCheck size={18} className="mx-auto text-brand-orange mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-200">Secure SSO</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} New Era University Uniform Services. All rights reserved.
      </footer>
    </div>
  );
};
