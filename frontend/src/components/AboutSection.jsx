import React, { useState, useEffect } from 'react';
import { CheckCircle2, Award, Users, Shield, Calendar, TrendingUp } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

const milestones = [
  {
    year: '2016',
    icon: Calendar,
    title: 'Awal Mula Operasional',
    desc: 'Trans Koetaradja resmi diluncurkan pada 4 Mei 2016 oleh Gubernur Aceh dr. H. Zaini Abdullah. Dimulai dengan 1 koridor utama dan 25 unit bus hibah Kemenhub.',
  },
  {
    year: '2017',
    icon: TrendingUp,
    title: 'Ekspansi Rute Pertama',
    desc: 'Koridor bertambah menjadi 3 rute, 30 bus. Lebih dari 1,25 juta penumpang dalam setahun.',
  },
  {
    year: '2018',
    icon: Award,
    title: 'Pembentukan Pengelola Resmi',
    desc: 'Dibentuk UPTD Angkutan Massal Trans Kutaraja. Koridor jadi 5 rute, 4 juta+ penumpang.',
  },
  {
    year: '2019',
    icon: CheckCircle2,
    title: 'Konektivitas Bandara',
    desc: 'Masuk ke Bandara Sultan Iskandar Muda. Menjadi penghubung antar-moda dengan 4,25 juta penumpang.',
  },
  {
    year: '2025',
    icon: TrendingUp,
    title: 'Beroperasi Kembali dengan 14 Rute',
    desc: 'Kembali beroperasi dengan 14 rute (termasuk 3 rute baru) dan 59 unit bus. Tulang punggung mobilitas Banda Aceh dan Aceh Besar.',
    highlight: true,
  },
  {
    year: '2026',
    icon: Shield,
    title: 'Transformasi Digital',
    desc: 'Platform digital resmi dengan tracking real-time, informasi rute daring, dan peta halte interaktif. Tetap 100% gratis.',
    highlight: true,
  },
];

const AboutSection = () => {
  const [aboutContent, setAboutContent] = useState('');

  useEffect(() => {
    settingsAPI.getAbout().then(({ data }) => {
      setAboutContent(data.content || '');
    }).catch(() => {});
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-sky-500 text-sm font-semibold uppercase tracking-widest">Profil Layanan</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">Tentang Trans Koetaradja</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Sistem transportasi publik yang melayani masyarakat Banda Aceh dan Aceh Besar dengan komitmen kualitas terbaik.
          </p>
        </div>

        {/* Dynamic content */}
        {aboutContent && (
          <div className="mb-14 bg-gray-50 border border-gray-100 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="text-gray-600 leading-relaxed space-y-3">
              {aboutContent.split('\n').map((p, i) => p.trim() && <p key={i}>{p}</p>)}
            </div>
          </div>
        )}

        {/* 2-col intro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-20">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://penanews.co.id/wp-content/uploads/2025/01/images-13-700x350.jpeg"
              alt="Bus Trans Koetaradja"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 right-4 bg-sky-500 text-white px-5 py-3 rounded-xl shadow-lg">
              <div className="text-2xl font-bold leading-none">2025</div>
              <div className="text-xs text-sky-100 mt-0.5">Beroperasi Kembali</div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Melayani dengan Sepenuh Hati</h3>
            <p className="text-gray-500 leading-relaxed mb-4">
              Trans Koetaradja dikelola Dinas Perhubungan Provinsi Aceh. Hadir sebagai solusi mobilitas yang nyaman, aman, dan 100% gratis bagi seluruh masyarakat dan wisatawan.
            </p>
            <p className="text-gray-500 leading-relaxed mb-6">
              Sejak beroperasi kembali tahun 2025, 3 rute baru ditambahkan untuk menjangkau lebih banyak wilayah strategis Banda Aceh dan Aceh Besar.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: 'Gratis 100%', sub: 'Disubsidi APBA Aceh' },
                { icon: Award, label: '14 Rute', sub: 'Termasuk 3 rute baru 2025' },
                { icon: Users, label: 'Fasilitas Modern', sub: 'AC, WiFi, tracking real-time' },
                { icon: CheckCircle2, label: 'Setiap Hari', sub: 'Termasuk bulan Ramadan' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Icon className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="text-center mb-12">
          <span className="text-sky-500 text-sm font-semibold uppercase tracking-widest">Perjalanan Kami</span>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">Sejarah Trans Koetaradja</h3>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />

          <div className="space-y-8">
            {milestones.map(({ year, icon: Icon, title, desc, highlight }) => (
              <div key={year} className="flex gap-6 items-start pl-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  highlight ? 'bg-sky-500 shadow-md shadow-sky-500/20' : 'bg-white border-2 border-gray-200'
                }`}>
                  <Icon className={`w-4 h-4 ${highlight ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className={`flex-1 rounded-2xl p-5 ${highlight ? 'bg-sky-50 border border-sky-100' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`text-sm font-bold mb-1 ${highlight ? 'text-sky-500' : 'text-gray-400'}`}>{year}</div>
                  <div className="font-semibold text-gray-900 mb-1">{title}</div>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement bar */}
        <div className="mt-14 bg-slate-950 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { val: '10 Tahun', sub: 'Mengabdi untuk Masyarakat' },
              { val: '10 Juta+', sub: 'Total Penumpang Dilayani' },
              { val: '100%', sub: 'Gratis & Berkelanjutan' },
            ].map(({ val, sub }) => (
              <div key={val} className="border-t md:border-t-0 md:border-l border-white/10 first:border-0 pt-6 md:pt-0 md:pl-6 first:pl-0">
                <div className="text-3xl font-extrabold text-sky-400">{val}</div>
                <div className="text-slate-400 text-sm mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutSection;
