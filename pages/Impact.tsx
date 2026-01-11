
import React from 'react';
import { UserRole } from '../types';

interface ImpactProps {
  role: UserRole;
}

const Impact: React.FC<ImpactProps> = ({ role }) => {
  return (
    <div className="space-y-10 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-brand-text dark:text-white tracking-tight">Your Impact Report</h2>
          <p className="text-brand-muted dark:text-gray-400 mt-2 text-lg">See the difference your generosity makes across the globe.</p>
        </div>
        <button className="px-6 py-3 bg-white dark:bg-brand-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
          <span className="material-symbols-outlined">download</span>
          Export Full Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'CO2 Saved', value: '425kg', icon: 'eco', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Water Saved', value: '1.2k L', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Lives Affected', value: '142', icon: 'groups', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Platform Rank', value: '#12', icon: 'military_tech', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' }
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-brand-surface-dark p-8 rounded-[2.5rem] border border-gray-50 dark:border-gray-800 shadow-sm flex flex-col gap-4">
            <div className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-primary-deep p-10 rounded-[3rem] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <h3 className="text-2xl font-black mb-2">Eco-Sustainability Goal</h3>
          <p className="text-emerald-100/70 mb-8 max-w-xs">You're 85% of the way to becoming a Platinum Eco-Donor.</p>
          <div className="space-y-4">
             <div className="flex justify-between text-sm font-bold">
               <span>Item Recycling Rate</span>
               <span>92%</span>
             </div>
             <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-primary w-[92%]"></div>
             </div>
             <p className="text-xs italic opacity-60">Calculated based on items repurposed vs discarded.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-brand-surface-dark p-10 rounded-[3rem] border border-gray-50 dark:border-gray-800">
           <h3 className="text-2xl font-black mb-8">Social Contributions</h3>
           <div className="space-y-6">
              {[
                { label: 'Children\'s Education', value: 45 },
                { label: 'Disaster Relief', value: 30 },
                { label: 'Health Support', value: 15 },
                { label: 'Elderly Care', value: 10 }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-6">
                   <span className="text-sm font-bold w-40 text-brand-muted">{item.label}</span>
                   <div className="flex-1 h-2 bg-gray-100 dark:bg-brand-dark rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{width: `${item.value}%`}}></div>
                   </div>
                   <span className="text-sm font-black w-10">{item.value}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Impact;
