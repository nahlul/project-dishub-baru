import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminPageHeader from '@/components/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, X, ImageOff } from 'lucide-react';
import { galleryAPI, formatApiErrorDetail } from '@/lib/api';
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

const AdminGallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploadData, setUploadData] = useState({
    title: '',
    category: 'Galeri',
  });

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const fetchGallery = async () => {
    try {
      const { data } = await galleryAPI.getAll();
      setGallery(data);
    } catch (error) {
      toast.error('Gagal memuat galeri');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Tipe tidak didukung. Gunakan JPEG, PNG, atau WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name}: Terlalu besar (maks ${MAX_FILE_MB} MB).`);
        continue;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    // Revoke old previews
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles(validFiles);
    setFilePreviews(previews);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Pilih minimal 1 foto');
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      for (const file of selectedFiles) {
        await galleryAPI.upload(file, uploadData.title, uploadData.category);
        successCount++;
      }
      toast.success(`${successCount} foto berhasil diupload`);
      fetchGallery();
      closeUploadDialog();
    } catch (error) {
      const msg = formatApiErrorDetail(error.response?.data?.detail);
      toast.error(msg || `Berhasil upload ${successCount} dari ${selectedFiles.length} foto`);
    } finally {
      setUploading(false);
    }
  };

  const closeUploadDialog = () => {
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadData({ title: '', category: 'Galeri' });
    setShowUploadDialog(false);
  };

  const handleDelete = async () => {
    try {
      await galleryAPI.delete(deleteConfirm.id);
      toast.success('Foto berhasil dihapus');
      fetchGallery();
    } catch (error) {
      toast.error('Gagal menghapus foto');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Kelola Galeri"
          subtitle="Upload atau hapus foto galeri"
          action={
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="bg-sky-600 hover:bg-sky-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Foto
            </Button>
          }
        />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
              </Card>
            ))}
          </div>
        ) : gallery.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-700 mb-1">Belum ada foto</p>
              <p className="text-sm text-gray-500">Klik "Upload Foto" untuk menambahkan.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {gallery.map((item) => (
              <Card key={item.id} className="overflow-hidden border border-gray-200 group">
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={item.image_url}
                    alt={item.title || 'Foto galeri'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div
                    className="hidden w-full h-full items-center justify-center flex-col gap-2 text-gray-400"
                    style={{ display: 'none' }}
                  >
                    <ImageOff className="w-8 h-8" />
                    <span className="text-xs">Gambar tidak tersedia</span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteConfirm(item)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>
                {item.title && (
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => { if (!open) closeUploadDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Foto Galeri</DialogTitle>
            <DialogDescription>
              Pilih satu atau beberapa foto (JPEG, PNG, WebP, maks {MAX_FILE_MB} MB per foto)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-4">
            <div>
              <Label>Pilih Foto *</Label>
              <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-sky-500 transition-colors mt-2 p-4">
                {selectedFiles.length > 0 ? (
                  <div className="w-full space-y-3">
                    <p className="text-sm font-medium text-gray-700 text-center">
                      {selectedFiles.length} foto dipilih
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {filePreviews.map((previewUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={previewUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 text-center">Klik untuk ganti pilihan</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">Klik untuk pilih foto</span>
                    <span className="text-xs text-gray-400 block mt-1">JPEG, PNG, WebP &bull; maks {MAX_FILE_MB} MB per file</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <Label htmlFor="title">Judul (Opsional)</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="Contoh: Armada Bus 2025"
              />
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={uploadData.category}
                onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                placeholder="Contoh: Bus, Halte, Operasional"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeUploadDialog}
                className="flex-1"
                disabled={uploading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-sky-600 hover:bg-sky-700"
                disabled={uploading || selectedFiles.length === 0}
              >
                {uploading ? 'Mengupload...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length} foto)` : ''}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Foto ini akan dihapus permanen dari galeri. Tindakan ini tidak dapat dibatalkan.
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

export default AdminGallery;