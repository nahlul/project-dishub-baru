import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/AdminLayout';
import AdminPageHeader from '@/components/AdminPageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Route as RouteIcon,
  Compass,
  Info,
  Check,
  X,
  Navigation,
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

// ─── Route Badge ──────────────────────────────────────────────
function RouteBadge({ warna, nama }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-sm"
      style={{ backgroundColor: warna || '#0284c7' }}
    >
      <Bus className="w-3.5 h-3.5" />
      {nama}
    </span>
  );
}

// ─── Preview Halte di Card Utama ──────────────────────────────
function HaltePreviewList({ halte = [] }) {
  const [expanded, setExpanded] = useState(false);
  if (!halte.length)
    return <p className="text-xs text-gray-400 italic">Belum ada halte terpasang</p>;

  const shown = expanded ? halte : halte.slice(0, 5);

  return (
    <div className="space-y-1.5">
      {shown.map((h, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
          <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="flex-1 font-medium">{h.nama}</span>
          {h.arah && (
            <span className="text-gray-400 text-[10px] truncate max-w-[140px] bg-gray-100 px-1.5 py-0.5 rounded">
              {h.arah}
            </span>
          )}
        </div>
      ))}
      {halte.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium mt-1 pt-1 border-t border-gray-100 w-full text-left"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Sembunyikan {halte.length - 5} halte
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

// ─── Modal Editor Lengkap: Info Rute + Tatanan Halte ───────────
function RouteEditorDialog({
  open,
  onClose,
  initial,
  initialTab = 'info',
  onSaved,
  masterHaltes = [],
}) {
  const isEdit = !!initial;
  const [activeTab, setActiveTab] = useState(initialTab); // 'info' | 'halte'
  const [form, setForm] = useState(BLANK_FORM);
  const [halteList, setHalteList] = useState([]);
  const [saving, setSaving] = useState(false);

  // Filter & Search di dalam daftar halte
  const [halteSearch, setHalteSearch] = useState('');
  const [selectedArahFilter, setSelectedArahFilter] = useState('ALL');

  // Form tambah halte baru ke urutan
  const [newHalteName, setNewHalteName] = useState('');
  const [newHalteArah, setNewHalteArah] = useState('');
  const [newHalteLat, setNewHalteLat] = useState('');
  const [newHalteLng, setNewHalteLng] = useState('');
  const [insertPosition, setInsertPosition] = useState('end'); // 'start' | 'end'

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      if (initial) {
        setForm({
          id: initial.id || '',
          nama: initial.nama || '',
          warna: initial.warna || '#0284c7',
          deskripsi: initial.deskripsi || '',
          jam_operasi: initial.jam_operasi || '06:30 - 18:30 WIB',
          hari: initial.hari || 'Setiap Hari (Senin - Minggu)',
          terminal_awal: initial.terminal_awal || '',
          terminal_akhir: initial.terminal_akhir || '',
        });
        setHalteList(Array.isArray(initial.halte) ? JSON.parse(JSON.stringify(initial.halte)) : []);
      } else {
        setForm(BLANK_FORM);
        setHalteList([]);
      }
      setHalteSearch('');
      setSelectedArahFilter('ALL');
      setNewHalteName('');
      setNewHalteArah('');
      setNewHalteLat('');
      setNewHalteLng('');
    }
  }, [open, initial, initialTab]);

  // Distinct arah yang ada di rute ini
  const distinctArahList = useMemo(() => {
    const set = new Set();
    halteList.forEach((h) => {
      if (h.arah && h.arah.trim()) set.add(h.arah.trim());
    });
    return Array.from(set);
  }, [halteList]);

  // Preset arah cepat dari terminal awal - akhir
  const presetArah1 = form.terminal_awal && form.terminal_akhir
    ? `${form.terminal_awal} ➔ ${form.terminal_akhir}`
    : '';
  const presetArah2 = form.terminal_awal && form.terminal_akhir
    ? `${form.terminal_akhir} ➔ ${form.terminal_awal}`
    : '';

  // Auto-fill koordinat saat pilih nama halte dari master
  const handleSelectMasterHalte = (nama) => {
    setNewHalteName(nama);
    const found = masterHaltes.find((m) => m.nama?.toLowerCase() === nama?.toLowerCase());
    if (found && found.lat && found.lng) {
      setNewHalteLat(found.lat);
      setNewHalteLng(found.lng);
    }
  };

  // Tambah halte ke dalam susunan rute
  const handleAddHalte = () => {
    if (!newHalteName.trim()) {
      toast.error('Masukkan nama halte terlebih dahulu');
      return;
    }

    const newItem = {
      nama: newHalteName.trim(),
      arah: newHalteArah.trim() || (presetArah1 || ''),
      lat: newHalteLat !== '' ? parseFloat(newHalteLat) : null,
      lng: newHalteLng !== '' ? parseFloat(newHalteLng) : null,
      jadwal: {},
    };

    if (insertPosition === 'start') {
      setHalteList([newItem, ...halteList]);
      toast.success(`Halte "${newItem.nama}" ditambahkan ke draft (#1). Tekan "Simpan Perubahan" di bawah.`);
    } else {
      setHalteList([...halteList, newItem]);
      toast.success(`Halte "${newItem.nama}" ditambahkan ke draft (#${halteList.length + 1}). Tekan "Simpan Perubahan" di bawah.`);
    }

    // Reset input
    setNewHalteName('');
    setNewHalteLat('');
    setNewHalteLng('');
  };

  // Geser urutan halte (Tatanan)
  const moveHalte = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= halteList.length) return;

    const copy = [...halteList];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setHalteList(copy);
  };

  // Update nilai field halte tertentu
  const updateHalteField = (index, field, value) => {
    const copy = [...halteList];
    copy[index] = { ...copy[index], [field]: value };
    setHalteList(copy);
  };

  // Hapus halte dari urutan
  const removeHalte = (index) => {
    const removedName = halteList[index]?.nama;
    const copy = halteList.filter((_, i) => i !== index);
    setHalteList(copy);
    toast.info(`Halte "${removedName}" dihapus dari rute`);
  };

  // Balik urutan halte (Reverse order)
  const handleReverseHalteOrder = () => {
    if (halteList.length < 2) return;
    setHalteList([...halteList].reverse());
    toast.success('Tatanan urutan halte berhasil dibalik (reverse)');
  };

  // Simpan perubahan rute + halte
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!form.id.trim() || !form.nama.trim()) {
      toast.error('ID Rute dan Nama Rute wajib diisi');
      setActiveTab('info');
      return;
    }

    const cleanId = form.id.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanId)) {
      toast.error('ID rute hanya boleh berisi huruf kecil, angka, dan tanda hubung');
      setActiveTab('info');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        id: cleanId,
        halte: halteList,
      };

      if (isEdit) {
        const { id, ...updatePayload } = payload;
        await routesAPI.adminUpdate(cleanId, updatePayload);
        toast.success(`Rute "${form.nama}" & tatanan ${halteList.length} halte berhasil disimpan!`);
      } else {
        await routesAPI.adminCreate(payload);
        toast.success(`Rute baru "${form.nama}" dengan ${halteList.length} halte berhasil ditambahkan!`);
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = formatApiErrorDetail(err.response?.data?.detail);
      toast.error(msg || `Gagal menyimpan rute`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header Dialog */}
        <DialogHeader className="px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: form.warna || '#0284c7' }}
              >
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 leading-tight">
                  {isEdit ? `Edit: ${form.nama || initial?.id}` : 'Tambah Rute Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  ID: <code className="font-mono text-gray-700">{form.id || '(baru)'}</code> •{' '}
                  {halteList.length} Halte Terpasang
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-xs px-2.5 py-1 font-semibold"
              style={{ borderColor: form.warna, color: form.warna }}
            >
              {halteList.length} Titik Halte
            </Badge>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 border-b border-gray-200 -mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'info'
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Info className="w-4 h-4" />
              1. Info Koridor & Rute
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('halte')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'halte'
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              2. Susunan & Tatanan Halte
              <span className="ml-1 px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded-full text-[10px]">
                {halteList.length}
              </span>
            </button>
          </div>
        </DialogHeader>

        {/* Tab 1: Info Koridor */}
        {activeTab === 'info' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="route-id" className="text-xs font-semibold text-gray-700">
                  ID Rute *
                </Label>
                <Input
                  id="route-id"
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="contoh: koridor-7"
                  readOnly={isEdit}
                  className={`mt-1 text-sm ${
                    isEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
                {!isEdit && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Gunakan huruf kecil & strip (contoh: <code>darussalam</code> atau <code>koridor-7</code>).
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="route-name" className="text-xs font-semibold text-gray-700">
                  Nama Rute / Koridor *
                </Label>
                <Input
                  id="route-name"
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="contoh: Koridor 7 (Simpang Mesra - Bandara)"
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            {/* Warna Jalur */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">Warna Jalur di Peta</Label>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setForm((f) => ({ ...f, warna: c.value }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      form.warna === c.value
                        ? 'border-gray-900 scale-110 shadow-sm'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="color"
                    value={form.warna}
                    onChange={(e) => setForm((f) => ({ ...f, warna: e.target.value }))}
                    className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0"
                    title="Pilih warna kustom"
                  />
                  <code className="text-xs text-gray-500 font-mono">{form.warna}</code>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="route-start" className="text-xs font-semibold text-gray-700">
                  Terminal / Titik Awal
                </Label>
                <Input
                  id="route-start"
                  value={form.terminal_awal}
                  onChange={(e) => setForm((f) => ({ ...f, terminal_awal: e.target.value }))}
                  placeholder="contoh: Pusat Kota / Terminal Batoh"
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="route-end" className="text-xs font-semibold text-gray-700">
                  Terminal / Titik Akhir
                </Label>
                <Input
                  id="route-end"
                  value={form.terminal_akhir}
                  onChange={(e) => setForm((f) => ({ ...f, terminal_akhir: e.target.value }))}
                  placeholder="contoh: Darussalam / Bandara SIM"
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="route-hours" className="text-xs font-semibold text-gray-700">
                  Jam Operasional
                </Label>
                <Input
                  id="route-hours"
                  value={form.jam_operasi}
                  onChange={(e) => setForm((f) => ({ ...f, jam_operasi: e.target.value }))}
                  placeholder="contoh: 06:30 - 18:30 WIB"
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="route-days" className="text-xs font-semibold text-gray-700">
                  Hari Layanan
                </Label>
                <Input
                  id="route-days"
                  value={form.hari}
                  onChange={(e) => setForm((f) => ({ ...f, hari: e.target.value }))}
                  placeholder="contoh: Setiap Hari (Senin - Minggu)"
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="route-desc" className="text-xs font-semibold text-gray-700">
                Deskripsi Rute
              </Label>
              <Input
                id="route-desc"
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Penjelasan rute, rute bolak-balik, halte transit penting, dsb."
                className="mt-1 text-sm"
              />
            </div>

            <div className="p-3.5 bg-sky-50 rounded-lg border border-sky-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-sky-900">Lanjut ke Atur Tatanan Halte?</p>
                <p className="text-[11px] text-sky-700">
                  Atur urutan singgah bus dari halte pertama sampai akhir di Tab 2.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveTab('halte')}
                className="bg-sky-600 hover:bg-sky-700 text-xs"
              >
                Susun Halte ({halteList.length}) →
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Susunan & Tatanan Halte (Urutan & Arah Dari Mana ke Mana) */}
        {activeTab === 'halte' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-gray-50/60">
            {/* Box Tambah Halte Baru ke Urutan */}
            <div className="p-4 bg-white rounded-xl border border-sky-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Tambah Halte ke Urutan Rute
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Posisi:</span>
                  <select
                    value={insertPosition}
                    onChange={(e) => setInsertPosition(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-0.5 bg-white font-medium"
                  >
                    <option value="end">Paling Akhir (#{halteList.length + 1})</option>
                    <option value="start">Paling Awal (#1)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Input Nama Halte dengan Autocomplete dari Master Halte */}
                <div>
                  <Label className="text-[11px] font-semibold text-gray-700">Nama Halte *</Label>
                  <input
                    type="text"
                    list="master-halte-options"
                    value={newHalteName}
                    onChange={(e) => handleSelectMasterHalte(e.target.value)}
                    placeholder="Ketik atau pilih halte..."
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 mt-1 focus:ring-1 focus:ring-sky-500 bg-white"
                  />
                  <datalist id="master-halte-options">
                    {masterHaltes.map((m, idx) => (
                      <option key={idx} value={m.nama} />
                    ))}
                  </datalist>
                </div>

                {/* Input Arah ("Dari Mana ke Mana") */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-gray-700">
                      Arah (Dari Mana ke Mana)
                    </Label>
                    {presetArah1 && (
                      <span className="text-[10px] text-gray-400">Pilih cepat di bawah</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newHalteArah}
                    onChange={(e) => setNewHalteArah(e.target.value)}
                    placeholder="contoh: Pusat Kota -> Darussalam"
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 mt-1 focus:ring-1 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>

              {/* Quick Preset Pills untuk Arah */}
              {(presetArah1 || presetArah2 || distinctArahList.length > 0) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-400">Preset Arah:</span>
                  {presetArah1 && (
                    <button
                      type="button"
                      onClick={() => setNewHalteArah(presetArah1)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                    >
                      {presetArah1}
                    </button>
                  )}
                  {presetArah2 && (
                    <button
                      type="button"
                      onClick={() => setNewHalteArah(presetArah2)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      {presetArah2}
                    </button>
                  )}
                  {distinctArahList
                    .filter((a) => a !== presetArah1 && a !== presetArah2)
                    .map((a, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewHalteArah(a)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors truncate max-w-[160px]"
                      >
                        {a}
                      </button>
                    ))}
                </div>
              )}

              {/* Koordinat GPS (Opsional) */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <Label className="text-[10px] text-gray-500">Latitude (GPS)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={newHalteLat}
                    onChange={(e) => setNewHalteLat(e.target.value)}
                    placeholder="5.55..."
                    className="h-8 text-xs font-mono mt-0.5 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">Longitude (GPS)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={newHalteLng}
                    onChange={(e) => setNewHalteLng(e.target.value)}
                    placeholder="95.31..."
                    className="h-8 text-xs font-mono mt-0.5 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  onClick={handleAddHalte}
                  className="bg-sky-600 hover:bg-sky-700 text-xs h-8 px-4"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Masukkan ke Urutan Rute
                </Button>
              </div>
            </div>

            {/* Toolbar Susunan Halte */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div>
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-sky-600" />
                  Tatanan Urutan Lintasan Bus ({halteList.length} Halte)
                </p>
                <p className="text-[11px] text-gray-500">
                  Urutan nomor menentukan alur perjalanan bus dari awal hingga akhir. Gunakan panah ▲ ▼ untuk mengubah tatanan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReverseHalteOrder}
                  className="text-xs h-7 px-2.5 border-gray-300 text-gray-700"
                  title="Balik urutan seluruh halte (Awal jadi Akhir)"
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" /> Balik Urutan
                </Button>
              </div>
            </div>

            {/* Filter & Search Bar Halte */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={halteSearch}
                  onChange={(e) => setHalteSearch(e.target.value)}
                  placeholder="Cari halte di rute ini..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg bg-white"
                />
              </div>

              {distinctArahList.length > 0 && (
                <select
                  value={selectedArahFilter}
                  onChange={(e) => setSelectedArahFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white font-medium max-w-[150px] truncate"
                >
                  <option value="ALL">Semua Arah ({halteList.length})</option>
                  {distinctArahList.map((arah, idx) => (
                    <option key={idx} value={arah}>
                      {arah}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Daftar Halte & Tatanan */}
            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
              {halteList.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-200">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-600">Belum ada halte dalam rute ini</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Gunakan form di atas untuk menambahkan halte pertama ke rute ini.
                  </p>
                </div>
              ) : (
                halteList.map((halte, index) => {
                  // Filter pengecekan
                  const matchSearch =
                    !halteSearch ||
                    halte.nama?.toLowerCase().includes(halteSearch.toLowerCase()) ||
                    halte.arah?.toLowerCase().includes(halteSearch.toLowerCase());
                  const matchArah =
                    selectedArahFilter === 'ALL' || halte.arah === selectedArahFilter;

                  if (!matchSearch || !matchArah) return null;

                  return (
                    <div
                      key={index}
                      className="p-3 bg-white rounded-lg border border-gray-200 shadow-xs hover:border-sky-300 transition-colors flex flex-col gap-2"
                    >
                      {/* Baris Utama: Nomor, Nama Halte, Action Geser Urutan */}
                      <div className="flex items-center gap-2">
                        {/* Badge Urutan Nomor */}
                        <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                          #{index + 1}
                        </span>

                        {/* Input Nama Halte */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={halte.nama || ''}
                            onChange={(e) => updateHalteField(index, 'nama', e.target.value)}
                            className="w-full text-xs font-bold text-gray-900 border border-transparent hover:border-gray-200 focus:border-sky-500 rounded px-1.5 py-1 transition-colors"
                            placeholder="Nama Halte"
                          />
                        </div>

                        {/* Tombol Reorder: Naik & Turun */}
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveHalte(index, -1)}
                            className="p-1 rounded text-gray-600 hover:text-sky-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Geser Naik (Mendahului halte sebelumnya)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === halteList.length - 1}
                            onClick={() => moveHalte(index, 1)}
                            className="p-1 rounded text-gray-600 hover:text-sky-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Geser Turun (Setelah halte berikutnya)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={() => removeHalte(index)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus dari urutan rute"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Baris Kedua: Arah (Dari mana ke mana) & Koordinat */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                        {/* Arah */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-semibold text-gray-500">
                              Arah / Trayek Halte:
                            </span>
                            <span className="text-[9px] text-gray-400">Dari mana ➔ ke mana</span>
                          </div>
                          <input
                            type="text"
                            value={halte.arah || ''}
                            onChange={(e) => updateHalteField(index, 'arah', e.target.value)}
                            placeholder="contoh: Pusat Kota -> Darussalam"
                            className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-sky-500"
                          />
                        </div>

                        {/* Koordinat GPS */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1">
                            <span className="text-[10px] text-gray-500 block mb-0.5">Lat:</span>
                            <input
                              type="number"
                              step="any"
                              value={halte.lat ?? ''}
                              onChange={(e) =>
                                updateHalteField(
                                  index,
                                  'lat',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="5.55..."
                              className="w-full text-[11px] font-mono border border-gray-200 rounded px-1.5 py-1 bg-gray-50/50"
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] text-gray-500 block mb-0.5">Lng:</span>
                            <input
                              type="number"
                              step="any"
                              value={halte.lng ?? ''}
                              onChange={(e) =>
                                updateHalteField(
                                  index,
                                  'lng',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="95.31..."
                              className="w-full text-[11px] font-mono border border-gray-200 rounded px-1.5 py-1 bg-gray-50/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer Dialog */}
        <DialogFooter className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="text-xs text-gray-600 flex items-center justify-between sm:justify-start gap-2">
            <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {activeTab === 'info' ? 'Tab 1/2: Info' : `Tab 2/2: ${halteList.length} Halte`}
            </span>
            <span className="text-[11px] text-gray-400">
              {activeTab === 'halte' ? 'Tekan Simpan agar sinkron ke web' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-5 h-9 shadow-md"
            >
              {saving
                ? isEdit
                  ? 'Menyimpan...'
                  : 'Menambahkan...'
                : isEdit
                ? `Simpan Perubahan (${halteList.length} Halte)`
                : `Tambah Rute (${halteList.length} Halte)`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Admin Routes Page ───────────────────────────────────
const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [masterHaltes, setMasterHaltes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [dialogTab, setDialogTab] = useState('info');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const [resRoutes, resHaltes] = await Promise.all([
        routesAPI.adminGetAll(),
        routesAPI.getAllHaltes().catch(() => ({ data: [] })),
      ]);
      setRoutes(resRoutes.data || []);
      setMasterHaltes(resHaltes.data || []);
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
      r.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
      r.terminal_awal?.toLowerCase().includes(search.toLowerCase()) ||
      r.terminal_akhir?.toLowerCase().includes(search.toLowerCase())
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
    setDialogTab('info');
    setDialogOpen(true);
  };

  const openEdit = (route, tab = 'info') => {
    setEditTarget(route);
    setDialogTab(tab);
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
          subtitle="Kelola rute, atur arah trayek, dan susun urutan halte Trans Koetaradja"
          action={
            <Button onClick={openAdd} className="bg-sky-600 hover:bg-sky-700 shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Rute
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Total Rute', value: routes.length, color: 'bg-sky-50 text-sky-700' },
            { label: 'Total Halte Terpasang', value: totalHalte, color: 'bg-emerald-50 text-emerald-700' },
            {
              label: 'Rata-rata Halte/Rute',
              value: routes.length ? Math.round(totalHalte / routes.length) : 0,
              color: 'bg-purple-50 text-purple-700',
            },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-xs">
              <CardContent className={`p-4 ${s.color} rounded-lg`}>
                <p className="text-2xl sm:text-3xl font-bold">{loading ? '…' : s.value}</p>
                <p className="text-xs font-medium mt-1 opacity-80">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari rute, halte, atau koridor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm bg-white"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchRoutes}
            disabled={loading}
            title="Refresh Data"
            className="bg-white"
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
              <p className="font-semibold text-gray-700">
                {search ? 'Tidak ada rute yang cocok' : 'Belum ada rute yang terdaftar'}
              </p>
              {!search && (
                <Button onClick={openAdd} className="mt-4 bg-sky-600 hover:bg-sky-700 text-xs">
                  <Plus className="w-4 h-4 mr-1.5" /> Tambah Rute Pertama
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((route, idx) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="hover:shadow-md transition-shadow h-full flex flex-col border border-gray-200/80 bg-white">
                    {/* Color stripe */}
                    <div
                      className="h-2 rounded-t-lg"
                      style={{ backgroundColor: route.warna || '#0284c7' }}
                    />

                    <CardHeader className="pb-2 pt-3.5 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <RouteBadge warna={route.warna} nama={route.nama} />
                          <p className="text-xs text-gray-400 mt-1.5 font-mono">
                            ID: {route.id}
                          </p>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 text-xs font-semibold bg-gray-50">
                          {route.total_halte || 0} halte
                        </Badge>
                      </div>

                      {route.deskripsi && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {route.deskripsi}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0 px-4 pb-4 flex-1 flex flex-col justify-between gap-3">
                      {/* Operational info */}
                      <div className="space-y-1.5 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                        {route.jam_operasi && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{route.jam_operasi}</span>
                          </div>
                        )}
                        {(route.terminal_awal || route.terminal_akhir) && (
                          <div className="flex items-start gap-2 text-xs text-gray-700">
                            <Compass className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">
                              {route.terminal_awal}
                              {route.terminal_awal && route.terminal_akhir && ' ➔ '}
                              {route.terminal_akhir}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Halte list preview */}
                      <div className="border border-gray-100 rounded-lg p-2.5 bg-white">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                            Urutan Halte ({route.halte?.length || 0})
                          </span>
                        </div>
                        <HaltePreviewList halte={route.halte || []} />
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-1.5 pt-1">
                        {/* Tombol Utama: Atur Tatanan Halte */}
                        <Button
                          size="sm"
                          onClick={() => openEdit(route, 'halte')}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs h-8 shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5 mr-1.5" />
                          Atur Tatanan & Urutan Halte ({route.total_halte || 0})
                        </Button>

                        {/* Tombol Sekunder: Edit Info Koridor & Hapus */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(route, 'info')}
                            className="flex-1 text-xs h-7 border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit Info Rute
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm(route)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs h-7 px-2.5"
                            title="Hapus Rute"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form & Sequence Editor Dialog */}
      <RouteEditorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editTarget}
        initialTab={dialogTab}
        onSaved={fetchRoutes}
        masterHaltes={masterHaltes}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rute Bus?</AlertDialogTitle>
            <AlertDialogDescription>
              Rute <strong>{deleteConfirm?.nama}</strong> ({deleteConfirm?.id}) dengan{' '}
              <strong>{deleteConfirm?.total_halte}</strong> halte akan dihapus permanen. File data halte
              lokal juga akan dibersihkan. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus Rute'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminRoutes;
