import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
  userName?: string;
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userName, onNavigate }) => {
  const [stats, setStats] = useState({
    pending: 0,
    verifiedToday: 0,
    rejected: 0,
    totalNGOs: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all NGO profiles
      const { data: ngos, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'NGO');

      if (error) throw error;

      if (ngos) {
        const pending = ngos.filter(n => n.verification_status === 'PENDING').length;
        const verified = ngos.filter(n => n.verification_status === 'VERIFIED').length;
        const rejected = ngos.filter(n => n.verification_status === 'REJECTED').length;

        // Mocking "today" stats for UI feel if database timestamps are old
        const today = new Date().toISOString().split('T')[0];
        const verifiedToday = ngos.filter(n => n.verification_status === 'VERIFIED' && n.updated_at?.includes(today)).length;

        setStats({
          pending,
          verifiedToday: verifiedToday || verified, // Fallback to total for demo
          rejected,
          totalNGOs: ngos.length
        });

        // Filter and sort for the table (unverified/pending first)
        const sorted = [...ngos].sort((a, b) => {
          if (a.verification_status === 'PENDING') return -1;
          if (b.verification_status === 'PENDING') return 1;
          return 0;
        });
        setRecentRequests(sorted.slice(0, 10));
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'APPROVED' })
        .eq('id', id);

      if (error) throw error;

      // Notify the NGO
      await supabase.from('notifications').insert({
        user_id: id,
        type: 'request',
        title: 'Profile Approved!',
        description: 'Your NGO verification is complete. Please proceed to make the activation payment to unlock all features.',
        link: 'ngo-dashboard'
      });

      setNotification({ show: true, type: 'success', message: 'NGO approved! They can now proceed to payment.' });
      fetchDashboardData();
      setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
    } catch (err: any) {
      setNotification({ show: true, type: 'error', message: err.message || 'Failed to approve NGO' });
      setTimeout(() => setNotification({ show: false, type: 'error', message: '' }), 3000);
    }
  };

  const filteredRequests = recentRequests.filter(r =>
    r.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md`}>
          <span className="material-symbols-outlined text-2xl">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
          <p className="font-bold text-sm flex-1">{notification.message}</p>
          <button onClick={() => setNotification({ show: false, type: 'success', message: '' })} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-brand-text dark:text-white tracking-tight">System Overview</h2>
          <p className="text-brand-muted dark:text-gray-400 text-[10px] md:text-sm lg:text-base font-medium uppercase tracking-wider">Monitor onboarding velocity and ecosystem health.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
          <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-nowrap">Pending Apps</span>
                <span className="bg-amber-100 text-amber-700 p-1.5 rounded-lg material-symbols-outlined text-[18px]">pending_actions</span>
              </div>
              <p className="text-3xl font-black mt-2">{stats.pending}</p>
              <button onClick={() => onNavigate('admin-verification')} className="text-[10px] text-primary font-black uppercase mt-1 hover:underline text-left">Review Now →</button>
            </div>
          </div>
          <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-nowrap">Total NGOs</span>
                <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg material-symbols-outlined text-[18px]">groups</span>
              </div>
              <p className="text-3xl font-black mt-2">{stats.totalNGOs}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Partners registered</p>
            </div>
          </div>
          <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-nowrap">Revenue</span>
                <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg material-symbols-outlined text-[18px]">payments</span>
              </div>
              <p className="text-3xl font-black mt-2">₹{(stats.totalNGOs * 499).toLocaleString()}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Platform Fees</p>
            </div>
          </div>
          <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-nowrap">Rejected</span>
                <span className="bg-red-100 text-red-600 p-1.5 rounded-lg material-symbols-outlined text-[18px]">block</span>
              </div>
              <p className="text-3xl font-black mt-2">{stats.rejected}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Non-compliant</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-brand-surface-dark rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-xl font-black">Recent NGO Activities</h3>
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-sm">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-brand-dark text-xs focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search by NGO name..."
                type="text"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-brand-dark border-b border-gray-100 dark:border-slate-800 text-[9px] md:text-[10px] uppercase font-black tracking-[0.1em] text-slate-400">
                  <th className="px-4 md:px-6 py-3 md:py-4">NGO Identity</th>
                  <th className="px-4 md:px-6 py-3 md:py-4">Location</th>
                  <th className="px-4 md:px-6 py-3 md:py-4">Payment</th>
                  <th className="px-4 md:px-6 py-3 md:py-4">Status</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-400">Syncing with database...</td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-400">No matching NGOs found.</td>
                  </tr>
                ) : filteredRequests.map((ngo) => (
                  <tr key={ngo.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs shrink-0">
                          {ngo.organization_name ? ngo.organization_name[0] : '?'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate max-w-[150px]">{ngo.organization_name || 'Incomplete Profile'}</span>
                          <span className="text-[9px] text-slate-400 font-mono">ID: #{ngo.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs font-medium text-slate-500 max-w-[120px] truncate">
                      {ngo.location || 'Not Set'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${ngo.payment_status === 'PAID' ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {ngo.payment_status === 'PAID' ? 'Verified Paid' : 'Unpaid Entry'}
                        </span>
                        {ngo.payment_status === 'PAID' && <span className="text-[9px] text-slate-400">$50.00 Received</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ngo.verification_status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        ngo.verification_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          ngo.verification_status === 'APPROVED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {ngo.verification_status === 'PENDING' && <span className="size-1 bg-amber-500 rounded-full animate-pulse"></span>}
                        {ngo.verification_status || 'UNVERIFIED'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {ngo.verification_status === 'PENDING' && (
                          <button
                            onClick={() => handleQuickApprove(ngo.id)}
                            className="px-3 py-1.5 bg-primary text-primary-deep text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:shadow-md transition-all"
                          >
                            Quick Approve
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('admin-verification')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-text dark:hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
