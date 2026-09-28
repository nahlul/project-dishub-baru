import React from 'react';
import { stats } from '../mockData';
import { Route, Bus, ShieldCheck, Clock } from 'lucide-react';

const STAT_ICONS = [
  { icon: Route, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  { icon: Bus, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
  { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
];

const StatsSection = () => {
  return (
    <section className="py-16 sm:py-20 bg-slate-50/80 border-t border-slate-200/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/70 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Kilas Operasional</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trans Koetaradja dalam Angka
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2.5 leading-relaxed">
            Komitmen nyata Pemerintah Aceh menghadirkan transportasi publik yang nyaman, aman, dan 100% bebas biaya bagi seluruh lapisan masyarakat.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const meta = STAT_ICONS[index % STAT_ICONS.length];
            const Icon = meta.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200 text-center flex flex-col items-center justify-between group"
              >
                <div className={`w-12 h-12 rounded-xl ${meta.bg} border flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200`}>
                  <Icon className={`w-6 h-6 ${meta.color}`} />
                </div>

                <div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-sky-600 transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 leading-snug">
                    {stat.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
