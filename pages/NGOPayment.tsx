import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface NGOPaymentProps {
    onComplete: () => void;
}

const NGOPayment: React.FC<NGOPaymentProps> = ({ onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(false);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Mock payment delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update profile with payment status and final verification
            const { error } = await supabase
                .from('profiles')
                .update({
                    payment_status: 'PAID',
                    verification_status: 'VERIFIED',
                    is_verified: true
                })
                .eq('id', user.id);

            if (error) throw error;

            setPaid(true);
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (err: any) {
            alert(err.message || "An error occurred during payment");
        } finally {
            setLoading(false);
        }
    };

    if (paid) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                <div className="size-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                </div>
                <h2 className="text-4xl font-black text-brand-text dark:text-white mb-2">Payment Successful!</h2>
                <p className="text-brand-muted font-bold text-lg">Activating your verified NGO account...</p>
                <div className="mt-8 flex gap-2">
                    <div className="size-2 bg-emerald-500 rounded-full animate-bounce"></div>
                    <div className="size-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="size-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-brand-background dark:bg-brand-dark flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-brand-surface-dark rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-500">
                <div className="p-10 lg:p-12 flex flex-col items-center">
                    <div className="size-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                        <span className="material-symbols-outlined text-4xl material-symbols-filled">check_circle</span>
                    </div>
                    <h1 className="text-3xl font-black text-brand-text dark:text-white">Admin Approved!</h1>
                    <p className="text-brand-muted dark:text-gray-400 mt-2 text-center text-sm font-medium">
                        Your organization has been verified. Complete the one-time registration fee to unlock all platform features.
                    </p>

                    <div className="w-full bg-gray-50 dark:bg-brand-dark rounded-2xl p-6 my-8 flex items-center justify-between border border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Fee</p>
                            <p className="text-sm font-bold mt-1">Full Lifetime Access</p>
                        </div>
                        <p className="text-2xl font-black text-brand-text dark:text-white">Rs. 499/-</p>
                    </div>

                    <form onSubmit={handlePayment} className="w-full space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Card Details</label>
                            <div className="bg-gray-50 dark:bg-brand-dark rounded-xl px-5 py-3.5 border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <input required type="text" placeholder="4242 4242 4242 4242" className="bg-transparent border-none p-0 w-full focus:ring-0 text-sm font-mono tracking-widest font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input required type="text" placeholder="MM/YY" className="bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm font-mono font-bold" />
                            <input required type="text" placeholder="CVC" className="bg-gray-50 dark:bg-brand-dark border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 text-sm font-mono font-bold" />
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-primary-deep font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <span className="size-5 border-2 border-primary-deep/30 border-t-primary-deep rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    Pay Rs. 499/- & Activate
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-[10px] text-slate-400 mt-6 text-center font-bold uppercase tracking-widest">
                        🛡️ SECURE ENCRYPTED PAYMENT
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NGOPayment;
