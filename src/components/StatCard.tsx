import React from 'react';
import { motion } from 'motion/react';

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, description }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-brand-orange/40 hover:shadow-md transition-all"
    >
      <div className="w-14 h-14 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border border-slate-100">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight truncate font-display">{value}</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider truncate mt-0.5">{label}</p>
        {description && (
          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{description}</p>
        )}
      </div>
    </motion.div>
  );
};
