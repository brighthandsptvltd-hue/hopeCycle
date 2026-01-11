import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface EditDonationProps {
    donationId: string | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const EditDonation: React.FC<EditDonationProps> = ({ donationId, onCancel, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: 'Good',
        pickup_time: '10:00 AM - 12:00 PM'
    });

    useEffect(() => {
        const fetchDonation = async () => {
            if (!donationId) return;
            try {
                const { data, error } = await supabase
                    .from('donations')
                    .select('*')
                    .eq('id', donationId)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        category: data.category || '',
                        condition: data.condition || 'Good',
                        pickup_time: data.pickup_time || '10:00 AM - 12:00 PM'
                    });
                    setImagePreviews(data.image_urls || []);
                }
            } catch (err) {
                console.error('Error fetching donation for edit:', err);
            } finally {
                setFetching(false);
            }
        };

        fetchDonation();
    }, [donationId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setImageFiles(prev => [...prev, ...files]);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (loading) return;
        if (!formData.title || !formData.category) {
            alert('Please fill in required fields');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            let finalUrls = [...imagePreviews.filter(url => url.startsWith('http'))];

            // Upload new images
            for (const file of imageFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('donation-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('donation-images')
                    .getPublicUrl(filePath);

                finalUrls.push(publicUrl);
            }

            const { error: updateError } = await supabase
                .from('donations')
                .update({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    condition: formData.condition,
                    image_urls: finalUrls,
                    pickup_time: formData.pickup_time,
                    updated_at: new Date().toISOString()
                })
                .eq('id', donationId);

            if (updateError) throw updateError;
            onSuccess();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Error updating donation');
        } finally {
            setLoading(false);
        }
    };

    const timeSlots = [
        "08:00 AM - 10:00 AM",
        "10:00 AM - 12:00 PM",
        "12:00 PM - 02:00 PM",
        "02:00 PM - 04:00 PM",
        "04:00 PM - 06:00 PM"
    ];

    if (fetching) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-brand-muted">Loading listing data...</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-brand-muted">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h2 className="text-3xl font-black text-brand-text dark:text-white">Edit Listing</h2>
                    <p className="text-brand-muted dark:text-gray-400">Update your donation details.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-brand-surface-dark p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Upload Photos</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {imagePreviews.map((preview, idx) => (
                                <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-100 dark:border-gray-800">
                                    <img src={preview} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 size-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => document.getElementById('imageInput')?.click()}
                                className="aspect-square bg-gray-50 dark:bg-brand-dark border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all"
                            >
                                <span className="material-symbols-outlined text-3xl text-gray-400">add_a_photo</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase mt-2">Add Photo</span>
                                <input
                                    id="imageInput"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Item Title</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Category</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 appearance-none font-bold"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Furniture">Furniture</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Books">Books</option>
                                <option value="Household">Household</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Condition</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 appearance-none font-bold"
                                value={formData.condition}
                                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                            >
                                <option>New</option>
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Fair</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Available Pickup Time</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {timeSlots.map(slot => (
                                <button
                                    key={slot}
                                    onClick={() => setFormData({ ...formData, pickup_time: slot })}
                                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${formData.pickup_time === slot
                                            ? 'bg-primary border-primary text-primary-deep'
                                            : 'bg-gray-50 dark:bg-brand-dark border-transparent text-brand-muted hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
                        <textarea
                            rows={4}
                            className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 dark:bg-brand-dark text-brand-muted font-bold py-4 rounded-2xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] bg-primary hover:bg-primary-dark text-primary-deep font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditDonation;
