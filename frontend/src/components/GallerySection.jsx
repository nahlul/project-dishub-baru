import React, { useState, useEffect } from 'react';
import { galleryAPI } from '@/lib/api';
import { Loader2, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Badge } from './ui/badge';

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    galleryAPI.getAll().then(({ data }) => setGallery(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sky-500 text-sm font-semibold uppercase tracking-widest">Dokumentasi</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">Galeri</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Lihat armada dan layanan Trans Koetaradja dalam aksi
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">Belum ada foto di galeri</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-sky-200 hover:shadow-lg transition-all duration-300"
                onClick={() => setSelectedImage(item)}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                  <img
                    src={item.image_url}
                    alt={item.title || 'Gallery'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                <div className="p-4">
                  {item.title && <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</h3>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                    </span>
                    {item.category && (
                      <span className="text-xs bg-sky-50 text-sky-500 border border-sky-100 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
            {selectedImage && (
              <div>
                <div className="w-full max-h-[60vh] bg-gray-100 flex items-center justify-center rounded-t-2xl overflow-hidden">
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.title || 'Gallery'}
                    className="w-full h-full object-contain max-h-[60vh]"
                  />
                </div>
                <div className="p-6">
                  {selectedImage.category && (
                    <span className="text-xs bg-sky-50 text-sky-500 border border-sky-100 px-3 py-1 rounded-full">
                      {selectedImage.category}
                    </span>
                  )}
                  {selectedImage.title && (
                    <h3 className="text-xl font-bold text-gray-900 mt-3">{selectedImage.title}</h3>
                  )}
                  {selectedImage.created_at && (
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(selectedImage.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </section>
  );
};

export default GallerySection;
