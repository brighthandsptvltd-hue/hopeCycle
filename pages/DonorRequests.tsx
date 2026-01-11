import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const DonorRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error' | 'info'; message: string }>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Use the secure RPC function
        const { data, error } = await supabase.rpc('get_donor_requests');

        if (error) throw error;
        setRequests(data || []);

      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 4000);
  };

  const handleAccept = async (req: any) => {
    // Use custom confirmation UI if possible, for now we skip raw confirm
    // or we can implement a simple inline confirm. Let's do a direct accept for smooth UX 
    // with an undo/error handle OR just a quick toast "Accepting..."

    setProcessing(req.interest_id);
    try {
      // 1. Update Donation
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          status: 'PENDING',
          ngo_id: req.ngo_id
        })
        .eq('id', req.donation_id);

      if (updateError) throw updateError;

      // 2. Update Interest Status
      await supabase
        .from('donation_interests')
        .update({ status: 'ACCEPTED' })
        .eq('id', req.interest_id);

      // 3. Reject others
      await supabase
        .from('donation_interests')
        .update({ status: 'REJECTED' })
        .eq('donation_id', req.donation_id)
        .neq('id', req.interest_id);

      // Remove from list and show success
      setRequests(prev => prev.filter(r => r.interest_id !== req.interest_id));
      showNotification('success', `You accepted the request from ${req.ngo_name}!`);

    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Failed to accept request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : notification.type === 'info' ? 'bg-blue-500' : 'bg-red-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md`}>
          <span className="material-symbols-outlined text-2xl">{notification.type === 'success' ? 'check_circle' : 'info'}</span>
          <p className="font-bold text-sm flex-1">{notification.message}</p>
          <button onClick={() => setNotification({ show: false, type: 'success', message: '' })} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">NGO Requests</h2>
        <p className="text-brand-muted dark:text-gray-400 mt-1">Review which organizations have reached out for your items.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 font-bold text-brand-muted">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-brand-surface-dark rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
          <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">inbox</span>
          <p className="text-brand-muted font-bold">No active requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.interest_id} className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row gap-6 md:items-center">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-dark font-black text-xl flex-shrink-0 uppercase">
                  {req.ngo_name?.[0] || 'N'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{req.ngo_name}</h3>
                    <span className="material-symbols-outlined text-primary text-sm material-symbols-filled">verified</span>
                  </div>
                  <p className="text-sm text-brand-muted mb-2">
                    Requested Item: <span className="font-bold text-brand-text dark:text-white">{req.donation_title}</span>
                  </p>
                  <div className="p-3 bg-gray-50 dark:bg-brand-dark rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs italic text-brand-muted">
                      Request sent on {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2">
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={processing === req.interest_id}
                    className="flex-1 px-6 py-2.5 bg-primary text-primary-deep font-bold rounded-xl text-sm hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {processing === req.interest_id ? 'Accepting...' : 'Accept Request'}
                  </button>
                  <button
                    onClick={() => showNotification('info', 'NGO Profiles are coming soon!')}
                    className="flex-1 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-brand-text dark:text-white font-bold rounded-xl text-sm hover:bg-slate-200 transition-all"
                  >
                    View Profile
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

export default DonorRequests;
