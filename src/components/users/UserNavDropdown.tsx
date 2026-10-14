import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../lib/usersStorage';
import {
  Shield,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Users,
  LogOut,
  Sparkles,
  Lock,
  Building,
  Check,
  ArrowRightLeft
} from 'lucide-react';

interface UserNavDropdownProps {
  onNavigateToUsers: () => void;
}

export function UserNavDropdown({ onNavigateToUsers }: UserNavDropdownProps) {
  const { currentUser, users, switchUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleInfo = ROLE_LABELS[currentUser.role] || ROLE_LABELS.custom;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition-all cursor-pointer text-right shadow-2xs"
        title="الملف الشخصي والتبديل بين المستخدمين"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
          {currentUser.fullName.charAt(0)}
        </div>

        <div className="hidden sm:block text-right">
          <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
            <span>{currentUser.fullName}</span>
            {currentUser.role === 'admin' && (
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600 inline" />
            )}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>{roleInfo.title}</span>
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-400">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{currentUser.fullName}</div>
                <div className="text-[11px] text-indigo-300 truncate">@{currentUser.username}</div>
                <div className="text-[10px] text-slate-300 truncate">{currentUser.department}</div>
              </div>
            </div>
          </div>

          {/* Quick Switch Section */}
          <div className="p-2 border-b border-slate-100">
            <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>التبديل السريع لحساب آخر:</span>
              <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
            </div>

            <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
              {users.map(u => {
                const isSelected = u.id === currentUser.id;
                const rInfo = ROLE_LABELS[u.role] || ROLE_LABELS.custom;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      switchUser(u.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div className="text-right truncate">
                        <div className="truncate">{u.fullName}</div>
                        <div className="text-[9px] text-slate-400">{rInfo.title}</div>
                      </div>
                    </div>

                    {isSelected ? (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-indigo-600 hover:underline shrink-0">تبديل</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Management Link & Actions */}
          <div className="p-2 space-y-1 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToUsers();
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-2xs transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>إدارة المستخدمين والصلاحيات (RBAC)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>تسجيل الخروج (العودة للمدير العام)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
