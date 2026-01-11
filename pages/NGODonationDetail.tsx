import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface NGODonationDetailProps {
    donationId: string | null;
    onBack: () => void;
    onNavigate?: (page: string, params?: any) => void;
}

const NGODonationDetail: React.FC<NGODonationDetailProps> = ({ donationId, onBack, onNavigate }) => {
    const [item, setItem] = useState<any>(null);
    const [activeThumb, setActiveThumb] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // NGO Specific State
    const [claiming, setClaiming] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [claimStatus, setClaimStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED'>('NONE');
    const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

    useEffect(() => {
        if (item) {
            checkClaimStatus(item);
        }
    }, [item]);

    const checkClaimStatus = async (itemData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check the new donation_interests table
        const { data: interest } = await supabase
            .from('donation_interests')
            .select('status')
            .eq('donation_id', donationId)
            .eq('ngo_id', user.id)
            .maybeSingle();

        if (interest) {
            if (interest.status === 'ACCEPTED' || itemData.status === 'COMPLETED') {
                setClaimStatus('ACCEPTED');
            } else {
                setClaimStatus('PENDING'); // REJECTED could be handled here too but simplicity first
            }
        } else if (itemData.ngo_id === user.id && (itemData.status === 'PENDING' || itemData.status === 'COMPLETED')) {
            // Fallback for legacy claims or if interests table not used yet
            setClaimStatus('ACCEPTED'); // If donation has MY ID and is PENDING/COMPLETED, I am the accepted one
        } else {
            setClaimStatus('NONE');
        }
    }

    useEffect(() => {
        const fetchDonation = async () => {
            if (!donationId) {
                console.error('No donation ID provided to NGODonationDetail');
                setError("No donation ID provided. Please try again.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('donations')
                    .select(`
                        *,
                        profiles:donor_id (
                            full_name,
                            organization_name,
                            location
                        )
                    `)
                    .eq('id', donationId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Donation not found.");

                setItem(data);
            } catch (err: any) {
                console.error('Error fetching donation:', err);
                setError(err.message || "Failed to load donation details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDonation();
    }, [donationId]);

    const handleComplete = async () => {
        setCompleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Update Donation Status to COMPLETED
            const { error: updateError } = await supabase
                .from('donations')
                .update({ status: 'COMPLETED' })
                .eq('id', donationId);

            if (updateError) throw updateError;

            // 2. Update interest status too if exists
            await supabase
                .from('donation_interests')
                .update({ status: 'COMPLETED' })
                .eq('donation_id', donationId)
                .eq('ngo_id', user.id);

            // 3. Notify Donor
            await supabase.from('notifications').insert({
                user_id: item.donor_id,
                type: 'donation',
                title: 'Donation Completed!',
                description: `Your donation "${item.title}" has been successfully picked up by ${user.user_metadata?.organization_name || 'the NGO'}. Thank you for your kindness!`,
                link: 'donor-donations'
            });

            setNotification({ show: true, type: 'success', message: 'Pickup completed! Thank you for your impact.' });

            // Update local state
            setItem((prev: any) => ({ ...prev, status: 'COMPLETED' }));

            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (err: any) {
            console.error('Completion Error:', err);
            setNotification({ show: true, type: 'error', message: err.message || 'Error completing pickup.' });
        } finally {
            setCompleting(false);
        }
    };

    const handleClaim = async () => {
        setClaiming(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Optimistic update
            setClaimStatus('PENDING');

            // Insert into donation_interests instead of capturing the item directly
            const { error } = await supabase
                .from('donation_interests')
                .insert({
                    donation_id: donationId,
                    ngo_id: user.id,
                    status: 'PENDING'
                });

            if (error) {
                setClaimStatus('NONE'); // Revert on error
                throw error;
            }

            // Notify the Donor
            await supabase.from('notifications').insert({
                user_id: item.donor_id,
                type: 'request',
                title: 'NGO Interest!',
                description: `${user.user_metadata?.organization_name || 'An NGO'} is interested in your item: "${item.title}".`,
                link: 'donor-donations'
            });

            setNotification({ show: true, type: 'success', message: 'Request sent to donor! They will be notified.' });
            setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000);
        } catch (err: any) {
            console.error('Claim Error:', err);
            setNotification({ show: true, type: 'error', message: err.message || 'Error claiming donation. Please try again.' });
            setTimeout(() => setNotification({ show: false, type: 'error', message: '' }), 3000);
        } finally {
            setClaiming(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-brand-muted">Loading details...</p>
        </div>
    );

    if (error || !item) return (
        <div className="text-center py-20 bg-white dark:bg-brand-surface-dark rounded-[2.5rem] border border-gray-100 dark:border-gray-800 max-w-2xl mx-auto shadow-sm">
            <span className="material-symbols-outlined text-6xl text-red-100 mb-4">error</span>
            <h2 className="text-2xl font-black text-brand-text dark:text-white">{error || "Donation not found"}</h2>
            <p className="text-brand-muted mt-2 mb-8">This item may have been removed or the link is broken.</p>
            <button
                onClick={onBack}
                className="bg-primary hover:bg-primary-dark text-primary-deep font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
            >
                Return to Dashboard
            </button>
        </div>
    );

    const images = item.image_urls && item.image_urls.length > 0
        ? item.image_urls
        : ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2000&auto=format&fit=crop'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24 relative">
            {notification.show && (
                <div className={`fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md`}>
                    <span className="material-symbols-outlined text-2xl">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
                    <p className="font-bold text-sm flex-1">{notification.message}</p>
                    <button onClick={() => setNotification({ show: false, type: 'success', message: '' })} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm font-bold text-brand-muted mb-6">
                <button onClick={onBack} className="hover:text-primary transition-colors">Dashboard</button>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <button onClick={onBack} className="hover:text-primary transition-colors">Donation Feed</button>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <span className="text-brand-text dark:text-white truncate max-w-[200px]">{item.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Content - Image and Info */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-brand-text dark:text-white leading-tight">
                            {item.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-brand-muted font-bold">
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                <span>Posted {new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                <span>{item.location || item.profiles?.location || 'Location not specified'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[20px] text-primary">category</span>
                                <span className="text-primary">{item.category}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="w-full aspect-video rounded-[2.5rem] bg-gray-100 dark:bg-brand-surface-dark overflow-hidden shadow-2xl relative group border border-gray-100 dark:border-gray-800">
                            <img
                                src={images[activeThumb]}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt={item.title}
                            />
                            {/* Simple Status Badge for NGO */}
                            {claimStatus !== 'NONE' && (
                                <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-lg border border-white/20 backdrop-blur-md ${claimStatus === 'ACCEPTED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                    }`}>
                                    {claimStatus === 'ACCEPTED' ? 'Accepted' : 'Requested'}
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex flex-wrap gap-4">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveThumb(idx)}
                                        className={`size-24 rounded-2xl overflow-hidden border-2 transition-all ${activeThumb === idx ? 'border-primary ring-4 ring-primary/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-brand-surface-dark rounded-[2.5rem] p-10 shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
                        <div>
                            <h3 className="text-2xl font-black mb-4 font-black">About this item</h3>
                            <p className="text-lg leading-relaxed text-brand-muted dark:text-gray-400">
                                {item.description || "No description provided for this item."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 border-t border-gray-50 dark:border-gray-800 pt-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Condition</p>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-yellow-500 material-symbols-filled">stars</span>
                                    <p className="text-brand-text dark:text-white font-bold">{item.condition}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Pickup Availability</p>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                    <p className="text-brand-text dark:text-white font-bold">{item.pickup_time || 'Check with donor via chat'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-8 flex items-start gap-5">
                        <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                            <span className="material-symbols-outlined text-3xl material-symbols-filled">security</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-amber-900 dark:text-amber-200 mb-1 font-black">Verify Donor</h3>
                            <p className="text-amber-800 dark:text-amber-300/70 leading-relaxed font-medium">
                                Always verify the Donor's identity upon pickup. Ensure the item matches the description before accepting.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Action Center for NGO */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-brand-surface-dark rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col sticky top-24">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-brand-dark rounded-t-[2.5rem]">
                            <h3 className="font-black text-xl text-brand-text dark:text-white font-black">Action Center</h3>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${claimStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                claimStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                    'bg-primary/10 text-primary-dark dark:text-primary'
                                }`}>
                                {claimStatus === 'ACCEPTED' ? 'Accepted' : claimStatus === 'PENDING' ? 'Requested' : 'Available'}
                            </span>
                        </div>

                        <div className="p-8 space-y-8 min-h-[240px] flex flex-col items-center justify-center text-center">
                            {claimStatus === 'ACCEPTED' ? (
                                <>
                                    <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                                        <span className="material-symbols-outlined text-4xl text-emerald-500">celebration</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-brand-text dark:text-white mb-2">Request Accepted!</h4>
                                        <p className="text-sm text-brand-muted font-bold">The donor has accepted your request. Please coordinate the pickup.</p>
                                    </div>
                                    <button
                                        onClick={() => onNavigate?.('donor-messages')}
                                        className="w-full bg-slate-100 dark:bg-brand-dark hover:bg-slate-200 text-brand-text dark:text-white font-black py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                                    >
                                        <span className="material-symbols-outlined">chat</span>
                                        Chat with Donor
                                    </button>

                                    {item.status !== 'COMPLETED' ? (
                                        <button
                                            onClick={handleComplete}
                                            disabled={completing}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-3"
                                        >
                                            {completing ? (
                                                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined">task_alt</span>
                                                    Complete Pickup
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full py-4 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest mt-3 border border-emerald-100 italic">
                                            Pickup Completed ✓
                                        </div>
                                    )}
                                </>
                            ) : claimStatus === 'PENDING' ? (
                                <>
                                    <div className="size-20 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                                        <span className="material-symbols-outlined text-4xl text-amber-500">hourglass_top</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-brand-text dark:text-white mb-2">Request Sent!</h4>
                                        <p className="text-sm text-brand-muted font-bold">Waiting for the donor to accept your request.</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-5xl text-primary mb-4">volunteer_activism</span>
                                    <p className="text-sm text-brand-muted font-bold">This item is exactly what your organization needs?</p>
                                    <button
                                        onClick={handleClaim}
                                        disabled={claiming}
                                        className="w-full bg-primary hover:bg-primary-dark text-primary-deep font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                                    >
                                        {claiming ? 'Sending Request...' : 'Request Item Now'}
                                        <span className="material-symbols-outlined">send</span>
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50/50 dark:bg-brand-dark/50 rounded-b-[2.5rem] border-t border-gray-100 dark:border-gray-800 text-center">
                            <button className="text-xs font-black text-primary hover:underline uppercase tracking-widest" onClick={onBack}>
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NGODonationDetail;
