import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingBag, 
  Settings, 
  GraduationCap, 
  X,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, orders } = useApp();

  const currentPath = location.pathname;

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Navigation Links definition
  const navItems = [
    ...(isAdmin ? [{
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      badge: null
    }] : []),
    {
      path: '/inventory',
      label: isAdmin ? 'Inventory & Catalog' : 'Uniform Store',
      icon: <Boxes size={18} />,
      badge: null
    },
    {
      path: '/orders',
      label: isAdmin ? 'Order Management' : 'My Orders & Status',
      icon: <ShoppingBag size={18} />,
      badge: isAdmin ? orders.filter(o => o.status === 'pending').length : null
    },
    ...(isAdmin ? [{
      path: '/settings',
      label: 'Admin Control',
      icon: <Settings size={18} />,
      badge: null
    }] : [])
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-blue text-white select-none">
      {/* Brand Top Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick(isAdmin ? '/dashboard' : '/inventory')}>
          <div className="w-10 h-10 bg-brand-orange text-brand-blue rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-brand-orange/20">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-white tracking-tight leading-none">
              NEU<span className="text-brand-orange">NIFITS</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Official Portal</p>
          </div>
        </div>

        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="px-3 pb-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Navigation Menu</span>
        </div>

        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path === '/inventory' && currentPath === '/');
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer group text-left",
                isActive
                  ? "bg-brand-orange text-brand-blue shadow-md shadow-brand-orange/20 font-black scale-[1.02]"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3.5">
                <span className={cn(
                  "transition-transform group-hover:scale-110",
                  isActive ? "text-brand-blue" : "text-slate-300 group-hover:text-brand-orange"
                )}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge > 0 ? (
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full",
                  isActive ? "bg-brand-blue text-white" : "bg-brand-orange text-brand-blue"
                )}>
                  {item.badge}
                </span>
              ) : (
                <ChevronRight size={14} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100")} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 shadow-xl z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-brand-blue shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
