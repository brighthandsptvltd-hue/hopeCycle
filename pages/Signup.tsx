import React, { useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/logo.png';

interface SignupProps {
  onSignup: (role: UserRole) => void;
  onNavigate: (page: string) => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onNavigate }) => {
  const [role, setRole] = useState<UserRole>('DONOR');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const data = await response.json();

        // Extract a readable location string
        const address = data.address;
        const locationName = address.suburb || address.neighbourhood || address.city_district || address.village || address.town || address.city || 'Unknown Location';
        const city = address.city || address.town || address.state || '';

        setLocation(`${locationName}${city ? ', ' + city : ''}`);
        setCoords({ lat: latitude, lng: longitude });
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Failed to get location name');
      } finally {
        setLocating(false);
      }
    }, (err) => {
      setLocating(false);
      setError(err.message);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            organization_name: role === 'NGO' ? organizationName : null,
            role: role,
            location: location,
            latitude: coords?.lat,
            longitude: coords?.lng,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        onSignup(role);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden min-h-screen bg-brand-background dark:bg-brand-dark transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none"></div>

      {/* Logo Section - Adjusted for mobile position */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 flex items-center gap-3 cursor-pointer z-20" onClick={() => onNavigate('landing')}>
        <div className="size-8 sm:size-10 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
          <img src={logo} alt="HopeCycle Logo" className="w-full h-full object-cover" />
        </div>
        <span className="text-lg sm:text-xl font-bold text-brand-text dark:text-white tracking-tight">HopeCycle</span>
      </div>

      <div className="absolute -left-20 top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -right-20 bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-lg mt-16 sm:mt-0">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand-text dark:text-white mb-2 sm:mb-3">Join our community</h1>
          <p className="text-brand-muted dark:text-gray-400 text-base sm:text-lg">Create an account to start making a difference.</p>
        </div>

        <div className="bg-white dark:bg-brand-surface-dark rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 p-8 w-full transition-colors duration-500">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-brand-text dark:text-slate-300 ml-1" htmlFor="roleSelection">I am registering as</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">person_check</span>
                </div>
                <select
                  id="roleSelection"
                  className="appearance-none w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="DONOR">Donor</option>
                  <option value="NGO">NGO</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-brand-text dark:text-slate-300 ml-1" htmlFor="fullName">
                Full Name <span className="text-slate-400 font-normal">(or Organization Name)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder={role === 'NGO' ? "Your Full Name" : "Jane Doe"}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {role === 'NGO' && (
              <div className="space-y-1.5 animate-in slide-in-from-top duration-300">
                <label className="text-sm font-medium text-brand-text dark:text-slate-300 ml-1" htmlFor="orgName">Organization Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                  </div>
                  <input
                    id="orgName"
                    type="text"
                    placeholder="E.g. Helping Hands Foundation"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-brand-text dark:text-slate-300 ml-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-brand-text dark:text-slate-300 ml-1" htmlFor="location">City / Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <input
                  id="location"
                  type="text"
                  placeholder="New York, NY"
                  className="w-full pl-10 pr-24 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locating}
                  className="absolute inset-y-1.5 right-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[16px] ${locating ? 'animate-spin' : ''}`}>
                    {locating ? 'sync' : 'my_location'}
                  </span>
                  {locating ? 'Locating...' : 'Current'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-text dark:text-slate-300 ml-1" htmlFor="password">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Min. 8 chars"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-text dark:text-slate-300 ml-1" htmlFor="confirmPassword">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" type="checkbox" required />
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  By creating an account, I agree to HopeCycle's <a className="text-primary hover:underline font-medium" href="#">Terms of Service</a> and <a className="text-primary hover:underline font-medium" href="#">Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button
              className="w-full py-3.5 px-4 bg-primary hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => onNavigate('login')} className="mt-4 text-xs font-bold text-primary hover:underline uppercase tracking-widest">
            Already have an account? Log In
          </button>

        </div>
      </div>
      <footer className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© 2026 HopeCycle Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Signup;
