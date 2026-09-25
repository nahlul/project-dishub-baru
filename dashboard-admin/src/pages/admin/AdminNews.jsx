import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminPageHeader from '@/components/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Upload, X, ImageOff } from 'lucide-react';
import { newsAPI, formatApiErrorDetail } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const AdminNews = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Berita',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data } = await newsAPI.getAll();
      setNewsList(data);
    } catch (error) {
      toast.error('Gagal memuat berita');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`Ukuran file terlalu besar (maks ${MAX_FILE_MB} MB).`);
      return;
    }

    // Revoke old preview to avoid memory leak
    if (imagePreview && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData({ title: '', excerpt: '', content: '', category: 'Berita' });
    if (imagePreview && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setEditingNews(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (editingNews) {
        await newsAPI.update(editingNews.id, formData);
        if (imageFile) {
          await newsAPI.uploadImage(editingNews.id, imageFile);
        }
        toast.success('Berita berhasil diupdate');
      } else {
        const { data } = await newsAPI.create(formData);
        if (imageFile) {
          await newsAPI.uploadImage(data.id, imageFile);
        }
        toast.success('Berita berhasil ditambahkan');
      }
      fetchNews();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      const msg = formatApiErrorDetail(error.response?.data?.detail);
      toast.error(msg || 'Gagal menyimpan berita');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (news) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      excerpt: news.excerpt,
      content: news.content,
      category: news.category,
    });
    setImagePreview(news.image_url);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    try {
      await newsAPI.delete(deleteConfirm.id);
      toast.success('Berita berhasil dihapus');
      fetchNews();
    } catch (error) {
      toast.error('Gagal menghapus berita');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Kelola Berita"
          subtitle="Tambah, edit, atau hapus berita"
          action={
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-sky-600 hover:bg-sky-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Berita
            </Button>
          }
        />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-44 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : newsList.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="font-medium text-gray-700 mb-1">Belum ada berita</p>
              <p className="text-sm text-gray-500">Klik "Tambah Berita" untuk memulai.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newsList.map((news) => (
              <Card key={news.id} className="overflow-hidden border border-gray-200 flex flex-col">
                {news.image_url ? (
                  <div className="aspect-video w-full overflow-hidden bg-gray-100">
                    <img
                      src={news.image_url}
                      alt={news.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="hidden w-full h-full items-center justify-center flex-col gap-2 text-gray-300"
                      style={{ display: 'none' }}
                    >
                      <ImageOff className="w-8 h-8" />
                      <span className="text-xs text-gray-400">Gambar tidak tersedia</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gray-50 flex items-center justify-center border-b border-gray-100">
                    <ImageOff className="w-8 h-8 text-gray-200" />
                  </div>
                )}
                <CardContent className="p-4 flex-1 flex flex-col">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 rounded mb-2 w-fit">
                    {news.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{news.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">{news.excerpt}</p>
                  <p className="text-xs text-gray-400 mb-3">{news.date}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(news)}
                      className="flex-1"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(news)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? 'Edit Berita' : 'Tambah Berita Baru'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi form di bawah untuk {editingNews ? 'mengupdate' : 'menambahkan'} berita
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Foto Cover</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative w-full">
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                      onClick={() => {
                        if (imagePreview && !imagePreview.startsWith('http')) {
                          URL.revokeObjectURL(imagePreview);
                        }
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-sky-500 transition-colors">
                    <Upload className="w-10 h-10 text-gray-300 mb-2" />
                    <span className="text-sm text-gray-600">Upload Foto Cover</span>
                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP &bull; maks {MAX_FILE_MB} MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="title">Judul Berita *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul berita"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Contoh: Berita, Pengumuman, Informasi"
                required
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Ringkasan *</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Ringkasan singkat berita (2-3 kalimat)"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Isi Berita *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Tulis isi berita lengkap di sini"
                rows={8}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
                disabled={uploading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-sky-600 hover:bg-sky-700"
                disabled={uploading}
              >
                {uploading ? 'Menyimpan...' : editingNews ? 'Update Berita' : 'Simpan Berita'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Berita?</AlertDialogTitle>
            <AlertDialogDescription>
              Berita "{deleteConfirm?.title}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminNews;
