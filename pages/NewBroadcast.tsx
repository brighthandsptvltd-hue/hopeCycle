import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface NewBroadcastProps {
  onComplete: () => void;
}

const NewBroadcast: React.FC<NewBroadcastProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Furniture',
    urgency: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  const categories = ['Furniture', 'Clothing', 'Electronics', 'Books', 'Household', 'Other'];

  const showNotification = (type: 'success' | 'error', message: string, shouldRedirect = false) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: 'success', message: '' });
      if (shouldRedirect) onComplete();
    }, 3000);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      showNotification('error', 'Please fill in both title and description');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // 1. Fetch NGO Profile for location
      const { data: ngoProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // 2. Insert Broadcast
      const { error } = await supabase
        .from('ngo_requests')
        .insert({
          ngo_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.urgency === 'Critical' ? 'High' : (formData.urgency === 'Medium' ? 'Medium' : 'Low'),
          status: 'ACTIVE'
        });

      if (error) throw error;

      // 3. Notify Nearby Donors
      if (ngoProfile?.latitude && ngoProfile?.longitude) {
        const { data: donors } = await supabase
          .from('profiles')
          .select('id, latitude, longitude')
          .eq('role', 'DONOR');

        if (donors) {
          const nearbyDonors = donors.filter(donor => {
            if (!donor.latitude || !donor.longitude) return false;
            const dist = calculateDistance(ngoProfile.latitude, ngoProfile.longitude, donor.latitude, donor.longitude);
            return dist <= 25;
          });

          if (nearbyDonors.length > 0) {
            const notifications = nearbyDonors.map(donor => ({
              user_id: donor.id,
              type: 'request',
              title: 'Urgent Request Nearby!',
              description: `${ngoProfile.organization_name || 'An NGO'} needs ${formData.title}. Can you help?`,
              link: 'donor-dashboard'
            }));

            await supabase.from('notifications').insert(notifications);
          }
        }
      }

      showNotification('success', 'Broadcast sent! Nearby donors will see this on their dashboard.', true);
    } catch (err: any) {
      showNotification('error', err.message || 'Error sending broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in pb-20 relative">
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md`}>
          <span className="material-symbols-outlined text-2xl">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
          <p className="font-bold text-sm flex-1">{notification.message}</p>
          <button onClick={() => setNotification({ show: false, type: 'success', message: '' })} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={onComplete} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-brand-muted">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">Post New Broadcast</h2>
          <p className="text-brand-muted dark:text-gray-400">Reach nearby donors instantly within your 25km zone.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-surface-dark p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Broadcast Title</label>
            <input
              type="text"
              placeholder="e.g. Winter Blanket Drive"
              className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 font-bold"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Category</label>
              <select
                className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 appearance-none font-bold"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Urgency Level</label>
              <div className="flex gap-2 h-[56px]">
                {['Low', 'Medium', 'Critical'].map(level => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, urgency: level })}
                    className={`flex-1 rounded-xl font-bold text-xs transition-all border ${formData.urgency === level
                      ? 'bg-primary text-primary-deep border-primary'
                      : 'bg-gray-50 dark:bg-brand-dark text-brand-muted border-transparent hover:border-gray-200'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Broadcast Content</label>
            <textarea
              rows={6}
              placeholder="Describe exactly what you need and why it's urgent..."
              className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 resize-none font-medium"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary-deep dark:bg-primary text-white dark:text-primary-deep font-black py-5 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">send_time_extension</span>
          {loading ? 'Sending...' : 'Send Out Broadcast'}
        </button>
      </div>
    </div>
  );
};

export default NewBroadcast;
