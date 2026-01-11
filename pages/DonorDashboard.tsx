import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface DonorDashboardProps {
  userName?: string;
  onNavigate?: (page: string, params?: any) => void;
}

const DonorDashboard: React.FC<DonorDashboardProps> = ({ userName, onNavigate }) => {
  // ... existing logic ...

  // To keep minimize changes, I will just replace the usages in the return block
  // but I need to match the StartLine/EndLine correctly.

  const [donations, setDonations] = useState<any[]>([]);
  const [ngoRequests, setNgoRequests] = useState<any[]>([]);
  const [nearbyNgos, setNearbyNgos] = useState<any[]>([]);
  const [stats, setStats] = useState({
    impact: 0,
    activePledges: 0,
    connectedNgos: 0
  });
  const [loading, setLoading] = useState(true);

  // Haversine formula to calculate distance in KM
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user profile (to get coordinates)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Fetch donations
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('*')
          .eq('donor_id', user.id)
          .order('created_at', { ascending: false });

        if (donationsError) throw donationsError;
        setDonations(donationsData || []);

        // Calculate stats
        const active = donationsData?.filter(d => ['ACTIVE', 'PENDING'].includes(d.status)).length || 0;
        const completed = donationsData?.filter(d => d.status === 'COMPLETED').length || 0;
        const uniqueNgos = new Set(donationsData?.filter(d => d.ngo_id).map(d => d.ngo_id)).size;

        setStats({
          impact: completed,
          activePledges: active,
          connectedNgos: uniqueNgos
        });

        // Fetch NGO Requests (Filter by 25km if coords exist)
        const { data: requestsData, error: requestsError } = await supabase
          .from('ngo_requests')
          .select('*, profiles(organization_name, latitude, longitude)')
          .order('created_at', { ascending: false })
          .limit(10);

        if (requestsError) throw requestsError;

        let filteredRequests = requestsData || [];
        if (profile?.latitude && profile?.longitude) {
          filteredRequests = filteredRequests.filter(req => {
            const ngo = (req as any).profiles;
            if (!ngo?.latitude || !ngo?.longitude) return true; // Include if location unknown
            const dist = calculateDistance(profile.latitude, profile.longitude, ngo.latitude, ngo.longitude);
            return dist <= 25;
          });
        }
        setNgoRequests(filteredRequests.slice(0, 4));

        // Fetch Verified NGOs (Filter by 25km if coords exist)
        const { data: ngoData, error: ngoError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'NGO');

        if (ngoError) throw ngoError;

        let filteredNgos = (ngoData || []).map(ngo => {
          let dist = 0;
          if (profile?.latitude && profile?.longitude && ngo.latitude && ngo.longitude) {
            dist = calculateDistance(profile.latitude, profile.longitude, ngo.latitude, ngo.longitude);
          }
          return { ...ngo, distance: dist };
        });

        // If user location is known, strictly filter to 25km
        if (profile?.latitude && profile?.longitude) {
          filteredNgos = filteredNgos.filter(ngo => ngo.distance <= 25);
        }

        // Sort by distance and take top 3
        setNearbyNgos(filteredNgos.sort((a, b) => (a.distance || 999) - (b.distance || 999)).slice(0, 3));

        if (profileError || requestsError || donationsError || ngoError) {
          console.error("❌ [DEBUG] Donor Dashboard Fetch Specific Errors:", { profileError, requestsError, donationsError, ngoError });
        }
      } catch (err) {
        console.error('❌ [DEBUG] Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">Welcome back, {userName || 'Donor'}</h2>
          <p className="text-brand-muted dark:text-gray-400 mt-1">Here is the impact you've made today.</p>
        </div>
        <button
          onClick={() => onNavigate?.('new-donation')}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-primary-deep font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Start a new donation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between group hover:border-primary/30 transition-all cursor-default">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Donation Impact</p>
            <h3 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">{stats.impact}</h3>
            <p className="text-xs text-primary font-bold mt-2">Lives Impacted</p>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined material-symbols-filled">task_alt</span>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between group hover:border-primary/30 transition-all cursor-default">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Active Pledges</p>
            <h3 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">{stats.activePledges}</h3>
            <p className="text-xs text-amber-500 font-bold mt-2">Awaiting collection</p>
          </div>
          <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined material-symbols-filled">inventory_2</span>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between group hover:border-primary/30 transition-all cursor-default">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Connected NGOs</p>
            <h3 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">{stats.connectedNgos}</h3>
            <p className="text-xs text-blue-500 font-bold mt-2">Active partnerships</p>
          </div>
          <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined material-symbols-filled">handshake</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-brand-surface-dark rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">My Recent Donations</h3>
              <button
                onClick={() => onNavigate?.('donor-donations')}
                className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <div className="p-20 text-center text-brand-muted font-bold">Loading your donations...</div>
              ) : donations.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <span className="material-symbols-outlined text-4xl text-slate-200">inventory_2</span>
                  <p className="text-brand-muted font-bold">You haven't made any donations yet.</p>
                </div>
              ) : (
                donations.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate?.('donation-detail', { id: item.id })}
                    className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="size-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <img src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2000&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-text dark:text-white group-hover:text-primary transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase text-primary tracking-widest">{item.category}</span>
                          <span className="text-[10px] font-bold text-slate-400 capitalize">• {item.status.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-xs font-bold text-brand-text dark:text-white">{new Date(item.created_at).toLocaleDateString()}</p>
                      <span className="text-[10px] text-slate-400 font-medium">Updated 2h ago</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-all"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-bold">Urgent NGO Requests</h3>
              {ngoRequests.length > 3 && (
                <button
                  onClick={() => onNavigate?.('donor-requests')}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            <div className="space-y-4 relative z-10 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {ngoRequests.map((req, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/item">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{req.category || 'URGENT'}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{req.profiles?.organization_name || 'NGO Partner'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-sm mb-1 group-hover/item:text-primary transition-colors">{req.title}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-4">{req.description}</p>

                  <button
                    onClick={() => onNavigate?.('donor-messages', { recipientId: req.ngo_id })}
                    className="w-full py-3 rounded-xl bg-primary text-primary-deep text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    Message NGO
                  </button>
                </div>
              ))}
              {ngoRequests.length === 0 && !loading && (
                <div className="text-center py-10 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-slate-700">broadcast_on_home</span>
                  <p className="text-xs text-slate-500 font-bold">No urgent requests in your 25km zone.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-brand-surface-dark border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8">
            <h3 className="text-xl font-bold mb-6">Nearby NGOs</h3>
            <div className="space-y-6">
              {nearbyNgos.map((ngo, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm relative">
                      <span className="material-symbols-outlined text-[20px] text-slate-400">corporate_fare</span>
                      <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-text dark:text-white group-hover:text-primary transition-colors">{ngo.organization_name || ngo.full_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Partner</span>
                        <span className="text-[10px] font-bold text-primary tracking-tighter">• {ngo.distance ? `${ngo.distance.toFixed(1)}km` : 'Near you'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate?.('donor-messages', { recipientId: ngo.id, name: ngo.organization_name || ngo.full_name })}
                    className="size-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </button>
                </div>
              ))}
              {nearbyNgos.length === 0 && !loading && (
                <p className="text-xs text-slate-400 text-center py-6 font-bold">No verified NGOs found within 25km.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
