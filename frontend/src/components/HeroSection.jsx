import React, { useState, useEffect } from 'react';
import { ArrowRight, Download, Bus, Clock, MapPin, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const quickLinks = [
    { label: 'Bandara SIM', path: '/rute' },
    { label: 'Kampus Darussalam', path: '/rute' },
    { label: 'Pelabuhan Ulee Lheue', path: '/rute' },
    { label: 'Pantai Lampuuk', path: '/rute' },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Photo Full-Width with parallax */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      >
        <img
          src="https://dishub.acehprov.go.id/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-24-at-20.39.53.jpeg"
          alt="Armada Bus Trans Koetaradja"
          className="w-full h-full object-cover scale-110"
        />
      </div>

      {/* Overlay gelap elegan */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900/90 via-slate-900/75 to-slate-900/40" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-20 w-full container mx-auto px-4 pt-28 pb-24">
        <div className="max-w-3xl">

          {/* Tag status */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-semibold tracking-wide uppercase">
              Layanan Aktif · 06.30 – 18.30 WIB
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-none tracking-tight mb-4">
            Trans<br />
            <span className="text-sky-400">Koetaradja</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl lg:text-2xl text-slate-300 font-medium mb-3">
            Transportasi Publik Modern Banda Aceh
          </p>
          <p className="text-base text-slate-400 leading-relaxed mb-8 max-w-xl">
            Bus kota bersubsidi Pemerintah Aceh — melayani 14 rute dengan armada modern, ber-AC, dan 100% gratis untuk seluruh warga dan wisatawan.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link to="/rute">
              <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-7 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/25 text-base">
                <MapPin className="w-5 h-5" />
                Jelajahi Rute & Halte
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/download">
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-200 text-base backdrop-blur-sm">
                <Download className="w-5 h-5" />
                Download Aplikasi
              </button>
            </Link>
          </div>

          {/* Quick destination chips */}
          <div className="flex flex-wrap gap-2 mb-12">
            <span className="text-slate-400 text-sm self-center mr-1">Tujuan populer:</span>
            {quickLinks.map((q) => (
              <Link
                key={q.label}
                to={q.path}
                className="text-sm px-4 py-1.5 rounded-full border border-slate-600 text-slate-300 hover:border-sky-400 hover:text-sky-400 transition-all duration-200"
              >
                {q.label}
              </Link>
            ))}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 sm:gap-10 border-t border-white/10 pt-8">
            <div className="flex items-center gap-2 text-white">
              <Bus className="w-5 h-5 text-sky-400" />
              <div>
                <div className="text-xl font-bold leading-none">50+</div>
                <div className="text-xs text-slate-400 mt-0.5">Armada Bus</div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-5 h-5 text-sky-400" />
              <div>
                <div className="text-xl font-bold leading-none">14</div>
                <div className="text-xs text-slate-400 mt-0.5">Rute Koridor</div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-sky-400" />
              <div>
                <div className="text-xl font-bold leading-none">12 Jam</div>
                <div className="text-xs text-slate-400 mt-0.5">Setiap Hari</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-slate-400">
        <span className="text-xs tracking-widest uppercase">Gulir</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
