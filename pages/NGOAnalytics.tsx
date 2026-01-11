import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface CategoryStat {
   label: string;
   value: string;
   count: number;
   color: string;
}

const NGOAnalytics: React.FC = () => {
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
      totalClaims: 0,
      livesImpacted: 0,
      donationRate: 0,
      uniqueDonors: 0
   });
   const [categories, setCategories] = useState<CategoryStat[]>([]);
   const [monthlyData, setMonthlyData] = useState<number[]>([]);

   useEffect(() => {
      fetchAnalytics();
   }, []);

   const fetchAnalytics = async () => {
      setLoading(true);
      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         // 1. Fetch all donations handled by this NGO
         const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .eq('ngo_id', user.id);

         if (error) throw error;

         if (donations && donations.length > 0) {
            const completed = donations.filter(d => d.status === 'COMPLETED');

            // Stats Calculation
            const totalClaims = donations.length;
            const totalCompleted = completed.length;
            const livesImpacted = totalCompleted * 3; // Est. 3 beneficiaries per item
            const donationRate = Math.round((totalCompleted / totalClaims) * 100);
            const uniqueDonors = new Set(donations.map(d => d.donor_id)).size;

            setStats({
               totalClaims,
               livesImpacted,
               donationRate,
               uniqueDonors
            });

            // 2. Category Distribution
            const catMap: Record<string, number> = {};
            completed.forEach(d => {
               catMap[d.category] = (catMap[d.category] || 0) + 1;
            });

            const colors = ['bg-primary', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-slate-300'];
            const sortedCats = Object.entries(catMap)
               .sort((a, b) => b[1] - a[1])
               .map(([label, count], i) => ({
                  label,
                  count,
                  value: `${Math.round((count / (totalCompleted || 1)) * 100)}%`,
                  color: colors[i % colors.length]
               }));

            setCategories(sortedCats);

            // 3. Last 6 Months Distribution (Claim Trends)
            const months = new Array(6).fill(0);
            const now = new Date();
            donations.forEach(d => {
               const dDate = new Date(d.created_at);
               const monthDiff = (now.getMonth() - dDate.getMonth()) + (12 * (now.getFullYear() - dDate.getFullYear()));
               if (monthDiff >= 0 && monthDiff < 6) {
                  months[5 - monthDiff]++;
               }
            });

            // Normalize for chart (0-100)
            const max = Math.max(...months, 1);
            setMonthlyData(months.map(m => (m / max) * 100));
         } else {
            setMonthlyData([30, 45, 20, 60, 40, 50]); // Placeholder trend
         }

      } catch (err) {
         console.error('Error fetching analytics:', err);
      } finally {
         setLoading(false);
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
         </div>
      );
   }

   return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 overflow-x-hidden">
         <div className="px-1">
            <h2 className="text-3xl md:text-4xl font-black text-brand-text dark:text-white tracking-tight">Impact Analytics</h2>
            <p className="text-sm md:text-base text-brand-muted dark:text-gray-400 mt-1">Quantifying your contribution and donor engagement.</p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-primary-deep p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 size-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/10 transition-all duration-500"></div>
               <h3 className="text-[10px] md:text-sm font-bold text-primary mb-2 uppercase tracking-widest">Lives Impacted</h3>
               <p className="text-3xl md:text-4xl font-black mb-1">{stats.livesImpacted.toLocaleString()}</p>
               <p className="text-[10px] md:text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Direct beneficiaries reached
               </p>
            </div>
            <div className="bg-white dark:bg-brand-surface-dark p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative group">
               <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-all duration-500"></div>
               <h3 className="text-[10px] md:text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Donor Network</h3>
               <p className="text-3xl md:text-4xl font-black mb-1">{stats.uniqueDonors}</p>
               <p className="text-[10px] md:text-xs font-medium text-blue-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">handshake</span>
                  Unique individuals engaged
               </p>
            </div>
            <div className="bg-white dark:bg-brand-surface-dark p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative group sm:col-span-2 lg:col-span-1">
               <div className="absolute top-0 right-0 size-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-all duration-500"></div>
               <h3 className="text-[10px] md:text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Efficiency</h3>
               <p className="text-3xl md:text-4xl font-black mb-1">{stats.donationRate}%</p>
               <p className="text-[10px] md:text-xs font-medium text-emerald-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Collection fulfillment rate
               </p>
            </div>
         </div>

         <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8 bg-white dark:bg-brand-surface-dark p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12">
                  <div>
                     <h3 className="text-lg md:text-xl font-black text-brand-text dark:text-white">Resource Claim Trend</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Growth in monthly resource recovery</p>
                  </div>
                  <div className="w-fit px-4 py-2 bg-gray-50 dark:bg-brand-dark rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-muted border border-gray-100 dark:border-gray-800">
                     Active Operations
                  </div>
               </div>
               <div className="h-48 md:h-64 grid grid-cols-6 items-end gap-2 sm:gap-4 md:gap-6 px-2">
                  {monthlyData.map((h, i) => (
                     <div key={i} className="flex flex-col items-center gap-2 md:gap-4 group h-full">
                        <div className="w-full bg-gray-50 dark:bg-brand-dark/30 rounded-xl md:rounded-[1.5rem] relative overflow-hidden transition-all group-hover:bg-primary/10 h-full flex flex-col justify-end border border-transparent group-hover:border-primary/20">
                           <div
                              className="bg-primary rounded-t-lg md:rounded-t-[1rem] transition-all duration-1000 ease-out shadow-lg shadow-primary/20"
                              style={{ height: `${h}%`, opacity: h > 0 ? 1 : 0.1 }}
                           >
                              <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent"></div>
                           </div>
                        </div>
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">M {i + 1}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-4 bg-white dark:bg-brand-surface-dark p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl">
               <h3 className="text-lg md:text-xl font-black text-brand-text dark:text-white mb-6 md:mb-8">Service Category</h3>
               <div className="space-y-6 md:space-y-8">
                  {categories.length > 0 ? categories.slice(0, 5).map((cat) => (
                     <div key={cat.label} className="space-y-2 md:space-y-3">
                        <div className="flex justify-between items-end">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource</span>
                              <span className="text-xs md:text-sm font-black text-brand-text dark:text-white truncate max-w-[120px]">{cat.label}</span>
                           </div>
                           <span className="text-base md:text-lg font-black text-primary">{cat.value}</span>
                        </div>
                        <div className="h-2 md:h-3 w-full bg-gray-50 dark:bg-brand-dark rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                           <div
                              className={`h-full ${cat.color} rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.1)]`}
                              style={{ width: cat.value }}
                           ></div>
                        </div>
                     </div>
                  )) : (
                     <div className="py-12 md:py-20 text-center flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-4xl text-slate-200">monitoring</span>
                        <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Waiting for data...</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-brand-surface-dark p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-6">
               <div className="size-12 md:size-16 rounded-xl md:rounded-[1.5rem] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">workspace_premium</span>
               </div>
               <div>
                  <h4 className="text-lg md:text-xl font-black text-brand-text dark:text-white">Active Operational Stats</h4>
                  <p className="text-xs md:text-sm text-brand-muted font-medium">Your account is currently within the top 15% of high-response NGOs.</p>
               </div>
            </div>
            <button className="w-full md:w-fit px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl">
               Export Report
            </button>
         </div>
      </div>
   );
};

export default NGOAnalytics;
