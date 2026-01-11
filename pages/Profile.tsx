import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';

interface ProfileProps {
  role: UserRole;
}

const Profile: React.FC<ProfileProps> = ({ role }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    full_name: '',
    organization_name: '',
    location: ''
  });

  const [stats, setStats] = useState({
    totalItems: 0,
    messagesCount: 0,
    impactPoints: 0
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        organization_name: data.organization_name || '',
        location: data.location || ''
      });

      // Fetch stats
      const { count: itemsCount } = await supabase
        .from('donations')
        .select('id', { count: 'exact', head: true })
        .eq(role === 'DONOR' ? 'donor_id' : 'ngo_id', user.id);

      const { count: msgCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      setStats({
        totalItems: itemsCount || 0,
        messagesCount: msgCount || 0,
        impactPoints: (itemsCount || 0) * 10 // Simple gamification
      });

    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          organization_name: role === 'NGO' ? formData.organization_name : null,
          location: formData.location
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="bg-white dark:bg-brand-surface-dark rounded-[3rem] p-8 md:p-12 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="size-40 rounded-[2.5rem] bg-slate-100 dark:bg-brand-dark flex items-center justify-center text-primary-deep overflow-hidden border-4 border-white dark:border-brand-surface-dark shadow-xl">
              <span className="material-symbols-outlined text-7xl opacity-20">person</span>
              {/* No image upload as per request, just using a styled avatar container */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-2 -right-2 size-12 bg-primary text-primary-deep rounded-2xl border-4 border-white dark:border-brand-surface-dark flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-4 py-3 font-bold text-lg"
                  placeholder="Full Name"
                />
                {role === 'NGO' && (
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={e => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-4 py-3 font-bold text-lg"
                    placeholder="Organization Name"
                  />
                )}
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-4 py-3 font-bold text-sm"
                  placeholder="City, State"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-primary text-primary-deep font-black py-3 rounded-xl shadow-lg shadow-primary/20"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: profile.full_name,
                        organization_name: profile.organization_name,
                        location: profile.location
                      });
                    }}
                    className="px-4 py-3 bg-gray-100 dark:bg-brand-dark text-brand-muted font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-black text-brand-text dark:text-white tracking-tight">
                  {role === 'NGO' ? profile.organization_name || profile.full_name : profile.full_name}
                </h2>
                <p className="text-brand-muted dark:text-gray-400 text-lg font-medium mt-1">
                  Verified {role} Profile • {profile.location || 'Location Not Set'}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                  <div className="px-4 py-2 bg-primary/10 text-primary-dark dark:text-primary rounded-xl text-sm font-black uppercase tracking-widest border border-primary/20">
                    {stats.impactPoints} Impact Points
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-sm font-black uppercase tracking-widest">
                    Verified {role}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mt-16 pt-12 border-t border-gray-100 dark:border-gray-800">
          <div className="space-y-8">
            <h3 className="text-xl font-black text-brand-text dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              Profile Details
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Legal Name</span>
                <p className="font-bold text-brand-text dark:text-white">{profile.full_name}</p>
              </div>
              {role === 'NGO' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization</span>
                  <p className="font-bold text-brand-text dark:text-white">{profile.organization_name || 'Not Specified'}</p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Type</span>
                <p className="font-bold text-brand-text dark:text-white capitalize">{role}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Member Since</span>
                <p className="font-bold text-brand-text dark:text-white">{new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-black text-brand-text dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">insights</span>
              Community Impact
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-brand-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-black text-brand-text dark:text-white">{stats.totalItems}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{role === 'DONOR' ? 'Items Donated' : 'Items Claimed'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-brand-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-black text-brand-text dark:text-white">{stats.messagesCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Interactions</p>
              </div>
              <div className="col-span-2 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-primary-dark dark:text-primary">{stats.impactPoints}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-dark dark:text-primary/70 mt-1">Total Contributions</p>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-primary/40">stars</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
