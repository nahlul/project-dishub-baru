import React from 'react';
import { Download, Bus, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 lg:pt-20 bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-left space-y-4 lg:space-y-6">
            <div className="inline-block">
              <span className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded text-xs lg:text-sm font-semibold border border-sky-200">
                100% Gratis &bull; Didukung Pemerintah Aceh
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
              Trans Koetaradja
            </h1>

            <p className="text-lg lg:text-xl xl:text-2xl text-gray-700 font-medium">
              Transportasi Publik Modern Kota Banda Aceh
            </p>

            <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
              Hadir sebagai solusi modern yang menjawab kebutuhan transportasi publik masyarakat Kota Banda Aceh dan sekitarnya. Melayani 14 rute dengan fasilitas lengkap dan nyaman.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-2 lg:pt-4">
              <Link to="/download" className="w-full sm:w-auto">
                <Button className="bg-sky-600 hover:bg-sky-700 text-white px-6 lg:px-8 py-5 lg:py-6 rounded-xl font-bold text-base lg:text-lg shadow-sm w-full">
                  <Download className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                  Download Aplikasi
                </Button>
              </Link>
              <Link to="/rute" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="border-2 border-sky-600 text-sky-600 hover:bg-sky-50 px-6 lg:px-8 py-5 lg:py-6 rounded-xl font-bold text-base lg:text-lg w-full"
                >
                  Lihat Rute
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4 pt-4 lg:pt-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bus className="w-4 h-4 lg:w-5 lg:h-5 text-sky-600" />
                </div>
                <div>
                  <div className="text-xs lg:text-sm font-bold text-gray-900">50+ Bus</div>
                  <div className="text-xs text-gray-500 hidden sm:block">Armada Modern</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-sky-600" />
                </div>
                <div>
                  <div className="text-xs lg:text-sm font-bold text-gray-900">14 Rute</div>
                  <div className="text-xs text-gray-500 hidden sm:block">Jangkauan Luas</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-sky-600" />
                </div>
                <div>
                  <div className="text-xs lg:text-sm font-bold text-gray-900">12 Jam</div>
                  <div className="text-xs text-gray-500 hidden sm:block">Setiap Hari</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              <img
                src="https://dishub.acehprov.go.id/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-24-at-20.39.53.jpeg"
                alt="Bus Trans Koetaradja"
                className="w-full h-auto"
              />
              <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Bus className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">Gratis untuk</div>
                    <div className="text-base font-bold text-sky-700">Semua Warga</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;