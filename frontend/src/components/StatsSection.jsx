import React from 'react';
import { stats } from '../mockData';

const StatsSection = () => {
  return (
    <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sky-400 text-sm font-semibold uppercase tracking-widest">
            Statistik Layanan
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mt-2">
            Trans Koetaradja dalam Angka
          </h2>
          <p className="text-slate-400 mt-3 text-base">
            Komitmen nyata melayani mobilitas warga Aceh
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800 rounded-2xl overflow-hidden">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-slate-950 hover:bg-slate-900 transition-colors duration-300 p-10 text-center group"
            >
              <div className="text-5xl lg:text-6xl font-extrabold text-sky-400 mb-2 group-hover:scale-105 transition-transform duration-200 leading-none">
                {stat.value}
              </div>
              <div className="text-base font-semibold text-white mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-slate-400">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle accent line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
    </section>
  );
};

export default StatsSection;
