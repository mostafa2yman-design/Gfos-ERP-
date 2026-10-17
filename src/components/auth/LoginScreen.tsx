import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROLE_LABELS } from '../../lib/usersStorage';
import {
  Factory,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, users } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showQuickFill, setShowQuickFill] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || 'فشل تسجيل الدخول، يرجى التأكد من البيانات');
      }
    }, 350);
  };

  const handleQuickFill = (uName: string, pWord: string) => {
    setUsername(uName);
    setPassword(pWord);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#0c0617] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative selection:bg-purple-600 selection:text-white transition-colors">
      {/* Top Bar with theme & branding */}
      <header className="p-4 sm:p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2C1151] border border-amber-500/40 flex items-center justify-center shadow-md">
            <Factory className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-slate-900 dark:text-white tracking-wider">GFOS ERP</span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">نظام إدارة وتشغيل مصانع الملابس الجاهزة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1a0e30] border border-slate-200 dark:border-purple-900/50 text-slate-700 dark:text-amber-400 shadow-2xs hover:bg-slate-50 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
            title={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Login Form Box (7 cols on desktop) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-xs font-bold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                <span>بوابة الدخول الآمنة الموحدة</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                تسجيل الدخول للنظام
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                أدخل اسم المستخدم وكلمة المرور الخاصة بحسابك في المصنع لمتابعة العمل
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in duration-200 text-right">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              {/* Username field */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المستخدم (Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="مثال: admin أو eng_hassan"
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 dark:bg-[#1b1031] border border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-xs font-bold transition-all"
                    autoFocus
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    كلمة المرور (Password)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="أدخل كلمة المرور"
                    className="w-full px-4 py-3 pr-10 pl-10 rounded-xl bg-slate-50 dark:bg-[#1b1031] border border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-xs font-bold transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-purple-900 bg-slate-50 dark:bg-[#1b1031]"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">تذكر تسجيل الدخول</span>
                </label>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                  نظام حماية داخلي (RBAC)
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#2C1151] hover:bg-[#3d1870] text-amber-300 font-black text-sm border border-amber-500/40 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>جاري التحقق والدخول...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>تسجيل الدخول للنظام</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick-Fill & System Credentials Guide (5 cols on desktop) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/80 rounded-3xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-purple-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    حسابات وكلمات المرور بالنظام
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">انقر على أي حساب لتعبئته وتجربته فوراً</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQuickFill(!showQuickFill)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title={showQuickFill ? "طي القائمة" : "فتح القائمة"}
              >
                {showQuickFill ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showQuickFill && (
              <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {users.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.custom;
                  const isCurrentFilled = username.toLowerCase() === u.username.toLowerCase();

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickFill(u.username, u.password || '123')}
                      className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                        isCurrentFilled
                          ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/60 shadow-xs ring-1 ring-purple-400'
                          : 'border-slate-200 dark:border-purple-950/40 bg-slate-50/70 dark:bg-[#1b1031] hover:border-purple-300 dark:hover:border-purple-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#2C1151] border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {u.fullName}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {roleMeta.title}
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-purple-900/50 text-slate-700 dark:text-amber-300 font-bold block mb-0.5">
                          @{u.username}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          سر: {u.password || '123'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 text-center border-t border-slate-100 dark:border-purple-950/60">
              💡 يمكنك أيضاً إضافة مستخدمين جدد وتغيير كلمات السر من شاشة <strong>المستخدمين والصلاحيات (RBAC)</strong> بعد الدخول.
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-purple-950/40 z-10">
        <span>جميع الحقوق محفوظة © {new Date().getFullYear()} — نظام GFOS ERP لإدارة مصانع الملابس الجاهزة</span>
      </footer>
    </div>
  );
};
