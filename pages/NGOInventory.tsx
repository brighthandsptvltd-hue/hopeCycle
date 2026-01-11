import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface NGOInventoryProps {
  onNavigate?: (page: string, params?: any) => void;
}

const NGOInventory: React.FC<NGOInventoryProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    requests: 0,
    inTransit: 0,
    collected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: requestsData, error } = await supabase
        .from('donation_interests')
        .select(`
                *,
                donations (
                    *,
                    profiles:donor_id (full_name)
                )
            `)
        .eq('ngo_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems = (requestsData || []).map((r: any) => ({
        id: r.donations?.id, // Use the donation ID for navigation
        interestId: r.id,
        title: r.donations?.title,
        category: r.donations?.category,
        imageUrl: r.donations?.image_urls?.[0],
        donorName: r.donations?.profiles?.full_name || 'Anonymous',
        location: r.donations?.pickup_address || 'Private Location',
        status: r.donations?.status === 'COMPLETED' ? 'COMPLETED' : r.status,
        donationStatus: r.donations?.status
      }));

      setItems(formattedItems);

      setStats({
        requests: formattedItems.filter((i: any) => i.status === 'PENDING').length,
        inTransit: formattedItems.filter((i: any) => i.status === 'ACCEPTED').length,
        collected: formattedItems.filter((i: any) => i.status === 'COMPLETED').length
      });

    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-brand-text dark:text-white tracking-tight">Resource Inventory</h2>
          <p className="text-[10px] md:text-sm text-brand-muted dark:text-gray-400 mt-1 uppercase tracking-wider font-bold">Manage items from collection to community distribution.</p>
        </div>
        <button className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-deep font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2" onClick={fetchInventory}>
          <span className="material-symbols-outlined text-xl">refresh</span> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6 px-1">
        {[
          { label: 'Pending', value: stats.requests, icon: 'pending', color: 'text-amber-500' },
          { label: 'In Transit', value: stats.inTransit, icon: 'local_shipping', color: 'text-emerald-500' },
          { label: 'Collected', value: stats.collected, icon: 'inventory_2', color: 'text-blue-500' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-brand-surface-dark p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <span className={`material-symbols-outlined ${stat.color} text-base sm:text-lg`}>{stat.icon}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-brand-surface-dark rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm mx-1">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-brand-dark border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Resource</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Donor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center font-bold text-slate-400">Loading inventory...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center font-bold text-slate-400">No items requested yet.</td></tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.interestId}
                    onClick={() => onNavigate?.('donation-detail', { id: item.id })}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <img src={item.imageUrl || 'https://images.unsplash.com/photo-1582213726839-ed310fe6b76f?q=80&w=200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-brand-text dark:text-white truncate max-w-[120px]">{item.donorName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' :
                        item.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' :
                          item.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-[150px] truncate">{item.location}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NGOInventory;
