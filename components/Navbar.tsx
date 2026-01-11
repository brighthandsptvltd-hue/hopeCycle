import React, { useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import fullLogo from '../assets/Full Logo.png';

interface NavbarProps {
  isLoggedIn: boolean;
  role: UserRole;
  onSetRole: (role: UserRole) => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onToggleMobileMenu?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, role, onSetRole, onNavigate, currentPage, onToggleMobileMenu }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('navbar_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnread();
      })
      .subscribe();

    const handleLocalRead = () => fetchUnread();
    window.addEventListener('notificationsRead', handleLocalRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('notificationsRead', handleLocalRead);
    };
  }, [isLoggedIn]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-brand-surface-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 lg:px-10 py-3 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isLoggedIn && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-brand-muted hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          )}
          <div
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => {
              if (isLoggedIn) {
                onNavigate(role === 'DONOR' ? 'donor-dashboard' : role === 'NGO' ? 'ngo-dashboard' : 'admin-dashboard');
              } else {
                onNavigate('landing');
              }
            }}
          >
            <img src={fullLogo} alt="HopeCycle Logo" className="h-7 sm:h-10 w-auto group-hover:opacity-80 transition-opacity" />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {!isLoggedIn && currentPage === 'landing' && (
            <>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-brand-muted hover:text-primary transition-colors"
              >
                How it Works
              </button>
              <button
                onClick={() => document.getElementById('browse-ngos')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-brand-muted hover:text-primary transition-colors"
              >
                Browse NGOs
              </button>
              <button
                onClick={() => document.getElementById('impact')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-brand-muted hover:text-primary transition-colors"
              >
                Impact
              </button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <div className="flex items-center gap-6">
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
              <button
                onClick={() => onNavigate('login')}
                className="text-sm font-bold text-brand-muted hover:text-primary transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-full text-white bg-primary hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
              >
                Start Donating
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('notifications')}
                className="p-2 text-brand-muted hover:text-primary transition-colors relative bg-gray-50 dark:bg-white/5 rounded-xl group"
              >
                <span className={`material-symbols-outlined text-[22px] ${unreadCount > 0 ? 'animate-bounce' : ''}`}>notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 bg-primary text-primary-deep text-[10px] font-black rounded-full border-2 border-white dark:border-brand-surface-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="size-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-primary transition-all overflow-hidden"
                >
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`} className="w-full h-full object-cover" alt="User Avatar" />
                </div>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-brand-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => {
                          onNavigate(role === 'DONOR' ? 'donor-dashboard' : role === 'NGO' ? 'ngo-dashboard' : 'admin-dashboard');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-brand-muted hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                      >
                        <span className="material-symbols-outlined text-xl">dashboard</span> Dashboard
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-brand-muted hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                      >
                        <span className="material-symbols-outlined text-xl">settings</span> Profile
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;