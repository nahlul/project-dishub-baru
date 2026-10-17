import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/AdminLayout';
import AdminPageHeader from '@/components/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pencil,
  Trash2,
  Bus,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
} from 'lucide-react';
import { routesAPI, formatApiErrorDetail } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

// ─── Color presets for route badges ───────────────────────────
const COLOR_PRESETS = [
  { label: 'Sky Blue', value: '#0284c7' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Indigo', value: '#6366f1' },
];

const BLANK_FORM = {
  id: '',
  nama: '',
  warna: '#0284c7',
  deskripsi: '',
  jam_operasi: '06:30 - 18:30 WIB',
  hari: 'Setiap Hari (Senin - Minggu)',
  terminal_awal: '',
  terminal_akhir: '',
};

// ─── Helpers ──────────────────────────────────────────────────
function RouteBadge({ warna, nama }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-sm"
      style={{ backgroundColor: warna || '#0284c7' }}
    >
      <Bus className="w-3 h-3" />
      {nama}
    </span>
  );
}

// ─── Expandable Halte List ────────────────────────────────────
function HalteList({ halte = [] }) {
  const [expanded, setExpanded] = useState(false);
  if (!halte.length)
    return <p className="text-xs text-gray-400 italic">Belum ada halte</p>;
  const shown = expanded ? halte : halte.slice(0, 5);

  return (
    <div className="space-y-1">
      {shown.map((h, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{h.nama}</span>
          {h.arah && (
            <span className="text-gray-400 text-[10px]">{h.arah}</span>
          )}
        </div>
      ))}
      {halte.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium mt-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Tampilkan lebih sedikit
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> +{halte.length - 5} halte lainnya
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Route Form Dialog ────────────────────────────────────────
function RouteFormDialog({ open, onClose, initial, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              id: initial.id,
              nama: initial.nama || '',
              warna: initial.warna || '#0284c7',
              deskripsi: initial.deskripsi || '',
              jam_operasi: initial.jam_operasi || '06:30 - 18:30 WIB',
              hari: initial.hari || 'Setiap Hari (Senin - Minggu)',
              terminal_awal: initial.terminal_awal || '',
              terminal_akhir: initial.terminal_akhir || '',
            }
          : BLANK_FORM
      );
    }
  }, [open, initial]);

  const field = (key, label, placeholder, readOnly = false) => (
    <div>
      <Label htmlFor={key} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Input
        id={key}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`mt-1 ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
      />
      {key === 'id' && !isEdit && (
        <p className="text-[11px] text-gray-400 mt-1">
          Contoh: <code className="bg-gray-100 px-1 rounded">koridor-7</code>. Hanya
          huruf kecil dan tanda hubung, tidak bisa diubah setelah disimpan.
        </p>
      )}
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id.trim() || !form.nama.trim()) {
      toast.error('ID Rute dan Nama Rute wajib diisi');
      return;
    }
    const cleanId = form.id.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanId)) {
      toast.error('ID rute hanya boleh mengandung huruf kecil, angka, dan tanda hubung');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, id: cleanId };
      if (isEdit) {
        const { id, ...updatePayload } = payload;
        await routesAPI.adminUpdate(cleanId, updatePayload);
        toast.success(`Rute "${form.nama}" berhasil diperbarui`);
      } else {
        await routesAPI.adminCreate(payload);
        toast.success(`Rute "${form.nama}" berhasil ditambahkan`);
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = formatApiErrorDetail(err.response?.data?.detail);
      toast.error(msg || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} rute`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-sky-600" />
            {isEdit ? 'Edit Rute Bus' : 'Tambah Rute Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui informasi rute yang sudah ada.'
              : 'Isi detail rute baru Trans Koetaradja.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {field('id', 'ID Rute *', 'contoh: koridor-7', isEdit)}
          {field('nama', 'Nama Rute *', 'contoh: Trans Lambaro')}
          {field('deskripsi', 'Deskripsi', 'Deskripsi singkat rute ini')}

          {/* Warna */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Warna Jalur</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setForm((f) => ({ ...f, warna: c.value }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    form.warna === c.value
                      ? 'border-gray-800 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <input
                type="color"
                value={form.warna}
                onChange={(e) => setForm((f) => ({ ...f, warna: e.target.value }))}
                className="w-7 h-7 rounded-full border border-gray-300 cursor-pointer p-0"
                title="Warna custom"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: form.warna }}
              >
                Preview Warna
              </span>
              <code className="text-xs text-gray-500">{form.warna}</code>
            </div>
          </div>

          {field('jam_operasi', 'Jam Operasi', '06:30 - 18:30 WIB')}
          {field('hari', 'Hari Operasi', 'Setiap Hari (Senin - Minggu)')}
          {field('terminal_awal', 'Terminal/Halte Awal', 'Terminal Batoh')}
          {field('terminal_akhir', 'Terminal/Halte Akhir', 'Terminal Darussalam')}

          <DialogFooter className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 flex-1"
              disabled={saving}
            >
              {saving
                ? isEdit
                  ? 'Menyimpan...'
                  : 'Menambahkan...'
                : isEdit
                ? 'Simpan Perubahan'
                : 'Tambah Rute'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────
const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await routesAPI.adminGetAll();
      setRoutes(data);
    } catch {
      toast.error('Gagal memuat data rute');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filtered = routes.filter(
    (r) =>
      r.nama?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toLowerCase().includes(search.toLowerCase()) ||
      r.deskripsi?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await routesAPI.adminDelete(deleteConfirm.id);
      toast.success(`Rute "${deleteConfirm.nama}" berhasil dihapus`);
      setDeleteConfirm(null);
      fetchRoutes();
    } catch (err) {
      const msg = formatApiErrorDetail(err.response?.data?.detail);
      toast.error(msg || 'Gagal menghapus rute');
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (route) => {
    setEditTarget(route);
    setDialogOpen(true);
  };

  // ── Stats strip ────────────────────────────────────────────
  const totalHalte = routes.reduce((s, r) => s + (r.total_halte || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Daftar Rute Bus"
          subtitle="Kelola dan pantau seluruh rute Trans Koetaradja"
          action={
            <Button onClick={openAdd} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Rute
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Rute', value: routes.length, color: 'bg-sky-50 text-sky-700' },
            { label: 'Total Halte', value: totalHalte, color: 'bg-emerald-50 text-emerald-700' },
            {
              label: 'Rata-rata Halte/Rute',
              value: routes.length ? Math.round(totalHalte / routes.length) : 0,
              color: 'bg-purple-50 text-purple-700',
            },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className={`p-4 ${s.color} rounded-lg`}>
                <p className="text-3xl font-bold">{loading ? '…' : s.value}</p>
                <p className="text-xs font-medium mt-1 opacity-75">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari rute atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchRoutes}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Route Cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <Bus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">
                {search ? 'Tidak ada rute yang cocok' : 'Belum ada rute yang terdaftar'}
              </p>
              {!search && (
                <Button onClick={openAdd} className="mt-4 bg-sky-600 hover:bg-sky-700">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Rute Pertama
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((route, idx) => {
                const isExpanded = expandedId === route.id;
                return (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                      {/* Color stripe */}
                      <div
                        className="h-1.5 rounded-t-lg"
                        style={{ backgroundColor: route.warna || '#0284c7' }}
                      />

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <RouteBadge warna={route.warna} nama={route.nama} />
                            <p className="text-xs text-gray-400 mt-1.5 font-mono">
                              ID: {route.id}
                            </p>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0 text-xs">
                            {route.total_halte || 0} halte
                          </Badge>
                        </div>

                        {route.deskripsi && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {route.deskripsi}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent className="pt-0 flex-1 flex flex-col justify-between gap-3">
                        {/* Operational info */}
                        <div className="space-y-1.5">
                          {route.jam_operasi && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              {route.jam_operasi}
                            </div>
                          )}
                          {(route.terminal_awal || route.terminal_akhir) && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              {route.terminal_awal}
                              {route.terminal_awal && route.terminal_akhir && ' → '}
                              {route.terminal_akhir}
                            </div>
                          )}
                        </div>

                        {/* Halte toggle */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : route.id)}
                          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium self-start"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" /> Sembunyikan Halte
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" /> Lihat Daftar Halte
                            </>
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                                <HalteList halte={route.halte || []} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(route)}
                            className="flex-1 text-xs"
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm(route)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <RouteFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editTarget}
        onSaved={fetchRoutes}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rute?</AlertDialogTitle>
            <AlertDialogDescription>
              Rute <strong>{deleteConfirm?.nama}</strong> ({deleteConfirm?.id}) dengan{' '}
              <strong>{deleteConfirm?.total_halte}</strong> halte akan dihapus permanen.
              Data halte di file JSON lokal juga akan ikut terhapus.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminRoutes;
