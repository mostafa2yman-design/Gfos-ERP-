import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  AppUser, 
  UserRole, 
  ScreenId, 
  StandardAction, 
  SensitiveDataKey, 
  ScreenPermissionConfig,
  UserAccountStatus
} from '../../types';
import {
  ROLE_LABELS,
  ENTERPRISE_ROLES,
  ALL_SCREENS_METADATA,
  ALL_SENSITIVE_DATA_METADATA,
  getDefaultScreenPermissionsForRole,
  getDefaultSensitivePermissionsForRole
} from '../../lib/permissionsConfig';
import {
  recordSystemApproval,
  getSystemApprovalLogs
} from '../../lib/auditStorage';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  X,
  Factory,
  Layers,
  HelpCircle,
  LogIn,
  Sliders,
  DollarSign,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Printer,
  FileCheck,
  History,
  AlertTriangle,
  BadgeCheck,
  Filter,
  ArrowUpDown,
  UserCog
} from 'lucide-react';

type ManagementTab = 'users' | 'matrix' | 'sensitive' | 'audit';

export function UsersManagement() {
  const {
    currentUser,
    users,
    switchUser,
    addUser,
    editUser,
    removeUser,
    resetDefaults
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ManagementTab>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Selected User for Matrix / Sensitive Override
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const selectedUser = users.find(u => u.id === selectedUserId) || currentUser;

  // Add/Edit User Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState<{
    username: string;
    fullName: string;
    employeeCode: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    roleTitle: string;
    department: string;
    isActive: boolean;
    status: UserAccountStatus;
    language: 'ar' | 'en';
  }>({
    username: '',
    fullName: '',
    employeeCode: '',
    email: '',
    phone: '',
    password: '123',
    role: 'production_manager',
    roleTitle: 'مدير الإنتاج والتشغيل',
    department: 'إدارة الإنتاج والتصنيع',
    isActive: true,
    status: 'active',
    language: 'ar'
  });

  // Password Reset Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setUserFormData({
      username: '',
      fullName: '',
      employeeCode: `EMP-0${users.length + 1}`,
      email: '',
      phone: '',
      password: '123',
      role: 'production_manager',
      roleTitle: 'مدير الإنتاج والتشغيل',
      department: 'إدارة الإنتاج والتصنيع',
      isActive: true,
      status: 'active',
      language: 'ar'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setUserFormData({
      username: user.username,
      fullName: user.fullName,
      employeeCode: user.employeeCode || '',
      email: user.email || '',
      phone: user.phone || '',
      password: user.password || '',
      role: user.role,
      roleTitle: user.roleTitle,
      department: user.department,
      isActive: user.isActive,
      status: user.status || (user.isActive ? 'active' : 'inactive'),
      language: user.language || 'ar'
    });
    setShowModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userFormData.username.trim() || !userFormData.fullName.trim()) {
        showToast('يرجى كتابة اسم المستخدم والاسم الكامل');
        return;
      }

      if (editingUserId) {
        // Edit existing
        const updated = editUser(editingUserId, {
          username: userFormData.username.trim(),
          fullName: userFormData.fullName.trim(),
          employeeCode: userFormData.employeeCode.trim(),
          email: userFormData.email.trim(),
          phone: userFormData.phone.trim(),
          password: userFormData.password || '123',
          role: userFormData.role,
          roleTitle: userFormData.roleTitle,
          department: userFormData.department,
          isActive: userFormData.status === 'active',
          status: userFormData.status,
          language: userFormData.language
        });

        recordSystemApproval({
          actionType: 'journal_entry',
          documentId: updated.id,
          documentNumber: updated.username,
          title: `تعديل بيانات الحساب: ${updated.fullName}`,
          details: `تم تعديل بيانات المستخدم (${updated.username}) والدور الوظيفي إلى (${updated.roleTitle})`,
          notes: 'تعديل إداري معتمد لمنظومة الصلاحيات'
        });

        showToast(`تم حفظ وتحديث بيانات (${updated.fullName}) بنجاح`);
      } else {
        // Create new
        const screenPerms = getDefaultScreenPermissionsForRole(userFormData.role);
        const sensPerms = getDefaultSensitivePermissionsForRole(userFormData.role);

        const created = addUser({
          username: userFormData.username.trim(),
          fullName: userFormData.fullName.trim(),
          employeeCode: userFormData.employeeCode.trim(),
          email: userFormData.email.trim(),
          phone: userFormData.phone.trim(),
          password: userFormData.password || '123',
          role: userFormData.role,
          roleTitle: userFormData.roleTitle,
          department: userFormData.department,
          isActive: userFormData.status === 'active',
          status: userFormData.status,
          language: userFormData.language,
          screenPermissions: screenPerms,
          sensitivePermissions: sensPerms,
          permissions: {} as any
        });

        recordSystemApproval({
          actionType: 'journal_entry',
          documentId: created.id,
          documentNumber: created.username,
          title: `إنشاء حساب مستخدم جديد: ${created.fullName}`,
          details: `تم إضافة مستخدم جديد للنظام (${created.username}) بدور (${created.roleTitle})`,
          notes: 'إضافة حساب جديد'
        });

        showToast(`تم إنشاء حساب جديد بنجاح باسم (@${created.username})`);
      }

      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ المستخدم');
    }
  };

  const handleDeleteUser = (user: AppUser) => {
    if (user.username === 'admin' || user.role === 'admin') {
      showToast('لا يمكن حذف حساب مدير النظام الرئيسي');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف حساب (${user.fullName}) نهائياً؟`)) {
      return;
    }

    try {
      removeUser(user.id);
      recordSystemApproval({
        actionType: 'journal_entry',
        documentId: user.id,
        documentNumber: user.username,
        title: `حذف حساب المستخدم: ${user.fullName}`,
        details: `تم حذف حساب المستخدم (@${user.username}) نهائياً من قاعدة بيانات النظام`,
        notes: 'حذف مستخدم'
      });
      showToast(`تم حذف حساب (@${user.username}) بنجاح`);
    } catch (err: any) {
      showToast(err.message || 'فشل في حذف المستخدم');
    }
  };

  const handleOpenPasswordReset = (user: AppUser) => {
    setPasswordTargetUser(user);
    setNewPassword('123456');
    setShowPasswordModal(true);
  };

  const handleSavePasswordReset = () => {
    if (!passwordTargetUser) return;
    if (!newPassword.trim()) {
      showToast('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    try {
      editUser(passwordTargetUser.id, { password: newPassword.trim() });
      recordSystemApproval({
        actionType: 'journal_entry',
        documentId: passwordTargetUser.id,
        documentNumber: passwordTargetUser.username,
        title: `إعادة تعيين كلمة المرور: ${passwordTargetUser.fullName}`,
        details: `تم تغيير كلمة المرور للمستخدم (@${passwordTargetUser.username}) بواسطة مسؤول النظام`,
        notes: 'تغيير كلمة المرور'
      });
      showToast(`تم تحديث كلمة المرور للمستخدم (@${passwordTargetUser.username}) بنجاح`);
      setShowPasswordModal(false);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ في تعيين كلمة المرور');
    }
  };

  const handleToggleScreenAllowed = (screenId: ScreenId) => {
    const currentScreens = selectedUser.screenPermissions || getDefaultScreenPermissionsForRole(selectedUser.role);
    const existingConfig = currentScreens[screenId] || {
      allowed: false,
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false, print: false }
    };

    const newAllowed = !existingConfig.allowed;
    const updatedScreens: Record<ScreenId, ScreenPermissionConfig> = {
      ...currentScreens,
      [screenId]: {
        allowed: newAllowed,
        actions: {
          ...existingConfig.actions,
          view: newAllowed ? true : false
        }
      }
    } as Record<ScreenId, ScreenPermissionConfig>;

    editUser(selectedUser.id, {
      screenPermissions: updatedScreens
    });

    showToast(`تم ${newAllowed ? 'السماح بدخول' : 'حجب'} شاشة (${ALL_SCREENS_METADATA.find(s => s.id === screenId)?.title}) فورياً`);
  };

  const handleToggleActionPermission = (screenId: ScreenId, action: StandardAction) => {
    const currentScreens = selectedUser.screenPermissions || getDefaultScreenPermissionsForRole(selectedUser.role);
    const existingConfig = currentScreens[screenId] || {
      allowed: false,
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false, print: false }
    };

    const nextActionState = !existingConfig.actions[action];
    const updatedScreens: Record<ScreenId, ScreenPermissionConfig> = {
      ...currentScreens,
      [screenId]: {
        allowed: nextActionState ? true : existingConfig.allowed,
        actions: {
          ...existingConfig.actions,
          [action]: nextActionState,
          // if enabling an action, ensure view is enabled
          view: nextActionState ? true : existingConfig.actions.view
        }
      }
    } as Record<ScreenId, ScreenPermissionConfig>;

    editUser(selectedUser.id, {
      screenPermissions: updatedScreens
    });

    showToast(`تم تحديث صلاحية (${action}) لشاشة (${screenId})`);
  };

  const handleToggleSensitiveData = (key: SensitiveDataKey) => {
    const currentSens = selectedUser.sensitivePermissions || getDefaultSensitivePermissionsForRole(selectedUser.role);
    const nextState = !currentSens[key];

    const updatedSens: Record<SensitiveDataKey, boolean> = {
      ...currentSens,
      [key]: nextState
    } as Record<SensitiveDataKey, boolean>;

    editUser(selectedUser.id, {
      sensitivePermissions: updatedSens
    });

    showToast(`تم ${nextState ? 'منح' : 'حجب'} صلاحية البيانات الحساسة (${ALL_SENSITIVE_DATA_METADATA.find(d => d.key === key)?.label}) فورياً`);
  };

  const handleResetUserPermissionsToRole = () => {
    const roleScreens = getDefaultScreenPermissionsForRole(selectedUser.role);
    const roleSens = getDefaultSensitivePermissionsForRole(selectedUser.role);

    editUser(selectedUser.id, {
      screenPermissions: roleScreens,
      sensitivePermissions: roleSens
    });

    showToast(`تمت استعادة الصلاحيات الافتراضية للدور (${selectedUser.roleTitle})`);
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(search.toLowerCase())) ||
      u.department.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && u.isActive && u.status !== 'suspended') ||
      (statusFilter === 'inactive' && !u.isActive) ||
      (statusFilter === 'suspended' && u.status === 'suspended');

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Audit Logs
  const auditLogs = getSystemApprovalLogs();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white border border-purple-500/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Main Enterprise Header */}
      <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-950/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2C1151] to-purple-800 text-amber-400 flex items-center justify-center shadow-md border border-purple-500/30 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  منظومة الهوية وإدارة الصلاحيات المؤسسية (GFOS RBAC)
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Enterprise v2.0
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                التحكم المركزي في حسابات الموظفين، الأدوار الوظيفية، مصفوفة الشاشات الـ 17، وتشفير الأسعار والتكاليف الحساسة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>

            <button
              onClick={resetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-purple-800/40 transition-all cursor-pointer"
              title="إعادة تعيين الفريق والحسابات المصنعية الافتراضية"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>استعادة الفريق الافتراضي</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 dark:border-purple-950/60 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>حسابات المستخدمين ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'matrix'
                ? 'border-purple-600 text-purple-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مصفوفة صلاحيات الشاشات والعمليات</span>
          </button>

          <button
            onClick={() => setActiveTab('sensitive')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'sensitive'
                ? 'border-purple-600 text-purple-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>صلاحيات التكاليف والأسعار المشفرة</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'audit'
                ? 'border-purple-600 text-purple-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-emerald-500" />
            <span>سجل التدقيق والرقابة الإدارية</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#140a22] rounded-xl border border-slate-200 dark:border-purple-950/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث باسم الموظف، اسم الدخول، كود الموظف، أو القسم..."
                className="w-full pl-4 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>الدور:</span>
              </div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">كافة الأدوار الوظيفية</option>
                {ENTERPRISE_ROLES.map(r => (
                  <option key={r.role} value={r.role}>{r.title}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">كافة الحالات</option>
                <option value="active">نشط فقط</option>
                <option value="inactive">معطل</option>
                <option value="suspended">موقوف</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-950/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#1c1033]/60 border-b border-slate-200 dark:border-purple-950/80 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">الموظف والحساب</th>
                    <th className="py-3 px-4">الدور الوظيفي والقسم</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">آخر تسجيل دخول</th>
                    <th className="py-3 px-4 text-center">التبديل الفوري</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-purple-950/40 text-sm">
                  {filteredUsers.map(user => {
                    const isCurrent = user.id === currentUser.id;
                    const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.custom;

                    return (
                      <tr 
                        key={user.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-purple-950/30 transition-colors ${
                          isCurrent ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                        }`}
                      >
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-sm shrink-0 border border-purple-200 dark:border-purple-800">
                              {user.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {user.fullName}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                                    أنت (الجلسة الحالية)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="font-mono text-purple-600 dark:text-purple-400">@{user.username}</span>
                                {user.employeeCode && (
                                  <span>• كود: {user.employeeCode}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role & Department */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                              {roleInfo.title}
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {user.department}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {user.status === 'suspended' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                              <XCircle className="w-3 h-3" />
                              <span>موقوف</span>
                            </span>
                          ) : user.isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>نشط</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              <X className="w-3 h-3" />
                              <span>معطل</span>
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {user.lastLogin ? (
                            <div>
                              <div>{new Date(user.lastLogin).toLocaleDateString('ar-EG')}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {new Date(user.lastLogin).toLocaleTimeString('ar-EG')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">لم يسجل الدخول بعد</span>
                          )}
                        </td>

                        {/* Quick Switch */}
                        <td className="py-3.5 px-4 text-center">
                          {isCurrent ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              الجلسة النشطة
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                switchUser(user.id);
                                showToast(`تم التبديل الفوري لحساب: ${user.fullName}`);
                              }}
                              disabled={!user.isActive || user.status === 'suspended'}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="تجربة الدخول بهذا الحساب لمعاينة الصلاحيات فورياً"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>دخول فوري</span>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setActiveTab('matrix');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                              title="ضبط الصلاحيات التفصيلية"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenPasswordReset(user)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                              title="تغيير كلمة المرور"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                              title="تعديل بيانات الحساب"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {user.username !== 'admin' && user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Target User Switcher Card */}
          <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-950/80 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  {selectedUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">تعديل مصفوفة صلاحيات المستخدم:</span>
                    <strong className="text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedUser.fullName}
                    </strong>
                    <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                      (@{selectedUser.username})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    الدور الوظيفي: <span className="font-bold text-purple-700 dark:text-purple-300">{selectedUser.roleTitle}</span> • {selectedUser.department}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/50 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) - {u.roleTitle}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleResetUserPermissionsToRole}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/50 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-purple-800/60 transition-all cursor-pointer flex items-center gap-1.5"
                  title="استعادة الصلاحيات الأصلية للدور الوظيفي"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة صلاحيات الدور</span>
                </button>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-950/80 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 dark:bg-[#1c1033]/40 border-b border-slate-200 dark:border-purple-950/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  مصفوفة الوصول للشاشات والعمليات التفصيلية (17 شاشة)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حدد إمكانية فتح الشاشة بالكامل أو تقييد العمليات (عرض، إضافة، تعديل، حذف، اعتماد، تصدير، طباعة)
                </p>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                حفظ فوري لحظي
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-[#1c1033] border-b border-slate-200 dark:border-purple-950/80 text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">الشاشة والوحدة</th>
                    <th className="py-3 px-3 text-center">فتح الشاشة</th>
                    <th className="py-3 px-3 text-center">عرض</th>
                    <th className="py-3 px-3 text-center">إضافة</th>
                    <th className="py-3 px-3 text-center">تعديل</th>
                    <th className="py-3 px-3 text-center">حذف</th>
                    <th className="py-3 px-3 text-center">اعتماد</th>
                    <th className="py-3 px-3 text-center">تصدير</th>
                    <th className="py-3 px-3 text-center">طباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-purple-950/40 text-xs">
                  {ALL_SCREENS_METADATA.map(screen => {
                    const screenConfig = selectedUser.screenPermissions?.[screen.id] || 
                      getDefaultScreenPermissionsForRole(selectedUser.role)[screen.id] || {
                        allowed: false,
                        actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false, print: false }
                      };

                    const isAllowed = !!screenConfig.allowed;

                    return (
                      <tr 
                        key={screen.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-purple-950/20 transition-colors ${
                          !isAllowed ? 'opacity-60 bg-slate-50/30 dark:bg-purple-950/10' : ''
                        }`}
                      >
                        {/* Screen Title & Category */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                            {screen.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {screen.categoryLabel} • {screen.description}
                          </div>
                        </td>

                        {/* Master Screen Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleScreenAllowed(screen.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all cursor-pointer ${
                              isAllowed
                                ? 'bg-emerald-500 text-white shadow-2xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-slate-300'
                            }`}
                            title={isAllowed ? 'الشاشة مسموحة (اضغط للحظر)' : 'الشاشة محظورة (اضغط للسماح)'}
                          >
                            {isAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Standard Actions: view, create, edit, delete, approve, export, print */}
                        {(['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'] as StandardAction[]).map(action => {
                          const isSupported = screen.supportedActions.includes(action);
                          const isActionActive = isAllowed && !!screenConfig.actions[action];

                          if (!isSupported) {
                            return (
                              <td key={action} className="py-3 px-3 text-center text-slate-300 dark:text-slate-700">
                                —
                              </td>
                            );
                          }

                          return (
                            <td key={action} className="py-3 px-3 text-center">
                              <button
                                type="button"
                                disabled={!isAllowed}
                                onClick={() => handleToggleActionPermission(screen.id, action)}
                                className={`w-7 h-7 rounded-md flex items-center justify-center mx-auto transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                  isActionActive
                                    ? 'bg-purple-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-purple-50 hover:text-purple-600'
                                }`}
                                title={`صلاحية ${action} في شاشة ${screen.title}`}
                              >
                                {isActionActive ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">•</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SENSITIVE DATA & COSTS */}
      {activeTab === 'sensitive' && (
        <div className="space-y-4">
          {/* Target User Switcher Card */}
          <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-950/80 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-black text-base shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">صلاحيات البيانات الحساسة والأسعار للمستخدم:</span>
                    <strong className="text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedUser.fullName}
                    </strong>
                    <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                      (@{selectedUser.username})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    البيانات غير المصرح بها تُستبدل برمز أمان مشفر وقفل <span className="font-mono text-amber-500 font-bold">••••••</span> وتُمنع من التصدير
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/50 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) - {u.roleTitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sensitive Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['production_cost', 'inventory_price', 'materials_price', 'sales_margin'].map(catKey => {
              const items = ALL_SENSITIVE_DATA_METADATA.filter(d => d.category === catKey);
              const catTitle = items[0]?.categoryLabel || catKey;

              return (
                <div 
                  key={catKey}
                  className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-950/80 p-5 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-purple-950/60">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {catTitle}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {items.map(item => {
                      const currentSens = selectedUser.sensitivePermissions || getDefaultSensitivePermissionsForRole(selectedUser.role);
                      const isGranted = !!currentSens[item.key];

                      return (
                        <div 
                          key={item.key}
                          className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1033]/50 border border-slate-200 dark:border-purple-900/30 hover:border-purple-400 transition-all"
                        >
                          <div className="flex-1 pr-1 pl-3">
                            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span>{item.label}</span>
                              {isGranted ? (
                                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleSensitiveData(item.key)}
                            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                              isGranted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            title={isGranted ? 'مصرح بالعرض (اضغط للحجب والتشفير)' : 'مشفر ومحجوب (اضغط للمنح)'}
                          >
                            <span 
                              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                                isGranted ? 'left-0.5' : 'right-0.5'
                              }`} 
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-950/80 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 dark:bg-[#1c1033]/40 border-b border-slate-200 dark:border-purple-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  سجل الاعتمادات والرقابة الإدارية المتكامل
                </h3>
                <p className="text-xs text-slate-500">
                  توثيق رسمي لكافة العمليات الحساسة، تغيير الصلاحيات، والتوقيعات الإدارية مع الطابع الزمني
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-400">
              إجمالي السجلات: {auditLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-[#1c1033] border-b border-slate-200 dark:border-purple-950/80 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">رقم التحقق والطابع الزمني</th>
                  <th className="py-3 px-4">نوع العملية</th>
                  <th className="py-3 px-4">المستند والموضوع</th>
                  <th className="py-3 px-4">المستخدم المنفذ</th>
                  <th className="py-3 px-4">التفاصيل</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-purple-950/40 text-xs">
                {auditLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-purple-950/20">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400 block">
                        {log.verificationCode || log.id.slice(0, 14)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.date} {log.time}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-purple-950/40 text-slate-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-purple-800/40 text-[10px]">
                        {log.actionTypeLabel}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {log.title}
                      </div>
                      {log.documentNumber && (
                        <div className="text-[10px] font-mono text-slate-400">
                          #{log.documentNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {log.userName}
                      </div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400">
                        {log.userRoleLabel}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.details}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                        <BadgeCheck className="w-3 h-3" />
                        <span>معتمد</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-900/60 shadow-2xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-purple-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingUserId ? 'تعديل بيانات الحساب' : 'إضافة مستخدم مؤسسي جديد'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    أدخل بيانات الحساب وحدد الدور الوظيفي في هيكل المصنع
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.fullName}
                    onChange={e => setUserFormData({ ...userFormData, fullName: e.target.value })}
                    placeholder="مثال: م. أحمد منصور"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الدخول (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={e => setUserFormData({ ...userFormData, username: e.target.value })}
                    placeholder="ahmed_production"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الدور الوظيفي الهيكلي *
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={e => {
                      const selectedRole = e.target.value as UserRole;
                      const roleDef = ENTERPRISE_ROLES.find(r => r.role === selectedRole);
                      setUserFormData({
                        ...userFormData,
                        role: selectedRole,
                        roleTitle: roleDef?.title || selectedRole,
                        department: roleDef?.department || userFormData.department
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    {ENTERPRISE_ROLES.map(r => (
                      <option key={r.role} value={r.role}>{r.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    القسم / الإدارة
                  </label>
                  <input
                    type="text"
                    value={userFormData.department}
                    onChange={e => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كود الموظف
                  </label>
                  <input
                    type="text"
                    value={userFormData.employeeCode}
                    onChange={e => setUserFormData({ ...userFormData, employeeCode: e.target.value })}
                    placeholder="EMP-015"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })}
                    placeholder="01012345678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الحساب
                  </label>
                  <select
                    value={userFormData.status}
                    onChange={e => setUserFormData({ ...userFormData, status: e.target.value as UserAccountStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    <option value="active">نشط (Active)</option>
                    <option value="inactive">معطل (Inactive)</option>
                    <option value="suspended">موقوف (Suspended)</option>
                  </select>
                </div>
              </div>

              {!editingUserId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور الافتراضية
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-purple-950/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-purple-950/50 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingUserId ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && passwordTargetUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#140a22] rounded-2xl border border-slate-200 dark:border-purple-900/60 shadow-2xl max-w-sm w-full p-6 relative">
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-purple-950/80">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  تغيير كلمة المرور
                </h3>
                <p className="text-xs text-slate-400">
                  للمستخدم: @{passwordTargetUser.username}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور جديدة"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/40 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSavePasswordReset}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  حفظ كلمة المرور
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
