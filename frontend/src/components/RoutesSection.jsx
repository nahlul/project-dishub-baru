import React, { useState } from 'react';
import { routes } from '../mockData';
import { MapPin, Clock, Navigation, Route } from 'lucide-react';

const getTypeBadgeStyle = (type) => {
  switch (type) {
    case 'koridor': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    case 'feeder': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'campus': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    case 'new': return 'bg-green-500/10 text-green-400 border border-green-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'koridor': return 'Koridor';
    case 'feeder': return 'Feeder';
    case 'campus': return 'Trans Kampus';
    case 'new': return 'Rute Baru 2025';
    default: return type;
  }
};

const TABS = [
  { value: 'all', label: 'Semua', count: 14 },
  { value: 'koridor', label: 'Koridor', count: 6 },
  { value: 'feeder', label: 'Feeder', count: 4 },
  { value: 'campus', label: 'Trans Kampus', count: 1 },
  { value: 'new', label: 'Rute Baru', count: 3 },
];

const RoutesSection = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all' ? routes : routes.filter(r => r.type === activeTab);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sky-500 text-sm font-semibold uppercase tracking-widest">Jaringan Layanan</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">Rute &amp; Koridor</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Trans Koetaradja melayani 14 rute di wilayah Banda Aceh dan Aceh Besar, termasuk 3 rute baru tahun 2025
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.value
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeTab === tab.value ? 'text-sky-100' : 'text-gray-400'}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {filtered.map((route) => (
            <div
              key={route.id}
              className="group border border-gray-100 rounded-2xl p-5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 bg-white"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-500 transition-colors duration-300">
                    <Route className="w-4 h-4 text-sky-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">{route.name}</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${getTypeBadgeStyle(route.type)}`}>
                  {getTypeLabel(route.type)}
                </span>
              </div>

              <p className="text-sm font-medium text-sky-600 mb-4">{route.route}</p>

              <div className="space-y-2 border-t border-gray-50 pt-3">
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span><span className="font-medium text-gray-700">Dari:</span> {route.from}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                  <span><span className="font-medium text-gray-700">Ke:</span> {route.to}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{route.operational}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Navigation className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{route.distance} &nbsp;·&nbsp; ±{route.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoutesSection;
