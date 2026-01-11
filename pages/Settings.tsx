
import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in">
      <div>
        <h2 className="text-4xl font-black text-brand-text dark:text-white tracking-tight">Platform Settings</h2>
        <p className="text-brand-muted dark:text-gray-400 mt-2 text-lg">Manage your account preferences and security.</p>
      </div>

      <div className="bg-white dark:bg-brand-surface-dark rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl divide-y divide-gray-50 dark:divide-white/5">
        <div className="p-10 flex items-center justify-between">
          <div className="flex gap-6 items-center">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">notifications_active</span>
            </div>
            <div>
              <h4 className="font-black text-xl mb-1">Push Notifications</h4>
              <p className="text-sm text-brand-muted">Receive alerts for new messages and donation status updates.</p>
            </div>
          </div>
          <button 
            onClick={() => setNotifications(!notifications)}
            className={`w-14 h-8 rounded-full transition-all relative ${notifications ? 'bg-primary' : 'bg-gray-200 dark:bg-brand-dark'}`}
          >
            <div className={`absolute top-1 size-6 rounded-full bg-white shadow-sm transition-all ${notifications ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="p-10 flex items-center justify-between">
          <div className="flex gap-6 items-center">
            <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">dark_mode</span>
            </div>
            <div>
              <h4 className="font-black text-xl mb-1">Appearance</h4>
              <p className="text-sm text-brand-muted">Switch between light and dark theme modes.</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`w-14 h-8 rounded-full transition-all relative ${darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-brand-dark'}`}
          >
            <div className={`absolute top-1 size-6 rounded-full bg-white shadow-sm transition-all ${darkMode ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="p-10 flex items-center justify-between">
          <div className="flex gap-6 items-center">
            <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h4 className="font-black text-xl mb-1">Security & Privacy</h4>
              <p className="text-sm text-brand-muted">Manage password, two-factor authentication, and data.</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-gray-100 dark:bg-brand-dark rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">Configure</button>
        </div>

        <div className="p-10 flex items-center justify-between">
          <div className="flex gap-6 items-center">
            <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <div>
              <h4 className="font-black text-xl text-red-500 mb-1">Delete Account</h4>
              <p className="text-sm text-brand-muted">Permanently remove your data from HopeCycle.</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all">Deactivate</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
