import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface NGODashboardProps {
  userName?: string;
  isVerified?: boolean;
  onRequestDonation?: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

const NGODashboard: React.FC<NGODashboardProps> = ({ userName, isVerified, onRequestDonation, onNavigate }) => {
  const [activeDonations, setActiveDonations] = useState<any[]>([]); // Available to claim
  const [myRequests, setMyRequests] = useState<any[]>([]); // My interests/claims
  const [myBroadcasts, setMyBroadcasts] = useState<any[]>([]); // My public appeals

  const [stats, setStats] = useState({
    nearbyPledges: 0,
    activeRequestsCount: 0,
    impactTotal: 0
  });

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  const categories = ['Furniture', 'Clothing', 'Electronics', 'Books', 'Household', 'Other'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Active Donations (Marketplace)
      // Only show items that are NOT assigned yet
      const { data: marketData } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'ACTIVE') // Active items
        .is('ngo_id', null)     // Not assigned
        .order('created_at', { ascending: false });

      setActiveDonations(marketData || []);

      // 2. Fetch My Interests (Items I've requested)
      // Join with donations to get details
      const { data: interestData } = await supabase
        .from('donation_interests')
        .select(`
                *,
                donations (*)
            `)
        .eq('ngo_id', user.id)
        .order('created_at', { ascending: false });

      setMyRequests(interestData || []);

      // 3. Fetch My Broadcasts (NGO Requests)
      const { data: broadcastData } = await supabase
        .from('ngo_requests')
        .select('*')
        .eq('ngo_id', user.id)
        .order('created_at', { ascending: false });

      setMyBroadcasts(broadcastData || []);

      // 4. Stats
      // Impact = Completed donations assigned to me
      const { count: impactCount } = await supabase
        .from('donations')
        .select('id', { count: 'exact', head: true })
        .eq('ngo_id', user.id)
        .eq('status', 'COMPLETED');

      setStats({
        nearbyPledges: marketData?.length || 0,
        activeRequestsCount: (interestData?.length || 0) + (broadcastData?.length || 0),
        impactTotal: impactCount || 0
      });

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDonation = async (id: string) => {
    if (!isVerified) {
      alert("Verification required.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert into donation_interests
      const { error } = await supabase
        .from('donation_interests')
        .insert({
          donation_id: id,
          ngo_id: user.id,
          status: 'PENDING'
        });

      if (error) throw error;

      setNotification({ show: true, type: 'success', message: 'Request sent! Waiting for donor.' });
      setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);

      fetchDashboardData(); // Refresh to update list state
    } catch (err: any) {
      setNotification({ show: true, type: 'error', message: err.message || 'Error sending request.' });
    }
  };

  // Combine Active Market + My Requests for the feed? 
  // User likely wants to see "Available" items primarily in the big feed, 
  // and "My Updates" in the sidebar or a generic mix.
  // I will just show Available Items in the main feed, and highlight status if I've already requested it.

  // Helper to check if I already requested an item
  const getMyInterestStatus = (donationId: string) => {
    const interest = myRequests.find(r => r.donation_id === donationId);
    return interest ? interest.status : null;
  };

  const filteredFeed = selectedCategory === 'All'
    ? activeDonations
    : activeDonations.filter(d => d.category === selectedCategory);

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

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">Welcome back, {userName || 'Partner'}</h2>
            <p className="text-brand-muted dark:text-gray-400 mt-2">Manage your requests and find donations.</p>
          </div>
          <button
            onClick={onRequestDonation}
            className={`flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${!isVerified ? 'bg-gray-100 dark:bg-brand-dark text-brand-muted cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-primary-deep shadow-primary/20'}`}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="whitespace-nowrap">Broadcast Need</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[140px] group hover:border-primary/30 transition-all">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Available Donations</p>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black text-brand-text dark:text-white">{stats.nearbyPledges}</h3>
              <p className="text-xs font-bold text-emerald-600 mb-2">items nearby</p>
            </div>
          </div>
          <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[140px] group hover:border-primary/30 transition-all">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Active Activity</p>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black text-brand-text dark:text-white">{stats.activeRequestsCount}</h3>
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-1 rounded-lg text-[10px] font-bold mb-2 uppercase tracking-wider">Requests & Claims</span>
            </div>
          </div>
          <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[140px] group hover:border-primary/30 transition-all">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Impact</p>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black text-brand-text dark:text-white">{stats.impactTotal}</h3>
              <p className="text-xs text-slate-400 font-medium mb-2">completed collections</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold">Donation Feed</h3>
              <div className="flex gap-2">
                {/* Category Filter Logic Simplified for UI */}
                <div className="relative group/cat">
                  <button className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-brand-surface-dark border border-slate-200 dark:border-slate-800 text-slate-500 uppercase flex items-center gap-2">
                    {selectedCategory} <span className="material-symbols-outlined text-xs">expand_more</span>
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-brand-surface-dark rounded-2xl shadow-xl z-20 hidden group-hover/cat:block">
                    <button onClick={() => setSelectedCategory('All')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-bold">All</button>
                    {categories.map(c => <button key={c} onClick={() => setSelectedCategory(c)} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-bold">{c}</button>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-20 text-brand-muted font-bold">Loading feed...</div>
              ) : filteredFeed.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-brand-surface-dark rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">inventory_2</span>
                  <p className="text-brand-muted font-bold">No active donations found right now.</p>
                </div>
              ) : (
                filteredFeed.map(item => {
                  const status = getMyInterestStatus(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onNavigate?.('donation-detail', { id: item.id })}
                      className="group bg-white dark:bg-brand-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-full sm:w-48 h-32 sm:h-auto rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                        <img src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2000&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                      </div>
                      <div className="flex flex-col flex-1 justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-lg group-hover:text-primary transition-colors text-brand-text dark:text-white">{item.title}</h4>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-brand-muted dark:text-gray-400 line-clamp-2">{item.description}</p>
                          <div className="flex gap-2 mt-4">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary-dark rounded text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span> {item.pickup_time || 'Check with donor'}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); status ? null : handleClaimDonation(item.id); }}
                            disabled={!!status}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center ${status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                              status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                'bg-primary/10 hover:bg-primary text-primary-dark hover:text-primary-deep'
                              }`}
                          >
                            {status === 'ACCEPTED' ? 'Assigned to You' : status === 'PENDING' ? 'Request Sent' : 'Request Item'}
                            {!status && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Log (Requests & Broadcasts) */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-brand-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-full max-h-[600px] overflow-y-auto custom-scrollbar">
              <h3 className="font-bold text-lg mb-6 text-brand-text dark:text-white">Your Activity</h3>
              <div className="space-y-6">

                {/* My Broadcasts */}
                {myBroadcasts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Your Broadcasts</p>
                      {myBroadcasts.length > 2 && (
                        <button
                          onClick={() => onNavigate?.('ngo-requests')}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    {myBroadcasts.slice(0, 2).map(b => (
                      <div key={b.id} className="relative pl-4 border-l-2 border-primary">
                        <h4 className="text-sm font-bold">{b.title}</h4>
                        <p className="text-xs text-brand-muted mt-1">Priority: {b.priority}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* My Pledges/Requests */}
                {myRequests.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Item Requests</p>
                      {myRequests.length > 3 && (
                        <button
                          onClick={() => onNavigate?.('ngo-inventory')}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    {myRequests.slice(0, 3).map(req => (
                      <div key={req.id}
                        className="cursor-pointer"
                        onClick={() => onNavigate?.('donation-detail', { id: req.donation_id })}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-bold text-brand-text dark:text-white line-clamp-1">{req.donations?.title || 'Unknown Item'}</h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shrink-0 ${req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                              req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>{req.status}</span>
                        </div>
                        <p className="text-xs text-brand-muted mt-1">
                          {req.status === 'ACCEPTED' ? 'Ready for pickup!' : 'Waiting for donor...'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {myBroadcasts.length === 0 && myRequests.length === 0 && (
                  <p className="text-sm text-brand-muted italic">No activity yet. Start by requesting a donation!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NGODashboard;
