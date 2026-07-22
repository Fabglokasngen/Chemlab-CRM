import React, { useState } from 'react';
import { 
  X, LogOut, ShieldCheck, Mail, Phone, 
  Building2, Calendar, User, Sparkles, Check
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenAuthModal 
}) => {
  const { userProfile, logout, isDemoMode, updateRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userProfile?.role || 'Administrator');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !userProfile) return null;

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    setSelectedRole(newRole);
    setIsUpdating(true);
    await updateRole(newRole);
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div id="user-profile-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 relative text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              {userProfile.photoURL ? (
                <img 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-teal-600 border-2 border-teal-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  {userProfile.displayName?.slice(0, 2).toUpperCase() || 'US'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 border-2 border-slate-900 rounded-full w-4 h-4"></span>
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{userProfile.displayName}</h3>
              <p className="text-xs text-slate-300 font-medium">{userProfile.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {userProfile.role}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isDemoMode ? 'Demo Sandbox' : 'Firebase Live'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Department</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{userProfile.department || 'Lab Operations'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Contact Number</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{userProfile.phoneNumber || '+62 812-3456-7890'}</span>
            </div>
          </div>

          {/* Quick Role Switcher */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Account Designation:
              </label>
              {isUpdating && <span className="text-[10px] text-teal-600 font-semibold animate-pulse">Updating...</span>}
            </div>

            <select
              value={userProfile.role}
              onChange={handleRoleChange}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Administrator">Administrator Account</option>
              <option value="Manager Sales">Sales Manager Account</option>
              <option value="Sales Executive">Sales Executive Account</option>
              <option value="Laboratorium Tech">Laboratory Tech Account</option>
            </select>
            <p className="text-[10px] text-slate-500 font-medium">
              Data Security #1 Priority: All accounts enjoy equal access to all CRM modules, while your data remains strictly isolated to your account.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Switch Account / Auth
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/60"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
