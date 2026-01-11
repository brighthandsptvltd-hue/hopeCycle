import React, { useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/logo.png';

interface LoginProps {
  onLogin: (role: UserRole) => void;
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("🔐 [DEBUG] Attempting login for:", email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("❌ [DEBUG] Sign-in failed:", signInError.message);
        throw signInError;
      }

      if (data.user) {
        console.log("✅ [DEBUG] Auth successful, fetching profile role for ID:", data.user.id);
        // Fetch role from profile
        const { data: profile, error: roleError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (roleError) {
          console.error("❌ [DEBUG] Role fetch failed:", roleError.message);
        }

        const rawRole = profile?.role || data.user.user_metadata?.role || 'DONOR';
        const userRole = rawRole.toUpperCase() as UserRole;
        console.log("🎯 [DEBUG] Login derived role:", userRole);
        onLogin(userRole);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-white dark:bg-brand-dark overflow-hidden">
      {/* Left side: Premium Impact Section - Hidden on mobile */}
      <div className="hidden lg:flex relative lg:w-[60%] h-screen overflow-hidden">
        {/* Rich Gradient Background */}
        <div className="absolute inset-0 bg-[#0f0a28]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c47331]/20 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-deep/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Geometric Overlay */}
        <div className="absolute inset-0 geometric-blue-pattern opacity-[0.03]"></div>

        <div className="relative z-10 flex flex-col justify-between h-full p-8 lg:p-16">
          {/* Top Logo */}
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-3xl material-symbols-filled">eco</span>
            </div>
            <span className="text-3xl font-black text-white tracking-tight">HopeCycle</span>
          </div>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/80">
              <span className="material-symbols-outlined text-[20px] text-primary material-symbols-filled">monitoring</span>
              <span className="text-sm font-black uppercase tracking-[0.1em]">Impact Overview</span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-8 text-white tracking-tight">
              Connecting Donors <br />
              and NGOs for a <br />
              <span className="text-white/40 italic">Brighter Future.</span>
            </h2>

            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-lg mb-12">
              HopeCycle acts as a seamless intermediary, facilitating impactful donations globally. Join our network of over 12,000 active participants making a difference.
            </p>

            {/* Stats row exactly like the image */}
            <div className="flex flex-wrap gap-12 mt-auto">
              <div className="flex items-center gap-5 group">
                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <span className="material-symbols-outlined text-3xl material-symbols-filled">volunteer_activism</span>
                </div>
                <div>
                  <p className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1">Donations Facilitated:</p>
                  <p className="text-2xl font-black text-white">€1.5M+</p>
                </div>
              </div>
              <div className="flex items-center gap-5 group">
                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <span className="material-symbols-outlined text-3xl material-symbols-filled">groups</span>
                </div>
                <div>
                  <p className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1">NGOs Partnered:</p>
                  <p className="text-2xl font-black text-white">500+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-6 lg:p-16 bg-white dark:bg-[#0f172a]">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-brand-text dark:text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-brand-muted dark:text-gray-400 text-lg">
              Continue your mission with HopeCycle
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="email">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">alternate_email</span>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400" htmlFor="password">Password</label>
                <a className="text-[11px] font-black text-primary hover:text-primary-dark uppercase tracking-widest" href="#">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-brand-text dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="w-full flex justify-center items-center py-4 px-4 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 dark:text-gray-400">
            Don't have an account?
            <button onClick={() => onNavigate('signup')} className="ml-2 font-black text-primary hover:underline transition-all">Create Account</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
