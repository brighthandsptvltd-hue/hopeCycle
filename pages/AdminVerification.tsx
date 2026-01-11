import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AdminVerification: React.FC = () => {
  const [pendingNgos, setPendingNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    fetchPendingNgos();
  }, []);

  const fetchPendingNgos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'NGO')
        .eq('verification_status', 'PENDING');

      if (error) throw error;
      setPendingNgos(data || []);
    } catch (err) {
      console.error("Error fetching pending NGOs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      console.log('Approving NGO:', id);

      const { data, error } = await supabase
        .from('profiles')
        .update({ verification_status: 'APPROVED' })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No rows updated');
        throw new Error('Failed to update NGO. Please check if the NGO exists.');
      }

      console.log('Successfully approved:', data);

      // Notify the NGO
      await supabase.from('notifications').insert({
        user_id: id,
        type: 'request',
        title: 'Profile Approved!',
        description: 'Your NGO verification is complete. Please proceed to make the activation payment to unlock all features.',
        link: 'ngo-dashboard'
      });

      setPendingNgos(prev => prev.filter(n => n.id !== id));
      setNotification({ show: true, type: 'success', message: 'NGO approved! They are now prompted for payment.' });
      setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
    } catch (err: any) {
      console.error('Approval failed:', err);
      setNotification({ show: true, type: 'error', message: err.message || 'Error approving NGO' });
      setTimeout(() => setNotification({ show: false, type: 'error', message: '' }), 3000);
    }
  };

  const handleReject = async (id: string) => {
    try {
      console.log('Rejecting NGO:', id);

      const { data, error } = await supabase
        .from('profiles')
        .update({ verification_status: 'REJECTED' })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No rows updated');
        throw new Error('Failed to update NGO. Please check if the NGO exists.');
      }

      console.log('Successfully rejected:', data);

      // Notify the NGO
      await supabase.from('notifications').insert({
        user_id: id,
        type: 'request',
        title: 'Application Rejected',
        description: 'Unfortunately, your NGO application was not approved at this time. Please contact support for more details.',
        link: 'landing'
      });

      setPendingNgos(prev => prev.filter(n => n.id !== id));
      setNotification({ show: true, type: 'success', message: 'NGO application rejected.' });
      setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setNotification({ show: true, type: 'error', message: err.message || 'Error rejecting NGO' });
      setTimeout(() => setNotification({ show: false, type: 'error', message: '' }), 3000);
    }
  };

  const downloadCertificate = (url: string, name: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `NGO_Certificate_${name.replace(/\s+/g, '_')}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="space-y-10 animate-in fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-brand-text dark:text-white tracking-tight">NGO Verification</h2>
            <p className="text-brand-muted dark:text-gray-400 mt-2 text-lg">Trust is the foundation of HopeCycle. Verify new partners.</p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-brand-surface-dark px-6 py-2 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pending</span>
            <span className="text-2xl font-black text-amber-500">{pendingNgos.length}</span>
          </div>
        </div>

        <div className="grid gap-8">
          {loading ? (
            <div className="text-center py-20 font-bold text-brand-muted">Loading applications...</div>
          ) : pendingNgos.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-brand-surface-dark rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">verified</span>
              <p className="text-brand-muted font-bold">No pending verification requests.</p>
            </div>
          ) : pendingNgos.map((ngo) => (
            <div key={ngo.id} className="bg-white dark:bg-brand-surface-dark p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                <div className="size-20 rounded-3xl bg-slate-100 dark:bg-brand-dark flex items-center justify-center font-black text-2xl text-primary shrink-0 overflow-hidden">
                  {ngo.organization_name ? ngo.organization_name[0] : (ngo.full_name ? ngo.full_name[0] : '?')}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black">{ngo.organization_name || ngo.full_name}</h3>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg">Pending Review</span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Representative</p>
                      <p className="text-sm font-bold">{ngo.representative_name || ngo.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Phone</p>
                      <p className="text-sm font-bold">{ngo.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Applied On</p>
                      <p className="text-sm font-bold">{new Date(ngo.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-brand-dark rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Physical Address</p>
                      <p className="text-sm font-medium">{ngo.location || 'No address provided'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-brand-dark rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Certificate Number</p>
                      <p className="text-sm font-bold text-primary">{ngo.certificate_number || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {ngo.certificate_url ? (
                      <button
                        onClick={() => downloadCertificate(ngo.certificate_url, ngo.organization_name || ngo.full_name)}
                        className="flex items-center gap-2 group"
                      >
                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-deep transition-all">
                          <span className="material-symbols-outlined text-xl">download</span>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Document</p>
                          <p className="text-xs font-bold text-brand-text dark:text-white group-hover:text-primary transition-colors">NGO_Certificate.pdf</p>
                        </div>
                      </button>
                    ) : (
                      <p className="text-xs font-bold text-red-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        No certificate uploaded
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex lg:flex-col gap-3 w-full lg:w-48">
                  <button
                    onClick={() => handleApprove(ngo.id)}
                    className="flex-1 px-6 py-4 bg-primary text-primary-deep font-black rounded-2xl shadow-xl shadow-primary/10 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Approve
                    <span className="material-symbols-outlined text-lg font-black">check_circle</span>
                  </button>
                  <button
                    onClick={() => handleReject(ngo.id)}
                    className="flex-1 px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 outline outline-1 outline-red-100 outline-offset-4"
                  >
                    Reject
                    <span className="material-symbols-outlined text-lg">cancel</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminVerification;
