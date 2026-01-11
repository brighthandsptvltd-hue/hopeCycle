import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface NGOVerificationFormProps {
    onComplete: () => void;
}

const NGOVerificationForm: React.FC<NGOVerificationFormProps> = ({ onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        orgName: '',
        repName: '',
        certNum: '',
        address: '',
        email: '',
        phone: ''
    });

    React.useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        orgName: profile.organization_name || '',
                        repName: profile.full_name || '',
                        address: profile.location || '',
                        email: user.email || ''
                    }));
                }
            }
        };
        fetchInitialData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Please upload your NGO Certificate image.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            let certImageUrl = '';

            // 1. Upload Certificate Image
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('verifications')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('verifications')
                .getPublicUrl(fileName);

            certImageUrl = publicUrl;

            // 2. Update profile with verification details and status
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    organization_name: formData.orgName,
                    representative_name: formData.repName,
                    phone_number: formData.phone,
                    certificate_number: formData.certNum,
                    certificate_url: certImageUrl,
                    location: formData.address,
                    verification_status: 'PENDING',
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Optionally store the certificate details in a dedicated table if you have one, 
            // but for now we'll just proceed as requested.

            onComplete();
        } catch (err: any) {
            alert(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] bg-brand-background dark:bg-brand-dark flex flex-col items-center justify-center p-6 py-12">
            <div className="max-w-2xl w-full bg-white dark:bg-brand-surface-dark rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-10 lg:p-12">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                            <span className="material-symbols-outlined text-3xl">verified_user</span>
                        </div>
                        <h1 className="text-3xl font-black text-brand-text dark:text-white">Organization Verification</h1>
                        <p className="text-brand-muted dark:text-gray-400 mt-2 max-w-sm">
                            Please provide your NGO's legal details for verification. All fields marked with * are mandatory.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Organization Name *</label>
                                <input required type="text" value={formData.orgName} onChange={e => setFormData({ ...formData, orgName: e.target.value })} placeholder="Global Welfare Initiative" className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Authorized Representative *</label>
                                <input required type="text" value={formData.repName} onChange={e => setFormData({ ...formData, repName: e.target.value })} placeholder="Johnathan Doe" className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Certificate Number *</label>
                                <input required type="text" value={formData.certNum} onChange={e => setFormData({ ...formData, certNum: e.target.value })} placeholder="NGO-88291-NY" className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">NGO Certificate (Image) *</label>
                                <div className="relative">
                                    <input required type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div className={`w-full bg-gray-50 dark:bg-brand-dark border-2 border-dashed ${file ? 'border-primary' : 'border-slate-200 dark:border-gray-700'} rounded-xl px-5 py-3 flex items-center gap-3 text-slate-400 text-sm`}>
                                        <span className={`material-symbols-outlined text-xl ${file ? 'text-primary' : ''}`}>
                                            {file ? 'check_circle' : 'cloud_upload'}
                                        </span>
                                        <span className={`truncate ${file ? 'text-brand-text dark:text-white font-bold' : ''}`}>
                                            {file ? file.name : 'Upload Certificate Image'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Physical Address *</label>
                            <textarea required rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Purpose Lane, Brooklyn, NY 11201" className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm resize-none font-bold" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Organization Email (Optional)</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="verify@globalwelfare.org" className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Phone Number *</label>
                                <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-primary hover:bg-primary-dark text-primary-deep font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="size-5 border-2 border-primary-deep/30 border-t-primary-deep rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        Submit for Verification
                                        <span className="material-symbols-outlined text-[20px]">send</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="bg-gray-50 dark:bg-brand-dark/30 p-6 text-center border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold text-brand-muted">
                        Need help? <a href="#" className="text-primary hover:underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NGOVerificationForm;
