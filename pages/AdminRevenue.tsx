import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AdminRevenue: React.FC = () => {
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'Equity' | 'Forecasting' | 'Users'>('Equity');
   const [stats, setStats] = useState({
      totalRevenue: 0,
      activeSubscribers: 0,
      pendingPayments: 0,
      totalUsers: 0,
      growthRate: 0
   });
   const [users, setUsers] = useState<any[]>([]);
   const [revenueHistory, setRevenueHistory] = useState<{ label: string, value: number }[]>([]);
   const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

   useEffect(() => {
      fetchData();
   }, [activeTab]);

   const fetchData = async () => {
      setLoading(true);
      try {
         // 1. Fetch Profiles for Stats & User List
         const { data: allProfiles, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

         if (pError) throw pError;

         const ngos = allProfiles.filter(p => p.role === 'NGO');
         const paidNGOs = ngos.filter(n => n.payment_status === 'PAID');
         const activeSubscribers = paidNGOs.length;
         const totalRevenue = activeSubscribers * 499;
         const pendingPayments = ngos.filter(n => n.verification_status === 'APPROVED' && (!n.payment_status || n.payment_status === 'UNPAID')).length;

         // Calculate Growth Rate (Simple demo: compared to total NGOs)
         const growthRate = ngos.length > 0 ? Math.round((paidNGOs.length / ngos.length) * 100) : 0;

         setStats({
            totalRevenue,
            activeSubscribers,
            pendingPayments,
            totalUsers: allProfiles.length,
            growthRate
         });

         setUsers(allProfiles);

         // 2. Revenue History Graph Logic
         const now = new Date();
         const months = [];
         for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
               label: d.toLocaleDateString(undefined, { month: 'short' }),
               count: 0
            });
         }

         paidNGOs.forEach(n => {
            const dDate = new Date(n.updated_at || n.created_at);
            const monthDiff = (now.getMonth() - dDate.getMonth()) + (12 * (now.getFullYear() - dDate.getFullYear()));
            if (monthDiff >= 0 && monthDiff < 6) {
               months[5 - monthDiff].count++;
            }
         });

         // Cumulative for Revenue
         let runningTotal = paidNGOs.length - months.reduce((a, b) => a + b.count, 0);
         const history = months.map(m => {
            runningTotal += m.count;
            return { label: m.label, value: runningTotal };
         });

         const max = Math.max(...history.map(h => h.value), 1);
         setRevenueHistory(history.map(h => ({ label: h.label, value: (h.value / max) * 100 })));

      } catch (err) {
         console.error("Data fetch error:", err);
      } finally {
         setLoading(false);
      }
   };

   const handleRemoveUser = async (userId: string, role: string) => {
      if (role !== 'DONOR') {
         setNotification({ show: true, type: 'error', message: 'Admin can only remove Donors.' });
         setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
         return;
      }

      if (!confirm('Are you sure you want to remove this donor? This will delete all their data.')) return;

      try {
         // Note: Deleting from profiles might cascade depending on DB setup, 
         // but in a real app you'd typically delete the auth user or mark as inactive.
         // Since we don't have a direct edge function to delete auth user, we delete the profile.
         const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

         if (error) throw error;

         setUsers(prev => prev.filter(u => u.id !== userId));
         setNotification({ show: true, type: 'success', message: 'Donor removed successfully.' });
      } catch (err: any) {
         setNotification({ show: true, type: 'error', message: err.message });
      } finally {
         setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
      }
   };

   const runAnalysis = () => {
      setNotification({ show: true, type: 'success', message: 'Deep analysis triggered. Recalculating forecasting models...' });
      setTimeout(() => {
         fetchData();
         setNotification({ show: true, type: 'success', message: 'Analysis complete. Models updated.' });
      }, 1500);
      setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 4000);
   };

   if (loading && users.length === 0) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
         </div>
      );
   }

   return (
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-12 overflow-x-hidden">
         {notification.show && (
            <div className={`fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md`}>
               <span className="material-symbols-outlined text-2xl">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
               <p className="font-bold text-sm flex-1">{notification.message}</p>
               <button onClick={() => setNotification({ show: false, type: 'success', message: '' })} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
               </button>
            </div>
         )}

         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 px-1">
            <div>
               <h2 className="text-2xl md:text-4xl font-black text-brand-text dark:text-white tracking-tight">Ecosystem Sustainability</h2>
               <p className="text-brand-muted dark:text-gray-400 mt-1 md:mt-2 text-xs md:text-lg font-medium">Monitoring revenue, users, and platform growth velocity.</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
               <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5 md:mb-1">Growth Forecast</p>
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-xs md:text-sm">rocket_launch</span>
                  <span className="text-xs md:text-sm font-black text-emerald-700">+{stats.growthRate}% Efficiency</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
            <div className="bg-primary-deep p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 size-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/10 transition-all duration-500"></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Total Revenue</p>
               <h3 className="text-3xl font-black">₹{stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white dark:bg-brand-surface-dark p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl relative group">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Verified NGOs</p>
               <h3 className="text-3xl font-black text-brand-text dark:text-white">{stats.activeSubscribers}</h3>
            </div>
            <div className="bg-white dark:bg-brand-surface-dark p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl relative group">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pipeline</p>
               <h3 className="text-3xl font-black text-brand-text dark:text-white">₹{(stats.pendingPayments * 499).toLocaleString()}</h3>
            </div>
            <div className="bg-white dark:bg-brand-surface-dark p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl relative group">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-nowrap">Total Users</p>
               <h3 className="text-3xl font-black text-brand-text dark:text-white">{stats.totalUsers}</h3>
            </div>
         </div>

         <div className="flex bg-gray-100 dark:bg-brand-dark p-2 rounded-3xl gap-1.5 md:gap-2 w-full max-w-full overflow-x-auto no-scrollbar shrink-0">
            {['Equity', 'Forecasting', 'Users'].map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 md:px-8 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-brand-surface-dark text-brand-text dark:text-white shadow-xl' : 'text-slate-400 hover:text-brand-text'}`}
               >
                  {tab}
               </button>
            ))}
         </div>

         {activeTab === 'Equity' && (
            <div className="bg-white dark:bg-brand-surface-dark p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
               <div className="flex items-center justify-between mb-8 md:mb-16">
                  <div>
                     <h3 className="text-xl md:text-2xl font-black text-brand-text dark:text-white">Revenue Growth Curve</h3>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Historical platform expansion performance</p>
                  </div>
               </div>
               <div className="h-72 flex items-end justify-between gap-2 md:gap-8 px-1 md:px-6">
                  {revenueHistory.map((h, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-4 md:gap-6 group h-full min-w-0">
                        <div className="w-full bg-gray-50 dark:bg-brand-dark/50 rounded-xl md:rounded-2xl relative overflow-hidden transition-all group-hover:bg-primary/10 h-full flex flex-col justify-end">
                           <div
                              className="bg-primary/80 w-full rounded-t-xl transition-all duration-1000 ease-out group-hover:bg-primary shadow-lg shadow-primary/20"
                              style={{ height: `${h.value}%` }}
                           >
                              <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent"></div>
                           </div>
                        </div>
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight md:tracking-widest whitespace-nowrap">{h.label}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {activeTab === 'Forecasting' && (
            <div className="bg-white dark:bg-brand-surface-dark p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-500">
               <div className="flex items-center justify-between mb-8 md:mb-16">
                  <div>
                     <h3 className="text-xl md:text-2xl font-black text-brand-text dark:text-white">Predictive Analysis</h3>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Estimated growth based on current registration velocity</p>
                  </div>
               </div>
               <div className="grid md:grid-cols-2 gap-6 md:gap-12">
                  <div className="space-y-8">
                     <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Projected 3-Month Revenue</p>
                        <h4 className="text-4xl font-black text-brand-text dark:text-white">₹{((stats.totalRevenue + (stats.pendingPayments * 499)) * 1.5).toFixed(0)}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-4 leading-relaxed line-clamp-2">Based on current NGO approval rates and pending pipeline conversions.</p>
                     </div>
                     <div className="p-6 bg-emerald-50 content-dark rounded-3xl border border-emerald-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4">Sustainability Milestone</p>
                        <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden mb-4">
                           <div className="h-full bg-emerald-500 w-[65%]"></div>
                        </div>
                        <p className="text-xs font-bold text-emerald-700">65% of Q1 Acquisition Goal reached</p>
                     </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-brand-dark rounded-3xl p-8 flex flex-col justify-center text-center">
                     <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">auto_graph</span>
                     <h4 className="text-lg font-black text-brand-text dark:text-white mb-2">Dynamic Projections</h4>
                     <p className="text-sm text-brand-muted font-medium">Platform efficiency is currently {stats.growthRate}% relative to onboarded partners.</p>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'Users' && (
            <div className="bg-white dark:bg-brand-surface-dark rounded-3xl md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
               <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-xl md:text-2xl font-black">User Management</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin oversight of platform participants</p>
               </div>
               <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left">
                     <thead className="sticky top-0 bg-gray-50 dark:bg-brand-dark z-10 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                           <th className="px-6 md:px-10 py-4 md:py-6">User Identity</th>
                           <th className="px-6 md:px-10 py-4 md:py-6">Role</th>
                           <th className="px-6 md:px-10 py-4 md:py-6">Registered</th>
                           <th className="px-6 md:px-10 py-4 md:py-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {users.map((u) => (
                           <tr key={u.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 md:px-10 py-4 md:py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="size-8 md:size-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                                       {u.full_name ? u.full_name[0] : (u.organization_name ? u.organization_name[0] : '?')}
                                    </div>
                                    <div className="min-w-0">
                                       <p className="text-xs md:text-sm font-black text-brand-text dark:text-white truncate max-w-[150px]">{u.organization_name || u.full_name}</p>
                                       <p className="text-[9px] text-slate-400 font-mono tracking-tighter truncate max-w-[100px]">{u.id}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 md:px-10 py-4 md:py-6">
                                 <span className={`px-2 md:px-3 py-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg ${u.role === 'DONOR' ? 'bg-blue-50 text-blue-600' : u.role === 'NGO' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-text text-white'}`}>
                                    {u.role}
                                 </span>
                              </td>
                              <td className="px-6 md:px-10 py-4 md:py-6">
                                 <span className="text-[10px] md:text-xs font-bold text-slate-500">{new Date(u.created_at).toLocaleDateString()}</span>
                              </td>
                              <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                                 {u.role === 'DONOR' ? (
                                    <button
                                       onClick={() => handleRemoveUser(u.id, u.role)}
                                       className="size-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                                       title="Remove Donor"
                                    >
                                       <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                 ) : (
                                    <span className="text-[10px] font-black text-slate-300 uppercase italic">Protected</span>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         <div className="p-8 bg-brand-text dark:bg-white rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
            <div className="flex items-center gap-6 relative z-10">
               <div className="size-16 rounded-2xl bg-white/10 dark:bg-brand-text/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">insights</span>
               </div>
               <div>
                  <h4 className="text-xl font-black text-white dark:text-brand-text">Optimize Intelligence</h4>
                  <p className="text-white/60 dark:text-brand-text/60 text-sm font-medium">Recalculate platform velocity and forecasting with latest onboarding data.</p>
               </div>
            </div>
            <button
               onClick={runAnalysis}
               className="px-10 py-5 bg-primary text-primary-deep font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 relative z-10"
            >
               Run Analysis
            </button>
         </div>
      </div>
   );
};

export default AdminRevenue;
