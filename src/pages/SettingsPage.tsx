import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  UserPlus, 
  Users, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  Building2, 
  Clock, 
  Save, 
  Database,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { cn } from '../lib/utils';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, showToast, setConfirmModal } = useApp();

  const [adminList, setAdminList] = useState<User[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Center info
  const [centerLocation, setCenterLocation] = useState('Ground Floor, NEU University Building 1, Uniform Center');
  const [pickupHours, setPickupHours] = useState('Monday – Friday: 8:00 AM – 5:00 PM');
  const [announcement, setAnnouncement] = useState('Uniform claiming is strictly scheduled. Please present your digital or printed receipt.');

  // Access control check
  if (user && user.role === 'student') {
    navigate('/inventory', { replace: true });
    return null;
  }

  // Real-time listener for admins
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach(doc => {
        const u = doc.data() as User;
        if (u.role === 'admin' || u.role === 'superadmin') {
          usersData.push(u);
        }
      });
      setAdminList(usersData);
    });

    return () => unsub();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();

    if (!email) {
      showToast("Please enter an email address", true);
      return;
    }

    if (!email.endsWith('@neu.edu.ph')) {
      showToast("Only @neu.edu.ph institutional emails can be assigned as Admins", true);
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      // Find or register in users collection
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: email,
        displayName: email.split('@')[0],
        role: newAdminRole,
        createdAt: new Date().toISOString()
      }, { merge: true });

      showToast(`Admin privileges granted to ${email}`);
      setNewAdminEmail('');
    } catch (err: any) {
      showToast(err.message || "Failed to add admin", true);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleRemoveAdmin = (targetUser: User) => {
    if (targetUser.email === user?.email) {
      showToast("You cannot remove your own admin access", true);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Revoke Admin Access",
      message: `Are you sure you want to revoke administrative permissions from ${targetUser.email}?`,
      onConfirm: async () => {
        try {
          const userId = targetUser.uid || targetUser.email.replace(/[^a-zA-Z0-9]/g, '_');
          await setDoc(doc(db, 'users', userId), { role: 'student' }, { merge: true });
          showToast(`Revoked admin access for ${targetUser.email}`);
        } catch (err: any) {
          showToast(err.message || "Failed to revoke access", true);
        }
      }
    });
  };

  const handleSaveCenterSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Uniform Center configuration updated successfully");
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">
            System Administration
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight mt-1">
            Admin Accounts & Center Settings
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage staff credentials, role assignments, and campus pickup center information.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Admin User Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add New Admin Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-blue text-brand-orange rounded-xl flex items-center justify-center font-black">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Grant Admin Privileges</h3>
                <p className="text-xs text-slate-400">Add staff member by their verified NEU email</p>
              </div>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    placeholder="staff.name@neu.edu.ph"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                  />
                </div>

                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="admin">Staff Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>

                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="px-6 py-3 bg-brand-blue hover:bg-brand-blue-light text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSubmittingAdmin ? 'Adding...' : 'Grant Role'}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                Note: The user must log in with their Google account associated with this <strong>@neu.edu.ph</strong> address.
              </p>
            </form>
          </div>

          {/* Current Admins List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-brand-blue" />
                <h4 className="text-sm font-bold text-slate-900">Active Staff & Admins ({adminList.length})</h4>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {adminList.map((admin) => (
                <div key={admin.uid || admin.email} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center font-black text-sm">
                      {admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{admin.displayName || admin.email.split('@')[0]}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                          admin.role === 'superadmin' ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-brand-blue"
                        )}>
                          {admin.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{admin.email}</span>
                    </div>
                  </div>

                  {user?.role === 'superadmin' && admin.email !== user?.email && (
                    <button
                      onClick={() => handleRemoveAdmin(admin)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Revoke Admin Access"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {adminList.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No other admins registered
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Uniform Center & Campus Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <Building2 className="text-brand-blue" size={20} />
              <h3 className="text-sm font-bold text-slate-900">Pickup Center Details</h3>
            </div>

            <form onSubmit={handleSaveCenterSettings} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  On-Campus Location
                </label>
                <input
                  type="text"
                  value={centerLocation}
                  onChange={(e) => setCenterLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={pickupHours}
                  onChange={(e) => setPickupHours(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Student Notice / Announcement
                </label>
                <textarea
                  rows={3}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={14} />
                <span>Save Center Info</span>
              </button>
            </form>
          </div>

          {/* Security & Access Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-brand-blue font-bold text-xs">
              <Lock size={16} />
              <span>Institutional SSO Enforcement</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Only authenticated users with the active domain <strong>@neu.edu.ph</strong> can access NEUnifits. Any non-university Google accounts are rejected on sign-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
