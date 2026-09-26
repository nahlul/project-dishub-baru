import React from 'react';
import { facilities } from '../mockData';
import { ShieldCheck, Users, Clock, MapPin, Wifi, Smartphone } from 'lucide-react';

const iconComponents = { ShieldCheck, Users, Clock, MapPin, Wifi, Smartphone };

const FacilitiesSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-sky-500 text-sm font-semibold uppercase tracking-widest">Keunggulan Layanan</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">Fasilitas &amp; Keunggulan</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Nikmati perjalanan nyaman dengan berbagai fasilitas modern yang kami sediakan
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {facilities.map((facility, index) => {
            const Icon = iconComponents[facility.icon];
            return (
              <div
                key={index}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-sky-50 group-hover:bg-sky-500 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                  {Icon && <Icon className="w-6 h-6 text-sky-500 group-hover:text-white transition-colors duration-300" />}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{facility.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{facility.description}</p>
              </div>
            );
          })}
        </div>

        {/* Safety note */}
        <div className="mt-12 max-w-4xl mx-auto border-l-4 border-sky-500 bg-white rounded-r-2xl p-6">
          <h4 className="font-bold text-gray-900 mb-1">Standar Keselamatan Terjamin</h4>
          <p className="text-sm text-gray-500 leading-relaxed">
            Seluruh armada Trans Koetaradja telah melalui inspeksi keselamatan (rampcheck) dan pemeriksaan berkala.
            Dilengkapi sopir profesional berpengalaman untuk pelayanan terbaik.
          </p>
        </div>

      </div>
    </section>
  );
};

export default FacilitiesSection;
