import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface Donation {
   id: string;
   title: string;
   category: string;
   status: string;
   image_url: string;
   created_at: string;
   donor_id: string;
   ngo_id: string | null;
   donor_profile: {
      full_name: string;
   } | null;
   ngo_profile: {
      organization_name: string;
   } | null;
}

const AdminDonations: React.FC = () => {
   const [donations, setDonations] = useState<Donation[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');

   useEffect(() => {
      fetchDonations();
   }, [activeTab]);

   const fetchDonations = async () => {
      setLoading(true);
      try {
         let query = supabase
            .from('donations')
            .select(`
          *,
          donor_profile:profiles!donor_id(full_name),
          ngo_profile:profiles!ngo_id(organization_name)
        `)
            .order('created_at', { ascending: false });

         if (activeTab === 'Active') {
            query = query.in('status', ['ACTIVE', 'PENDING']);
         } else {
            query = query.in('status', ['COMPLETED', 'CANCELLED']);
         }

         const { data, error } = await query;

         if (error) throw error;
         setDonations(data || []);
      } catch (err) {
         console.error('Error fetching donations:', err);
      } finally {
         setLoading(false);
      }
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'ACTIVE': return 'bg-emerald-50 text-emerald-600';
         case 'PENDING': return 'bg-blue-50 text-blue-600';
         case 'COMPLETED': return 'bg-gray-100 text-gray-600';
         case 'CANCELLED': return 'bg-red-50 text-red-600';
         default: return 'bg-slate-50 text-slate-600';
      }
   };

   return (
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 overflow-x-hidden">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
            <div>
               <h2 className="text-2xl md:text-4xl font-black text-brand-text dark:text-white tracking-tight">Global Donations Feed</h2>
               <p className="text-brand-muted dark:text-gray-400 mt-1 md:mt-2 text-xs md:text-lg font-medium">Monitoring real-time transactions and resource allocation.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-brand-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-brand-muted shadow-sm">
               <span className="material-symbols-outlined text-xs sm:text-sm">analytics</span>
               Total: {donations.length} items
            </div>
         </div>

         <div className="bg-white dark:bg-brand-surface-dark rounded-2xl md:rounded-[3rem] border border-gray-50 dark:border-gray-800 shadow-2xl overflow-hidden mx-1">
            <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[700px]">
                  <thead>
                     <tr className="bg-gray-50 dark:bg-brand-dark/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-50 dark:border-white/5">
                        <th className="px-6 md:px-10 py-4 md:py-8">Listing</th>
                        <th className="px-6 md:px-10 py-4 md:py-8">Participants</th>
                        <th className="px-6 md:px-10 py-4 md:py-8">Status</th>
                        <th className="px-6 md:px-10 py-4 md:py-8">Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                     {loading ? (
                        Array(5).fill(0).map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={4} className="px-10 py-8">
                                 <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-2xl w-full"></div>
                              </td>
                           </tr>
                        ))
                     ) : donations.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="px-10 py-20 text-center">
                              <span className="material-symbols-outlined text-4xl text-slate-200 mb-4 block">inventory_2</span>
                              <p className="text-brand-muted font-bold uppercase tracking-widest text-xs">No records found</p>
                           </td>
                        </tr>
                     ) : donations.map(item => (
                        <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                           <td className="px-4 md:px-10 py-3 md:py-6">
                              <div className="flex items-center gap-4">
                                 <div className="size-14 rounded-2xl bg-gray-100 dark:bg-brand-dark overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                                    {item.image_url ? (
                                       <img src={item.image_url} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                    ) : (
                                       <div className="size-full flex items-center justify-center text-slate-300">
                                          <span className="material-symbols-outlined">image</span>
                                       </div>
                                    )}
                                 </div>
                                 <div>
                                    <p className="font-black text-brand-text dark:text-white text-base">{item.title}</p>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">{item.category}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 md:px-10 py-4 md:py-6">
                              <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                    <span className="text-sm font-bold text-brand-text dark:text-white">{item.donor_profile?.full_name || 'System User'}</span>
                                 </div>
                                 {item.ngo_profile && (
                                    <div className="flex items-center gap-2">
                                       <span className="material-symbols-outlined text-sm text-primary">volunteer_activism</span>
                                       <span className="text-[10px] text-primary font-black uppercase tracking-widest">{item.ngo_profile.organization_name}</span>
                                    </div>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 md:px-10 py-4 md:py-6">
                              <span className={`px-4 py-1.5 ${getStatusColor(item.status)} text-[10px] font-black uppercase tracking-widest rounded-xl`}>
                                 {item.status}
                              </span>
                           </td>
                           <td className="px-6 md:px-10 py-4 md:py-6">
                              <span className="text-xs font-bold text-slate-500">
                                 {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

export default AdminDonations;
