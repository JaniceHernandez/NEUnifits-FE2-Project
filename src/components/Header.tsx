import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  ShieldCheck, 
  User as UserIcon, 
  Sparkles,
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { 
    user, 
    handleSignOut, 
    cart, 
    setIsCartOpen, 
    notifications, 
    unreadCount, 
    setSelectedNotification,
    handleClearAllNotifications 
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button 
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden cursor-pointer transition-colors"
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>
        )}
        
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-blue rounded-xl flex items-center justify-center text-brand-orange shadow-md shadow-brand-blue/15 font-black text-base border border-brand-orange/30">
            N
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-brand-blue font-display leading-none">
              NEU<span className="text-brand-orange">NIFITS</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Staff Portal' : 'Student Store'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Student Cart Trigger */}
        {user?.role === 'student' && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 text-slate-600 hover:text-brand-blue hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-2"
            title="Open Cart"
          >
            <ShoppingCart size={20} />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-orange text-brand-blue font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white">
                {totalCartCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2.5 text-slate-600 hover:text-brand-blue hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifications</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{unreadCount} unread updates</span>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleClearAllNotifications}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setSelectedNotification(notif);
                        setIsNotifOpen(false);
                      }}
                      className={cn(
                        "p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left flex gap-3 items-start",
                        !notif.read && "bg-blue-50/40"
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        !notif.read ? "bg-brand-orange" : "bg-transparent"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs leading-snug", !notif.read ? "font-bold text-slate-900" : "font-medium text-slate-600")}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-1">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No notifications right now
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Menu */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-lg object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 bg-brand-blue text-white rounded-lg flex items-center justify-center font-black text-xs">
                  {user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight max-w-[130px] truncate">{user.displayName || user.email.split('@')[0]}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand-orange">{user.role}</span>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || user.email}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
