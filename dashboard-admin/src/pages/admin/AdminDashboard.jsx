import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Images, Calendar, Plus } from 'lucide-react';
import { newsAPI, galleryAPI } from '@/lib/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalNews: 0,
    totalGallery: 0,
    recentNews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [newsRes, galleryRes] = await Promise.all([
        newsAPI.getAll(),
        galleryAPI.getAll(),
      ]);

      setStats({
        totalNews: newsRes.data.length,
        totalGallery: galleryRes.data.length,
        recentNews: newsRes.data.slice(0, 3),
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">Selamat datang di panel admin Trans Koetaradja</p>
          </div>
          <Button asChild className="bg-sky-600 hover:bg-sky-700 w-fit">
            <Link to="/admin/news">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Berita
            </Link>
          </Button>
        </div>

        {/* Stats Cards — real data only (R-17: no invented numbers) */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Berita */}
          <Card className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Berita</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <span className="text-gray-300">...</span> : stats.totalNews}
                  </p>
                </div>
                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Newspaper className="w-5 h-5 text-sky-600" />
                </div>
              </div>
              <Link
                to="/admin/news"
                className="mt-3 text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
              >
                Kelola Berita
              </Link>
            </CardContent>
          </Card>

          {/* Total Galeri */}
          <Card className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Foto Galeri</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <span className="text-gray-300">...</span> : stats.totalGallery}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Images className="w-5 h-5 text-slate-600" />
                </div>
              </div>
              <Link
                to="/admin/gallery"
                className="mt-3 text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
              >
                Kelola Galeri
              </Link>
            </CardContent>
          </Card>

          {/* Bulan Aktif */}
          <Card className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bulan Ini</p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">
                    {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-400">Periode aktif saat ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent News */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Berita Terbaru</span>
              <Link
                to="/admin/news"
                className="text-xs font-normal text-sky-600 hover:text-sky-700"
              >
                Lihat Semua
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.recentNews.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.recentNews.map((news) => (
                  <div
                    key={news.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {news.image_url && (
                      <img
                        src={news.image_url}
                        alt={news.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
                        {news.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{news.date}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 rounded">
                        {news.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Newspaper className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-500">Belum ada berita</p>
                <Link to="/admin/news" className="mt-2 text-xs text-sky-600 hover:underline inline-block">
                  Tambahkan berita pertama
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/admin/news"
                className="p-4 rounded-lg border border-sky-200 hover:border-sky-400 hover:bg-sky-50 transition-colors"
              >
                <Newspaper className="w-6 h-6 text-sky-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Kelola Berita</p>
              </Link>
              <Link
                to="/admin/gallery"
                className="p-4 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors"
              >
                <Images className="w-6 h-6 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Kelola Galeri</p>
              </Link>
              <Link
                to="/admin/contact"
                className="p-4 rounded-lg border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
              >
                <Calendar className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Edit Kontak</p>
              </Link>
              <Link
                to="/admin/change-password"
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-gray-500 mb-2" />
                <p className="text-sm font-medium text-gray-900">Ganti Password</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
