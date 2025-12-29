import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shirt, Lock, Key, ChevronLeft } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setErrorMsg('');

    try {
      // Check password against 'app_config' table
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'admin_password')
        .single();

      if (error) {
         // If table doesn't exist (42P01), treat as setup error
         if (error.code === '42P01') {
            throw new Error('قاعدة البيانات غير مهيئة. يرجى تهيئة النظام أولاً.');
         }
         throw error;
      }

      if (data && data.value === password) {
         onLoginSuccess();
      } else {
         setErrorMsg('كلمة المرور غير صحيحة');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]"></div>

      <div className="bg-[#1e1e1e] border border-gray-800 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md relative z-10 flex flex-col items-center text-center">
        
        <div className="bg-primary/20 p-4 rounded-full mb-6">
          <Shirt className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">نواعم بوتيك</h1>
        <p className="text-gray-400 text-sm mb-8 tracking-widest uppercase">نظام إدارة المبيعات والمخزون</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="relative">
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full bg-[#121212] border border-gray-700 rounded-xl px-10 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-600 text-center text-lg tracking-widest"
                autoFocus
            />
            <Lock className="absolute right-4 top-4.5 text-gray-600 w-5 h-5" />
          </div>

          {errorMsg && (
             <div className="text-red-500 text-sm bg-red-500/10 py-2 rounded-lg animate-pulse">
                {errorMsg}
             </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ChevronLeft className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800 w-full">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Key className="w-3 h-3" />
            <span>تسجيل الدخول مقيد بالرمز السري فقط</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-center text-gray-600 text-xs">
        &copy; {new Date().getFullYear()} Nawaem Boutique POS System
      </div>
    </div>
  );
};

export default Login;