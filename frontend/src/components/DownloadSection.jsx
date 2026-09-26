import React from 'react';
import { Smartphone, MapPin, Clock, Bell } from 'lucide-react';

const DownloadSection = () => {
  const handleDownload = (platform) => {
    if (platform === 'ios') {
      window.open('https://apps.apple.com/id/iphone/search?l=id&term=Trans%20Koetaradja', '_blank');
    } else {
      window.open('https://play.google.com/store/apps/details?id=ngi.muchi.koetaradja&hl=id&pli=1', '_blank');
    }
  };

  const features = [
    { icon: MapPin, title: 'Live Tracking', desc: 'Lacak posisi bus secara real-time di peta' },
    { icon: Clock, title: 'Jadwal Akurat', desc: 'Lihat jadwal lengkap dan estimasi waktu tiba' },
    { icon: Bell, title: 'Notifikasi Pengingat', desc: 'Terima update penting tentang layanan' },
  ];

  return (
    <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              <span className="text-sky-400 text-sm font-semibold uppercase tracking-widest">Aplikasi Mobile</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mt-2 mb-4 leading-tight">
                Pantau Bus Real-Time<br />dengan Aplikasi
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Dapatkan informasi jadwal bus, waktu kedatangan, dan tracking bus secara real-time langsung di smartphone Anda.
              </p>

              <div className="space-y-5 mb-8">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{title}</div>
                      <div className="text-slate-400 text-sm mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleDownload('android')}
                  className="flex items-center justify-center gap-2.5 bg-white text-slate-900 font-bold px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997zm11.4045-6.02l1.9973-3.4592c.1099-.1902.0447-.4334-.1455-.5433-.1903-.1098-.4334-.0446-.5433.1456l-2.0223 3.5019C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4478c-.1099-.1902-.3531-.2554-.5433-.1456-.1902.1099-.2554.3531-.1455.5433l1.9973 3.4592C2.6197 11.1867.4433 14.6589 0 18.761h24c-.4433-4.1021-2.6197-7.5743-6.1185-9.4394zM24 24H0v-2h24v2z"/>
                  </svg>
                  <span>Google Play</span>
                </button>
                <button
                  onClick={() => handleDownload('ios')}
                  className="flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span>App Store</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">* Gratis untuk Android dan iOS</p>
            </div>

            {/* Right - Phone mockup */}
            <div className="hidden lg:flex justify-center">
              <div className="relative" style={{ width: '240px' }}>
                <div className="bg-slate-800 border border-slate-700 rounded-[2.5rem] p-2.5 shadow-2xl">
                  <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="h-7 bg-sky-600 flex items-center justify-between px-5 text-white text-xs">
                      <span>9:41</span><span>100%</span>
                    </div>
                    {/* App content */}
                    <div className="p-4 bg-gradient-to-b from-sky-600 to-sky-500 min-h-[480px]">
                      <div className="bg-white rounded-2xl p-4 mb-3 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-sky-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Trans Koetaradja</p>
                            <p className="text-xs text-gray-400">Tracking Real-time</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-gray-900">Koridor 1</span>
                          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">Aktif</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Clock className="w-3 h-3" /><span>5 menit lagi</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full">
                          <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: '70%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
    </section>
  );
};

export default DownloadSection;
