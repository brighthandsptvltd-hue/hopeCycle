import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface DonationDetailProps {
    donationId: string | null;
    userRole?: 'DONOR' | 'NGO' | 'ADMIN';
    onBack: () => void;
    onMessage: (id: string) => void;
    onEdit?: (id: string) => void;
}

const DonationDetail: React.FC<DonationDetailProps> = ({ donationId, userRole, onBack, onMessage, onEdit }) => {
    const [item, setItem] = useState<any>(null);
    const [activeThumb, setActiveThumb] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false); // i.e. isDonor
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Interests State
    const [interests, setInterests] = useState<any[]>([]);
    const [accepting, setAccepting] = useState(false);
    const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });


    useEffect(() => {
        const fetchDonation = async () => {
            if (!donationId) {
                console.error('No donation ID provided to DonationDetail');
                setError("No donation ID provided.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const { data: { user } } = await supabase.auth.getUser();

                const { data, error: fetchError } = await supabase
                    .from('donations')
                    .select(`
                        *,
                        profiles:donor_id (
                            full_name,
                            organization_name,
                            location
                        ),
                        ngo:ngo_id (
                            id,
                            organization_name,
                            full_name,
                            location,
                            avatar_url
                        )
                    `)
                    .eq('id', donationId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Donation not found.");

                setItem(data);

                if (user && user.id === data.donor_id) {
                    setIsOwner(true);
                    // If owner, fetch interests only if status is ACTIVE
                    if (data.status === 'ACTIVE') {
                        fetchInterests(donationId);
                    }
                }
            } catch (err: any) {
                console.error('Error fetching donation:', err);
                setError(err.message || "Failed to load donation details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDonation();
    }, [donationId]);

    const fetchInterests = async (id: string) => {
        const { data, error } = await supabase
            .from('donation_interests')
            .select(`
                *,
                profiles:ngo_id (
                    id,
                    organization_name,
                    full_name,
                    location
                )
            `)
            .eq('donation_id', id)
            .eq('status', 'PENDING');

        if (!error && data) {
            setInterests(data);
        }
    };

    const handleAcceptNGO = async (interest: any) => {
        setAccepting(true);
        try {
            // 1. Update Donation (Status=PENDING, ngo_id=selected)
            const { error: updateError } = await supabase
                .from('donations')
                .update({
                    status: 'PENDING',
                    ngo_id: interest.ngo_id
                })
                .eq('id', donationId);

            if (updateError) throw updateError;

            // 2. Mark this interest as ACCEPTED
            await supabase
                .from('donation_interests')
                .update({ status: 'ACCEPTED' })
                .eq('id', interest.id);

            // 3. Mark others as REJECTED (Optional, but good practice)
            await supabase
                .from('donation_interests')
                .update({ status: 'REJECTED' })
                .eq('donation_id', donationId)
                .neq('id', interest.id);

            // Notify the NGO
            await supabase.from('notifications').insert({
                user_id: interest.ngo_id,
                type: 'donation',
                title: 'Donation Request Accepted!',
                description: `Your request for "${item.title}" has been accepted! Start a chat to coordinate pickup.`,
                link: 'ngo-dashboard'
            });

            // 4. Update local state
            setItem((prev: any) => ({
                ...prev,
                status: 'PENDING',
                ngo_id: interest.ngo_id,
                ngo: interest.profiles // Optimistically update NGO details
            }));
            setInterests([]); // Clear list as it's done

            showNotification('success', `You have accepted ${interest.profiles?.organization_name || 'the NGO'}! Status is now Pending Pickup.`);

        } catch (err: any) {
            console.error(err);
            showNotification('error', 'Failed to accept NGO. Please try again.');
        } finally {
            setAccepting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('donations')
                .delete()
                .eq('id', donationId);

            if (error) throw error;
            onBack();
        } catch (err: any) {
            showNotification('error', err.message || 'Error deleting donation');
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 5000);
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

    // NGO Display Name Helper
    const assignedNGO = item.ngo;
    const assignedNGOName = assignedNGO ? (assignedNGO.organization_name || assignedNGO.full_name) : 'Assignments';

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

            {/* Custom Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)}></div>
                    <div className="bg-white dark:bg-brand-surface-dark rounded-[2.5rem] p-10 max-w-md w-full relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        <div className="size-20 rounded-3xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 mb-8">
                            <span className="material-symbols-outlined text-4xl material-symbols-filled">delete_forever</span>
                        </div>
                        <h3 className="text-3xl font-black text-brand-text dark:text-white mb-4">Are you sure?</h3>
                        <p className="text-brand-muted dark:text-gray-400 mb-10 leading-relaxed font-medium">
                            This action will permanently remove <span className="text-brand-text dark:text-white font-bold">"{item.title}"</span> from HopeCycle. This cannot be undone.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="py-4 rounded-2xl bg-gray-50 dark:bg-brand-dark text-brand-muted dark:text-gray-300 font-black uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? 'Removing...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm font-bold text-brand-muted mb-6">
                <button onClick={onBack} className="hover:text-primary transition-colors">Home</button>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <button onClick={onBack} className="hover:text-primary transition-colors">My Donations</button>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <span className="text-brand-text dark:text-white truncate max-w-[200px]">{item.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Content - Image and Info */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
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

                        {isOwner && item.status !== 'PENDING' && item.status !== 'COMPLETED' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onEdit?.(item.id)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Edit item
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 font-bold text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="w-full aspect-video rounded-[2.5rem] bg-gray-100 dark:bg-brand-surface-dark overflow-hidden shadow-2xl relative group border border-gray-100 dark:border-gray-800">
                            <img
                                src={images[activeThumb]}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt={item.title}
                            />
                            <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-lg border border-white/20 backdrop-blur-md ${item.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                {item.status}
                            </div>
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

                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-8 flex items-start gap-5">
                        <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                            <span className="material-symbols-outlined text-3xl material-symbols-filled">security</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-amber-900 dark:text-amber-200 mb-1 font-black">Safety First</h3>
                            <p className="text-amber-800 dark:text-amber-300/70 leading-relaxed font-medium">
                                Always verify the NGO representative's identity upon pickup. Use the HopeCycle secure chat to coordinate timings and locations.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Status & Actions */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-brand-surface-dark rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col sticky top-24">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-brand-dark rounded-t-[2.5rem]">
                            <h3 className="font-black text-xl text-brand-text dark:text-white font-black">
                                {item.status === 'PENDING' ? 'Assigned NGO' : 'NGO Interest'}
                            </h3>
                            {item.status !== 'PENDING' && (
                                <span className="bg-primary/10 text-primary-dark dark:text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                    {interests.length} Requests
                                </span>
                            )}
                        </div>

                        {item.status === 'PENDING' ? (
                            <div className="p-8 flex flex-col items-center text-center space-y-6">
                                <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-black uppercase mb-2">
                                    {assignedNGOName[0]}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-brand-text dark:text-white mb-2">{assignedNGOName}</h4>
                                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                        Verified Partner
                                    </span>
                                </div>
                                <div className="w-full pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-brand-muted mb-6">
                                        This item is assigned to <span className="font-bold text-brand-text dark:text-white">{assignedNGOName}</span>. Please coordinate the pickup timeline.
                                    </p>
                                    <button
                                        onClick={() => onMessage(item.ngo_id)}
                                        className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-primary-deep font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">chat</span>
                                        Chat with NGO
                                    </button>
                                </div>
                            </div>
                        ) : interests.length > 0 ? (
                            <div className="p-4 space-y-4 min-h-[240px]">
                                {interests.map(interest => (
                                    <div key={interest.id} className="bg-white dark:bg-brand-surface border border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm">{interest.profiles?.organization_name || 'NGO Request'}</h4>
                                            <span className="text-[10px] text-gray-400">{new Date(interest.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => onMessage(interest.ngo_id)}
                                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                Chat
                                            </button>
                                            <button
                                                onClick={() => handleAcceptNGO(interest)}
                                                disabled={accepting}
                                                className="flex-1 bg-primary hover:bg-primary-dark text-primary-deep text-xs font-bold py-2 rounded-lg transition-colors"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 space-y-8 min-h-[240px] flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">analytics</span>
                                <p className="text-sm text-brand-muted font-bold">No new requests yet.</p>
                                <p className="text-xs text-brand-muted/60 mt-2">You will be notified when an NGO requests this item.</p>
                            </div>
                        )}

                        <div className="p-6 bg-gray-50/50 dark:bg-brand-dark/50 rounded-b-[2.5rem] border-t border-gray-100 dark:border-gray-800 text-center">
                            <button className="text-xs font-black text-primary hover:underline uppercase tracking-widest" onClick={onBack}>
                                Manage All Donations
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonationDetail;
