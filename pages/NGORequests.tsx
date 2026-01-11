import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface NGORequestsProps {
  onNewBroadcast?: () => void;
}

const NGORequests: React.FC<NGORequestsProps> = ({ onNewBroadcast }) => {
  const [activeTab, setActiveTab] = useState('Active');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  // Custom Confirm Modal State
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  // Edit Modal State
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('ngo_requests')
        .select('*')
        .eq('ngo_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('ngo_requests').delete().eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
      setNotification({ show: true, type: 'success', message: 'Broadcast deleted successfully.' });
    } catch (err) {
      setNotification({ show: true, type: 'error', message: 'Failed to delete request.' });
    } finally {
      setShowConfirm(null);
      setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
    }
  };

  const handleUpdate = async () => {
    if (!editingRequest.title || !editingRequest.description) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('ngo_requests')
        .update({
          title: editingRequest.title,
          description: editingRequest.description,
          category: editingRequest.category
        })
        .eq('id', editingRequest.id);

      if (error) throw error;

      setRequests(prev => prev.map(r => r.id === editingRequest.id ? editingRequest : r));
      setNotification({ show: true, type: 'success', message: 'Broadcast updated successfully.' });
      setEditingRequest(null);
    } catch (err) {
      setNotification({ show: true, type: 'error', message: 'Failed to update broadcast.' });
    } finally {
      setUpdating(false);
      setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md`}>
          <span className="material-symbols-outlined text-2xl">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
          <p className="font-bold text-sm flex-1">{notification.message}</p>
          <button onClick={() => setNotification({ show: false, type: 'success', message: '' })} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowConfirm(null)}></div>
          <div className="relative bg-white dark:bg-brand-surface-dark w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300 text-center">
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-black text-brand-text dark:text-white mb-2">Delete Broadcast?</h3>
            <p className="text-brand-muted text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-3 font-bold text-brand-muted hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showConfirm)} className="flex-1 py-3 font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}

      {editingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setEditingRequest(null)}></div>
          <div className="relative bg-white dark:bg-brand-surface-dark w-full max-w-xl rounded-[2rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-brand-text dark:text-white mb-6">Edit Broadcast</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Title</label>
                <input
                  type="text"
                  className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 font-bold"
                  value={editingRequest.title}
                  onChange={e => setEditingRequest({ ...editingRequest, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
                <textarea
                  rows={4}
                  className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 font-medium resize-none"
                  value={editingRequest.description}
                  onChange={e => setEditingRequest({ ...editingRequest, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingRequest(null)}
                  className="flex-1 py-4 font-bold text-brand-muted hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 py-4 font-black bg-primary text-primary-deep rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">Need Broadcasts</h2>
          <p className="text-brand-muted dark:text-gray-400 mt-1">Alert the community about resources you currently need.</p>
        </div>
        <button
          onClick={onNewBroadcast}
          className="bg-primary hover:bg-primary-dark text-primary-deep font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">broadcast_on_home</span>
          New Broadcast
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
        {['Active', 'History'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-brand-text'}`}
          >
            {tab}
            {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-brand-muted font-bold">Loading broadcasts...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-brand-surface-dark p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center gap-4">
          <span className="material-symbols-outlined text-4xl text-slate-200">broadcast_on_home</span>
          <p className="text-sm font-bold text-slate-400">No active broadcasts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white dark:bg-brand-surface-dark p-6 rounded-[2.5rem] border-2 border-primary/20 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-2xl -mr-4 -mt-4"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 bg-primary rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Broadcast</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-black mb-2">{req.title}</h3>
                <p className="text-sm text-brand-muted mb-6 line-clamp-3">{req.description}</p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => <div key={i} className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-gray-800"></div>)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingRequest(req)}
                      className="p-2 text-slate-300 hover:text-primary transition-colors"
                    ><span className="material-symbols-outlined">edit</span></button>
                    <button
                      onClick={() => setShowConfirm(req.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    ><span className="material-symbols-outlined">delete</span></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NGORequests;
