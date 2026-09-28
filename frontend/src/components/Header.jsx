import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tutup mobile menu saat navigasi
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { label: 'Beranda', path: '/' },
    { label: 'Tentang', path: '/tentang' },
    { label: 'Rute', path: '/rute' },
    { label: 'Fasilitas', path: '/fasilitas' },
    { label: 'Galeri', path: '/galeri' },
    { label: 'Berita', path: '/berita' },
    { label: 'FAQ', path: '/faq' },
  ];

  const isActive = (path) => location.pathname === path;
  const isHero = location.pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isHero
          ? 'bg-white border-b border-gray-100 shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://customer-assets.emergentagent.com/job_kutaradja-app-center/artifacts/6z3d8lef_Cuplikan_layar_2026-07-01_152844-removebg-preview.png"
              alt="Trans Koetaradja"
              className="h-12 w-auto object-contain"
            />
            <div className="leading-tight">
              <div className={`text-lg font-extrabold leading-none transition-colors ${isScrolled || !isHero ? 'text-gray-900' : 'text-white'}`}>
                Trans
              </div>
              <div className="text-lg font-extrabold leading-none text-sky-500">
                Koetaradja
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-full text-sm transition-all duration-150 ${
                    active
                      ? isScrolled || !isHero
                        ? 'text-sky-700 bg-sky-50 font-semibold shadow-2xs border border-sky-100/80'
                        : 'text-white bg-white/20 font-semibold backdrop-blur-md border border-white/20'
                      : isScrolled || !isHero
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                      : 'text-white/80 hover:text-white hover:bg-white/10 font-medium'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://wa.me/628116712349"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                isScrolled || !isHero
                  ? 'text-gray-600 hover:text-sky-600 hover:bg-gray-50'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Hubungi
            </a>
            <Link to="/download">
              <button className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/20">
                Download App
              </button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled || !isHero ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            }`}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pb-4 border-t border-gray-100 pt-4 space-y-1 bg-white rounded-xl shadow-xl">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-sky-600 bg-sky-50'
                    : 'text-gray-700 hover:text-sky-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://wa.me/628116712349"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-sky-600 hover:bg-gray-50"
            >
              Hubungi
            </a>
            <div className="px-4 pt-2">
              <Link to="/download" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-sm font-bold transition-colors">
                  Download App
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
