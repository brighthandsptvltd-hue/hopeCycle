import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import fullLogo from '../assets/Full Logo.png';

interface LandingProps {
    onGetStarted: () => void;
    onNavigate: (page: string) => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted, onNavigate }) => {
    const [ngos, setNgos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [impactStats, setImpactStats] = useState({
        donationsCount: 10540,
        ngoCount: 520,
        donorsCount: 12000,
        trustScore: 100
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Verified/Approved NGOs for the showcase
            const { data: ngoData, error: ngoError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'NGO')
                .in('verification_status', ['APPROVED', 'VERIFIED'])
                .limit(3);

            if (ngoError) throw ngoError;
            setNgos(ngoData || []);

            // 2. Fetch Real Impact Stats from DB
            const { count: totalDonations } = await supabase
                .from('donations')
                .select('*', { count: 'exact', head: true });

            const { count: totalNGOs } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'NGO')
                .in('verification_status', ['APPROVED', 'VERIFIED']);

            const { count: totalDonors } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'DONOR');

            setImpactStats({
                donationsCount: (totalDonations || 0),
                ngoCount: (totalNGOs || 0),
                donorsCount: (totalDonors || 0),
                trustScore: 100
            });

        } catch (err) {
            console.error('Error fetching landing data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-brand-dark overflow-hidden">
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-full px-4 py-1.5 mb-8">
                                    <span className="material-symbols-outlined text-yellow-600 text-sm material-symbols-filled">verified</span>
                                    <span className="text-xs font-bold tracking-wide text-yellow-700 dark:text-yellow-500 uppercase">Trusted by {impactStats.ngoCount === 0 ? '500+' : impactStats.ngoCount + '+'} NGOs</span>
                                </div>
                                <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-brand-text dark:text-white leading-[1.05] mb-8">
                                    Turn Your Excess <br />
                                    into <br />
                                    <span className="text-primary-light">Someone’s <br /> Essentials.</span>
                                </h1>
                                <p className="text-lg text-brand-muted dark:text-gray-400 mb-10 leading-relaxed max-w-lg">
                                    Connect directly with verified NGOs to donate clothes, food, and furniture securely. We handle the logistics so you can focus on the impact.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                    <button onClick={() => onNavigate('login')} className="inline-flex items-center justify-center px-10 py-4 text-base font-bold rounded-xl text-white bg-primary hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95">
                                        Donate Items
                                    </button>
                                    <button onClick={() => onNavigate('signup')} className="inline-flex items-center justify-center px-10 py-4 text-base font-bold rounded-xl text-brand-text dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all active:scale-95">
                                        Register as NGO
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        <img alt="Donor 1" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 object-cover" src="https://picsum.photos/100/100?random=10" />
                                        <img alt="Donor 2" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 object-cover" src="https://picsum.photos/100/100?random=11" />
                                        <img alt="Donor 3" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 object-cover" src="https://picsum.photos/100/100?random=12" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm text-brand-text dark:text-white">{impactStats.donorsCount === 0 ? '12,000+' : impactStats.donorsCount.toLocaleString() + '+'} Donors</span>
                                        <div className="flex text-yellow-400">
                                            <span className="material-symbols-outlined text-[14px] material-symbols-filled">star</span>
                                            <span className="material-symbols-outlined text-[14px] material-symbols-filled">star</span>
                                            <span className="material-symbols-outlined text-[14px] material-symbols-filled">star</span>
                                            <span className="material-symbols-outlined text-[14px] material-symbols-filled">star</span>
                                            <span className="material-symbols-outlined text-[14px] material-symbols-filled">star</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] blur-2xl group-hover:bg-primary/20 transition-all duration-700"></div>
                                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-100">
                                    <img alt="Smiling donor with box" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1594708767771-a7502209ff51?q=80&w=1500&auto=format&fit=crop" />
                                    <div className="absolute bottom-8 left-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 rounded-[1.5rem] shadow-xl border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1">Impact Verified</p>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary-light material-symbols-filled">verified_user</span>
                                            <span className="font-bold text-brand-text dark:text-white text-sm">Safe & Secure</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Trusted Partners Section */}
                <section id="browse-ngos" className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
                            <div className="max-w-xl">
                                <h2 className="text-4xl md:text-5xl font-black text-brand-text dark:text-white mb-4 tracking-tight">Our Trusted Partners</h2>
                                <p className="text-brand-muted dark:text-gray-400 font-medium text-lg leading-relaxed">
                                    Every NGO on our platform undergoes a rigorous 4-step verification process to ensure your donations reach those who truly need them.
                                </p>
                            </div>
                            <button className="px-6 py-3 bg-gray-50 dark:bg-brand-surface-dark text-xs font-black uppercase tracking-widest rounded-xl border border-gray-100 dark:border-gray-800 hover:text-primary transition-all active:scale-95">
                                Show All Network
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid md:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-64 bg-gray-100 dark:bg-brand-surface-dark rounded-[2.5rem] animate-pulse"></div>
                                ))}
                            </div>
                        ) : ngos.length === 0 ? (
                            <div className="p-20 text-center bg-gray-50 dark:bg-brand-surface-dark rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-4">volunteer_activism</span>
                                <p className="text-brand-muted font-bold uppercase tracking-widest text-xs">Partner network initializing...</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-8">
                                {ngos.map((ngo) => (
                                    <div key={ngo.id} className="group bg-white dark:bg-brand-surface-dark p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                        <div className="flex items-center gap-6 mb-10">
                                            <div className="size-16 rounded-2xl bg-gray-50 dark:bg-brand-dark flex items-center justify-center font-black text-2xl text-primary border border-gray-100 dark:border-gray-700">
                                                {ngo.organization_name ? ngo.organization_name[0] : (ngo.full_name ? ngo.full_name[0] : '?')}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-brand-text dark:text-white truncate max-w-[150px]">{ngo.organization_name || ngo.full_name}</h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="material-symbols-outlined text-sm text-emerald-500 material-symbols-filled">verified</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified Partner</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-10">
                                            <div className="flex items-center gap-3 text-brand-muted dark:text-gray-400">
                                                <span className="material-symbols-outlined text-lg">location_on</span>
                                                <span className="text-sm font-bold truncate">{(ngo.location || 'Hyderabad, India').split(',')[0]}, {(ngo.location || 'Hyderabad, India').split(',')[1] || 'India'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-brand-muted dark:text-gray-400">
                                                <span className="material-symbols-outlined text-lg">package_2</span>
                                                <span className="text-sm font-bold">4.8k+ Items Distributed</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onNavigate('login')}
                                            className="w-full py-4 bg-gray-50 dark:bg-brand-dark hover:bg-gray-100 dark:hover:bg-white/5 text-brand-text dark:text-white font-black rounded-2xl transition-all"
                                        >
                                            View NGO Profile
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Impact Section */}
                <section id="impact" className="bg-primary-deep py-24 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
                            <div className="max-w-xl">
                                <p className="text-primary-light font-black text-xs uppercase tracking-[0.2em] mb-2">Our Impact</p>
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Making a tangible difference across communities.</h2>
                            </div>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Last updated: Today</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">inventory_2</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-primary-light text-primary-deep px-2 py-1 rounded-lg uppercase tracking-widest">+12% this week</span>
                                </div>
                                <h3 className="text-4xl font-black text-white mb-1">{impactStats.donationsCount.toLocaleString()}</h3>
                                <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Items Donated Safely</p>
                            </div>
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">groups</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-yellow-400 text-primary-deep px-2 py-1 rounded-lg uppercase tracking-widest">Scale</span>
                                </div>
                                <h3 className="text-4xl font-black text-white mb-1">{impactStats.ngoCount}+</h3>
                                <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Verified NGO Partners</p>
                            </div>
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">security</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-white/10 text-white px-2 py-1 rounded-lg uppercase tracking-widest">Trust score</span>
                                </div>
                                <h3 className="text-4xl font-black text-white mb-1">{impactStats.trustScore}%</h3>
                                <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Verified Direct Collection Protocols</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="how-it-works" className="py-24 bg-brand-background dark:bg-brand-dark/50">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-4">Simple Process</p>
                        <h2 className="text-4xl font-black text-brand-text dark:text-white mb-4">How HopeCycle Works</h2>
                        <p className="text-brand-muted dark:text-gray-400 max-w-2xl mx-auto mb-20">
                            Making a difference shouldn't be complicated. Follow these three steps to help your community.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connecting dashed line for large screens */}
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px border-t-2 border-dashed border-gray-200 dark:border-gray-800 -translate-y-1/2 z-0"></div>

                            <div className="bg-white dark:bg-brand-surface-dark p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 relative z-10 flex flex-col items-center group hover:-translate-y-2 transition-transform duration-500">
                                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-3xl">photo_camera</span>
                                </div>
                                <h3 className="text-xl font-black mb-4">List Your Items</h3>
                                <p className="text-sm text-brand-muted dark:text-gray-400 leading-relaxed">
                                    Take a photo, add a brief description, and list your donation items in under 2 minutes.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-brand-surface-dark p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 relative z-10 flex flex-col items-center group hover:-translate-y-2 transition-transform duration-500">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-primary-deep text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Step 2</div>
                                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-3xl material-symbols-filled">favorite</span>
                                </div>
                                <h3 className="text-xl font-black mb-4">Select an NGO</h3>
                                <p className="text-sm text-brand-muted dark:text-gray-400 leading-relaxed">
                                    Browse verified causes near you and choose who you want to support directly.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-brand-surface-dark p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 relative z-10 flex flex-col items-center group hover:-translate-y-2 transition-transform duration-500">
                                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-3xl">local_shipping</span>
                                </div>
                                <h3 className="text-xl font-black mb-4">Coordinate NGO Collection</h3>
                                <p className="text-sm text-brand-muted dark:text-gray-400 leading-relaxed">
                                    Once an NGO accepts, you and the NGO will directly coordinate the collection of your listed items.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-24">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <div className="max-w-2xl">
                                <h2 className="text-4xl font-black text-brand-text dark:text-white mb-4 tracking-tight">What Can You Donate?</h2>
                                <p className="text-brand-muted dark:text-gray-400">We accept a wide range of items in good condition to support various NGO missions.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Clothes', icon: 'checkroom', desc: 'Men, Women, Kids', color: 'bg-primary/5' },
                                { label: 'Electronics', icon: 'laptop_chromebook', desc: 'Gadgets, Appliances', color: 'bg-primary/5' },
                                { label: 'Furniture', icon: 'chair_alt', desc: 'Tables, Chairs, Beds', color: 'bg-primary/5' },
                                { label: 'Food', icon: 'restaurant', desc: 'Non-perishables', color: 'bg-primary/5' }
                            ].map((cat) => (
                                <div key={cat.label} className="bg-brand-background dark:bg-brand-surface-dark p-10 rounded-[2.5rem] border border-gray-50 dark:border-gray-800 flex flex-col items-center text-center group hover:bg-white transition-all shadow-sm hover:shadow-xl">
                                    <div className={`size-16 rounded-2xl flex items-center justify-center text-brand-muted mb-8 ${cat.color} group-hover:scale-110 transition-transform`}>
                                        <span className="material-symbols-outlined text-4xl">{cat.icon}</span>
                                    </div>
                                    <h4 className="text-xl font-black mb-2">{cat.label}</h4>
                                    <p className="text-xs text-brand-muted font-bold uppercase tracking-widest">{cat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Partners Strip */}
                <section className="py-12 border-y border-gray-100 dark:border-gray-800 bg-gray-50/30">
                    <div className="max-w-7xl mx-auto px-4">
                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Trusted by Leading Organizations</p>
                        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-24 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                            <div className="flex items-center gap-2 font-black text-lg text-brand-text dark:text-white">
                                <span className="material-symbols-outlined">eco</span> EcoWorld
                            </div>
                            <div className="flex items-center gap-2 font-black text-lg text-brand-text dark:text-white">
                                <span className="material-symbols-outlined">public</span> GlobalAid
                            </div>
                            <div className="flex items-center gap-2 font-black text-lg text-brand-text dark:text-white">
                                <span className="material-symbols-outlined">groups</span> CommunityFirst
                            </div>
                            <div className="flex items-center gap-2 font-black text-lg text-brand-text dark:text-white">
                                <span className="material-symbols-outlined">anchor</span> SafeHarbor
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-24 px-4">
                    <div className="max-w-6xl mx-auto bg-primary-deep rounded-[4rem] p-12 lg:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 size-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                        <div className="absolute bottom-0 left-0 size-96 bg-primary-light/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>

                        <div className="relative z-10">
                            <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight">Ready to make a difference?</h2>
                            <p className="text-lg opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">
                                Join thousands of donors who are transforming lives every single day. Small actions lead to big impacts.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button onClick={() => onNavigate('signup')} className="w-full sm:w-auto px-10 py-5 bg-yellow-400 hover:bg-yellow-500 text-primary-deep font-black rounded-2xl transition-all shadow-xl shadow-yellow-400/20 active:scale-95">
                                    Start Donating Now
                                </button>
                                <button className="w-full sm:w-auto px-10 py-5 border border-white/20 hover:bg-white/10 text-white font-black rounded-2xl transition-all active:scale-95">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Comprehensive Footer */}
            <footer className="bg-white dark:bg-brand-dark pt-24 pb-12 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
                        <div className="lg:col-span-4 space-y-8">
                            <img src={fullLogo} alt="HopeCycle Logo" className="h-10 w-auto" />
                            <p className="text-brand-muted dark:text-gray-400 leading-relaxed max-w-xs">
                                Empowering communities by connecting excess resources with those who need them most. Secure, transparent, and impactful.
                            </p>
                            <div className="flex items-center gap-4">
                                {[
                                    { icon: 'thumb_up', label: 'Like' },
                                    { icon: 'share', label: 'Share' },
                                    { icon: 'mail', label: 'Contact' }
                                ].map(social => (
                                    <button key={social.label} className="size-10 rounded-xl bg-gray-50 dark:bg-brand-surface-dark border border-gray-100 dark:border-gray-800 flex items-center justify-center text-brand-muted hover:text-primary transition-all">
                                        <span className="material-symbols-outlined text-lg">{social.icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <h5 className="font-black text-sm uppercase tracking-widest text-brand-text dark:text-white">Platform</h5>
                            <ul className="space-y-4 text-sm font-bold text-brand-muted">
                                <li><button className="hover:text-primary transition-colors">Browse NGOs</button></li>
                                <li><button className="hover:text-primary transition-colors">How it Works</button></li>
                                <li><button className="hover:text-primary transition-colors">Impact Stories</button></li>
                                <li><button className="hover:text-primary transition-colors">Pricing for NGOs</button></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <h5 className="font-black text-sm uppercase tracking-widest text-brand-text dark:text-white">Company</h5>
                            <ul className="space-y-4 text-sm font-bold text-brand-muted">
                                <li><button className="hover:text-primary transition-colors">About Us</button></li>
                                <li><button className="hover:text-primary transition-colors">Careers</button></li>
                                <li><button className="hover:text-primary transition-colors">Press</button></li>
                                <li><button className="hover:text-primary transition-colors">Contact</button></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <h5 className="font-black text-sm uppercase tracking-widest text-brand-text dark:text-white">Stay Updated</h5>
                            <p className="text-sm text-brand-muted dark:text-gray-400">Get the latest impact reports and news directly to your inbox.</p>
                            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 bg-gray-50 dark:bg-brand-surface-dark border-gray-200 dark:border-gray-800 rounded-xl px-5 py-3 text-sm focus:ring-primary focus:border-primary"
                                />
                                <button className="px-6 py-3 bg-primary-deep text-white font-black rounded-xl hover:bg-black transition-all">
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-brand-muted dark:text-gray-400 text-xs font-bold">© 2026 HopeCycle Inc. All rights reserved.</p>
                        <div className="flex gap-8 text-xs font-bold text-brand-muted">
                            <button className="hover:text-primary">Privacy Policy</button>
                            <button className="hover:text-primary">Terms of Service</button>
                            <button className="hover:text-primary">Cookie Policy</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
