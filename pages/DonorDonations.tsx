import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface DonorDonationsProps {
  onNavigate?: (page: string, params?: any) => void;
}

const DonorDonations: React.FC<DonorDonationsProps> = ({ onNavigate }) => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Items');

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
          .from('donations')
          .select('*')
          .eq('donor_id', user.id)
          .order('created_at', { ascending: false });

        if (activeTab === 'Active') query = query.eq('status', 'ACTIVE');
        if (activeTab === 'Pending') query = query.eq('status', 'PENDING');
        if (activeTab === 'Completed') query = query.eq('status', 'COMPLETED');

        const { data, error } = await query;
        if (error) throw error;
        setDonations(data || []);
      } catch (err) {
        console.error('Error fetching donations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [activeTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">My Donations</h2>
          <p className="text-brand-muted dark:text-gray-400">Manage your active and completed giving items.</p>
        </div>
        <button
          onClick={() => onNavigate?.('new-donation')}
          className="bg-primary hover:bg-primary-dark text-primary-deep font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          New Listing
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-px">
        {['All Items', 'Active', 'Pending', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-primary' : 'text-brand-muted hover:text-brand-text'}`}
          >
            {tab}
            {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-brand-muted font-bold">Loading your listings...</div>
      ) : donations.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-brand-surface-dark rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
          <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">inventory_2</span>
          <p className="text-brand-muted font-bold">No donations found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {donations.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate?.('donation-detail', { id: item.id })}
              className="bg-white dark:bg-brand-surface-dark rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer"
            >
              <div className="h-48 relative overflow-hidden">
                <img src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2000&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${item.status === 'COMPLETED' ? 'bg-emerald-500/80 text-white border-emerald-400' :
                    item.status === 'PENDING' ? 'bg-amber-500/80 text-white border-amber-400' :
                      'bg-blue-500/80 text-white border-blue-400'
                    }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</span>
                  <span className="text-[10px] text-brand-muted font-bold uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold text-brand-text dark:text-white mb-2 truncate group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-brand-muted line-clamp-2 mb-6 flex-1">{item.description}</p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                    <span className="text-xs font-bold text-brand-text dark:text-gray-300">Pickup: {item.pickup_time || 'Check Details'}</span>
                  </div>
                  <button className="text-primary font-black text-[10px] uppercase tracking-widest">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorDonations;
