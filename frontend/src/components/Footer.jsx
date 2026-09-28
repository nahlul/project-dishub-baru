import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, ShieldCheck, Bus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { settingsAPI } from '@/lib/api';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [contact, setContact] = useState(null);
  const [social, setSocial] = useState(null);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const [contactRes, socialRes] = await Promise.all([
        settingsAPI.getContact(),
        settingsAPI.getSocialMedia(),
      ]);
      setContact(contactRes.data);
      setSocial(socialRes.data);
    } catch (error) {
      console.error('Failed to fetch footer data:', error);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 font-sans relative overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

      {/* Official Government Trust Ribbon */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white tracking-wide">
                  Layanan Resmi Dinas Perhubungan Pemerintah Aceh
                </p>
                <p className="text-[11px] text-slate-400">
                  Dikelola oleh UPTD Angkutan Massal Trans Kutaraja • Banda Aceh & Aceh Besar
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Gratis Tanpa Biaya Tiket</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & About Column (5 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/20">
                TK
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Trans Koetaradja
                </h3>
                <p className="text-[11px] font-semibold text-sky-400 uppercase tracking-widest">
                  Modern Transit Aceh
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed pr-2">
              Sistem angkutan massal bus kota modern bersubsidi penuh Pemerintah Aceh. Menghubungkan pusat pendidikan, kawasan bisnis, fasilitas publik, bandara, dan pelabuhan dengan armada ber-AC yang nyaman dan tepat waktu.
            </p>

            {/* Operational badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div>
                <span className="font-semibold text-white">Jam Operasi: </span>
                <span>{contact?.operational_hours || '06.30 – 18.30 WIB (Setiap Hari)'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links Column (2 cols) */}
          <div className="lg:col-span-2 lg:pl-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 pb-1 border-b border-slate-800/60 inline-block">
              Navigasi
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" />
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/rute" className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" />
                  Rute & Halte
                </Link>
              </li>
              <li>
                <Link to="/tentang" className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" />
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/fasilitas" className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" />
                  Fasilitas Armada
                </Link>
              </li>
              <li>
                <Link to="/berita" className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" />
                  Berita Terkini
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" />
                  Tanya Jawab (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Koridor Populer Column (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 pb-1 border-b border-slate-800/60 inline-block">
              Koridor Utama
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/rute" className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Kopelma Darussalam</span>
                </Link>
              </li>
              <li>
                <Link to="/rute" className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Bandara SIM</span>
                </Link>
              </li>
              <li>
                <Link to="/rute" className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Pelabuhan Ulee Lheue</span>
                </Link>
              </li>
              <li>
                <Link to="/rute" className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Mata Ie & Keutapang</span>
                </Link>
              </li>
              <li>
                <Link to="/rute" className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Pantai Lampuuk</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Official Channels (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 pb-1 border-b border-slate-800/60 inline-block">
              Kontak & Pengaduan
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-slate-300 leading-snug">
                  <p className="font-medium text-white">Dinas Perhubungan Aceh</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {contact?.address || 'Jl. Teuku Nyak Arief No. 209, Banda Aceh, Aceh 23114'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <a
                  href={`https://wa.me/${(contact?.phone || '').replace(/[^0-9]/g, '') || '628116712349'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white font-medium transition-colors"
                >
                  {contact?.phone || '+62 811 6712349'}
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                    WhatsApp Resmi
                  </span>
                </a>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <a
                  href={`mailto:${contact?.email || 'info@transkutaraja.acehprov.go.id'}`}
                  className="text-slate-300 hover:text-white font-medium transition-colors truncate"
                >
                  {contact?.email || 'info@transkutaraja.acehprov.go.id'}
                </a>
              </div>
            </div>

            {/* Social channels */}
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-400 mb-2.5">
                Kanal Informasi Resmi:
              </p>
              <div className="flex items-center gap-2">
                {social?.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-sky-600 border border-slate-800 hover:border-sky-500 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-xs"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {social?.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-pink-600 border border-slate-800 hover:border-pink-500 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-xs"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {social?.twitter && (
                  <a
                    href={social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-800 hover:border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-xs"
                    title="X (Twitter)"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                <a
                  href="https://dishub.acehprov.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-all"
                >
                  <span>Portal Dishub</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Copyright & Accreditation */}
        <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-500">
          <p>
            &copy; {currentYear} <span className="text-slate-300 font-semibold">Trans Koetaradja</span> • Dinas Perhubungan Provinsi Aceh.
          </p>
          <p className="flex items-center gap-1.5 justify-center">
            <span>Dibiayai melalui APBA Pemerintah Aceh</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Karya Siswa PKL SMKN 5 Telkom Banda Aceh</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
