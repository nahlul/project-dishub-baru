import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/AdminLayout';
import AdminPageHeader from '@/components/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bus,
  Search,
  Plus,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowRightLeft,
  Info,
  Navigation,
  Check,
  Compass,
  AlertTriangle,
  FolderSync,
} from 'lucide-react';
import { routesAPI } from '@/lib/api';
import { toast } from 'sonner';

// ── Preset Warna Koridor Trans Koetaradja ────────────────────────
const COLOR_PRESETS = [
  { hex: '#0284c7', label: 'Biru Samudera' },
  { hex: '#059669', label: 'Hijau Zamrud' },
  { hex: '#dc2626', label: 'Merah Koridor' },
  { hex: '#f59e0b', label: 'Kuning Kunyit' },
  { hex: '#7c3aed', label: 'Ungu Bangsawan' },
  { hex: '#ea580c', label: 'Oranye Terang' },
  { hex: '#0d9488', label: 'Toska Pesisir' },
  { hex: '#4f46e5', label: 'Indigo Metro' },
  { hex: '#16a34a', label: 'Hijau Rimba' },
  { hex: '#64748b', label: 'Abu Modern' },
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

function formatApiErrorDetail(detail) {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  }
  return JSON.stringify(detail);
}

// ── Preview Urutan Halte Mini di Card Rute ────────────────────────
function RouteHalteSummary({ haltes = [] }) {
  if (!haltes || haltes.length === 0) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg text-center text-xs text-gray-400">
        Belum ada halte terdaftar di rute ini.
      </div>
    );
  }

  // Ringkasan per arah
  const arahMap = new Map();
  haltes.forEach((h) => {
    const a = h.arah || 'Rute Utama';
    if (!arahMap.has(a)) arahMap.set(a, []);
    arahMap.get(a).push(h);
  });

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
      {Array.from(arahMap.entries()).map(([arah, list], idx) => (
        <div key={idx} className="bg-slate-50/70 p-2.5 rounded-lg border border-gray-100 text-xs">
          <div className="flex items-center justify-between font-semibold text-gray-800 mb-1.5">
            <span className="flex items-center gap-1.5 text-[11px] text-sky-700 font-bold truncate">
              <Navigation className="w-3 h-3 text-sky-600 flex-shrink-0" />
              {arah}
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
              {list.length} Halte
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className="font-medium text-emerald-700 truncate max-w-[140px]">
              Awal: {list[0]?.nama || '-'}
            </span>
            <span className="text-gray-300">➔</span>
            <span className="font-medium text-amber-700 truncate max-w-[140px]">
              Akhir: {list[list.length - 1]?.nama || '-'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal Dialog Editor Rute & Tatanan Halte ───────────────────────
function RouteEditorDialog({
  open,
  onClose,
  initial = null,
  initialTab = 'info',
  onSaved,
  masterHaltes = [],
}) {
  const isEdit = !!initial;
  const [activeTab, setActiveTab] = useState(initialTab); // 'info' | 'halte'
  const [form, setForm] = useState(BLANK_FORM);
  const [halteList, setHalteList] = useState([]);
  const [activeArah, setActiveArah] = useState('');
  const [saving, setSaving] = useState(false);

  // Form tambah halte baru ke arah aktif
  const [newHalteName, setNewHalteName] = useState('');
  const [newHalteLat, setNewHalteLat] = useState('');
  const [newHalteLng, setNewHalteLng] = useState('');
  const [insertPos, setInsertPos] = useState('end'); // 'start' | 'end'
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);

  // Form edit nama arah trayek
  const [editingArahName, setEditingArahName] = useState('');
  const [isRenamingArah, setIsRenamingArah] = useState(false);

  // Form buat arah trayek baru
  const [isAddingNewArah, setIsAddingNewArah] = useState(false);
  const [newArahInput, setNewArahInput] = useState('');

  // Sinkronisasi data saat dialog dibuka
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
        const list = Array.isArray(initial.halte) ? JSON.parse(JSON.stringify(initial.halte)) : [];
        setHalteList(list);

        // Cari arah pertama yang ada
        const firstArah = list.find((h) => h.arah && h.arah.trim())?.arah || 'Rute Utama';
        setActiveArah(firstArah);
      } else {
        setForm(BLANK_FORM);
        setHalteList([]);
        setActiveArah('Pusat Kota ➔ Tujuan');
      }

      setNewHalteName('');
      setNewHalteLat('');
      setNewHalteLng('');
      setAutocompleteSuggestions([]);
      setIsRenamingArah(false);
      setIsAddingNewArah(false);
    }
  }, [open, initial, initialTab]);

  // Daftar distinct arah yang ada di rute ini
  const distinctArahList = useMemo(() => {
    const set = new Set();
    halteList.forEach((h) => {
      if (h.arah && h.arah.trim()) set.add(h.arah.trim());
    });
    if (set.size === 0) {
      const fallbackArah = form.terminal_awal && form.terminal_akhir
        ? `${form.terminal_awal} ➔ ${form.terminal_akhir}`
        : 'Rute Utama';
      set.add(fallbackArah);
    }
    return Array.from(set);
  }, [halteList, form.terminal_awal, form.terminal_akhir]);

  // Pastikan activeArah selalu valid
  useEffect(() => {
    if (distinctArahList.length > 0 && (!activeArah || !distinctArahList.includes(activeArah))) {
      setActiveArah(distinctArahList[0]);
    }
  }, [distinctArahList, activeArah]);

  // Halte-halte yang berada di arah aktif saat ini
  const currentArahHaltes = useMemo(() => {
    return halteList.filter((h) => (h.arah || distinctArahList[0] || 'Rute Utama') === activeArah);
  }, [halteList, activeArah, distinctArahList]);

  // Autocomplete nama halte
  const handleHalteNameChange = (val) => {
    setNewHalteName(val);
    if (!val.trim()) {
      setAutocompleteSuggestions([]);
      return;
    }
    const q = val.toLowerCase();
    const matches = masterHaltes.filter((m) => m.nama?.toLowerCase().includes(q));
    setAutocompleteSuggestions(matches.slice(0, 5));
  };

  const handleSelectAutocomplete = (m) => {
    setNewHalteName(m.nama);
    if (m.lat) setNewHalteLat(m.lat);
    if (m.lng) setNewHalteLng(m.lng);
    setAutocompleteSuggestions([]);
  };

  // Tambah halte baru ke arah aktif
  const handleAddHalteToActiveArah = () => {
    if (!newHalteName.trim()) {
      toast.error('Ketik nama halte terlebih dahulu');
      return;
    }

    const newItem = {
      nama: newHalteName.trim(),
      arah: activeArah || 'Rute Utama',
      lat: newHalteLat !== '' ? parseFloat(newHalteLat) : null,
      lng: newHalteLng !== '' ? parseFloat(newHalteLng) : null,
      jadwal: {},
    };

    // Cari posisi sisip di dalam halteList global
    let newFullList = [...halteList];
    const targetArah = activeArah;
    const indicesInTarget = [];
    newFullList.forEach((h, idx) => {
      if ((h.arah || 'Rute Utama') === targetArah) indicesInTarget.push(idx);
    });

    if (indicesInTarget.length === 0) {
      newFullList.push(newItem);
    } else if (insertPos === 'start') {
      const firstIdx = indicesInTarget[0];
      newFullList.splice(firstIdx, 0, newItem);
    } else {
      const lastIdx = indicesInTarget[indicesInTarget.length - 1];
      newFullList.splice(lastIdx + 1, 0, newItem);
    }

    setHalteList(newFullList);
    setNewHalteName('');
    setNewHalteLat('');
    setNewHalteLng('');
    toast.success(`Halte "${newItem.nama}" ditambahkan ke ${targetArah}`);
  };

  // Geser posisi halte di dalam arah aktif (Tatanan Reorder)
  const handleMoveHalteInArah = (localIdx, delta) => {
    const targetLocalIdx = localIdx + delta;
    if (targetLocalIdx < 0 || targetLocalIdx >= currentArahHaltes.length) return;

    // Ambil halte yang mau ditukar
    const itemA = currentArahHaltes[localIdx];
    const itemB = currentArahHaltes[targetLocalIdx];

    // Temukan index global mereka di halteList
    const globalIdxA = halteList.indexOf(itemA);
    const globalIdxB = halteList.indexOf(itemB);

    if (globalIdxA === -1 || globalIdxB === -1) return;

    const copy = [...halteList];
    copy[globalIdxA] = itemB;
    copy[globalIdxB] = itemA;
    setHalteList(copy);
  };

  // Ubah urutan langsung ke nomor tertentu
  const handleJumpHalteOrder = (localIdx, newOrderNumberStr) => {
    const newOrder = parseInt(newOrderNumberStr, 10);
    if (isNaN(newOrder) || newOrder < 1 || newOrder > currentArahHaltes.length) return;
    const targetLocalIdx = newOrder - 1;
    if (targetLocalIdx === localIdx) return;

    const movingItem = currentArahHaltes[localIdx];
    // Urutkan ulang halte dalam arah ini saja
    const arahItems = [...currentArahHaltes];
    arahItems.splice(localIdx, 1);
    arahItems.splice(targetLocalIdx, 0, movingItem);

    // Rekonstruksi halteList
    let rebuilt = [];
    distinctArahList.forEach((a) => {
      if (a === activeArah) {
        rebuilt = rebuilt.concat(arahItems);
      } else {
        rebuilt = rebuilt.concat(halteList.filter((h) => (h.arah || 'Rute Utama') === a));
      }
    });
    setHalteList(rebuilt);
    toast.success(`Urutan "${movingItem.nama}" dipindah ke #${newOrder}`);
  };

  // Update field halte tertentu
  const handleUpdateHalteField = (item, field, val) => {
    const globalIdx = halteList.indexOf(item);
    if (globalIdx === -1) return;
    const copy = [...halteList];
    copy[globalIdx] = { ...copy[globalIdx], [field]: val };
    setHalteList(copy);
  };

  // Hapus halte dari rute
  const handleRemoveHalte = (item) => {
    const globalIdx = halteList.indexOf(item);
    if (globalIdx === -1) return;
    const copy = [...halteList];
    copy.splice(globalIdx, 1);
    setHalteList(copy);
    toast.info(`Halte "${item.nama}" dihapus dari rute`);
  };

  // Pindahkan halte ke arah/trayek lain
  const handleTransferHalteToOtherArah = (item, targetArah) => {
    const globalIdx = halteList.indexOf(item);
    if (globalIdx === -1) return;
    const copy = [...halteList];
    copy[globalIdx] = { ...copy[globalIdx], arah: targetArah };
    setHalteList(copy);
    toast.success(`"${item.nama}" dipindahkan ke trayek: ${targetArah}`);
  };

  // Balik urutan halte untuk arah aktif ini saja
  const handleReverseCurrentArah = () => {
    if (currentArahHaltes.length < 2) return;
    const reversedArahItems = [...currentArahHaltes].reverse();
    let rebuilt = [];
    distinctArahList.forEach((a) => {
      if (a === activeArah) {
        rebuilt = rebuilt.concat(reversedArahItems);
      } else {
        rebuilt = rebuilt.concat(halteList.filter((h) => (h.arah || 'Rute Utama') === a));
      }
    });
    setHalteList(rebuilt);
    toast.success(`Urutan halte untuk "${activeArah}" berhasil dibalik (reverse)`);
  };

  // Ubah nama trayek/arah (Rename Direction)
  const handleSaveRenameArah = () => {
    if (!editingArahName.trim()) {
      setIsRenamingArah(false);
      return;
    }
    const oldArah = activeArah;
    const newArah = editingArahName.trim();
    if (oldArah === newArah) {
      setIsRenamingArah(false);
      return;
    }

    const copy = halteList.map((h) => {
      if ((h.arah || 'Rute Utama') === oldArah) {
        return { ...h, arah: newArah };
      }
      return h;
    });

    setHalteList(copy);
    setActiveArah(newArah);
    setIsRenamingArah(false);
    toast.success(`Arah trayek diubah menjadi: "${newArah}"`);
  };

  // Buat arah trayek baru
  const handleCreateNewArah = () => {
    if (!newArahInput.trim()) {
      setIsAddingNewArah(false);
      return;
    }
    const createdArah = newArahInput.trim();
    setActiveArah(createdArah);
    setIsAddingNewArah(false);
    setNewArahInput('');
    toast.success(`Trayek baru "${createdArah}" siap diisi halte`);
  };

  // Simpan perubahan ke backend
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
      toast.error(msg || 'Gagal menyimpan rute ke server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-full sm:w-[96vw] h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-none sm:rounded-2xl">
        {/* Header Dialog */}
        <DialogHeader className="px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: form.warna || '#0284c7' }}
              >
                <Bus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {isEdit ? `Kelola Rute: ${form.nama || initial?.id}` : 'Tambah Rute Bus Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 truncate mt-0.5">
                  ID: <code className="font-mono text-gray-700">{form.id || '(baru)'}</code> •{' '}
                  <span className="font-semibold text-sky-600">{halteList.length} Total Halte</span> •{' '}
                  <span>{distinctArahList.length} Arah Trayek</span>
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Tab Switcher Utama */}
          <div className="flex gap-1.5 mt-3 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'info'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              1. Info Koridor & Jam Operasi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('halte')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'halte'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              2. Tatanan Halte & Arah Lintasan ({halteList.length})
            </button>
          </div>
        </DialogHeader>

        {/* Isi Tab 1: Info Koridor */}
        {activeTab === 'info' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">
                    ID Rute (Slug URL) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.id}
                    disabled={isEdit}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="misal: koridor-1 atau blang-bintang"
                    className="mt-1 font-mono text-xs bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Huruf kecil & tanda hubung (-) saja. Contoh: <code className="text-sky-600">mata-ie-1</code>
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">
                    Nama Rute / Koridor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="misal: Koridor 1 - Blang Bintang"
                    className="mt-1 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Dari mana ke mana (Terminal Awal & Akhir) */}
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-3">
                <p className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-600" />
                  Lintasan Utama Rute ("Dari Mana ke Mana")
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-700">
                      Terminal Asal / Titik Awal:
                    </Label>
                    <Input
                      value={form.terminal_awal}
                      onChange={(e) => setForm({ ...form, terminal_awal: e.target.value })}
                      placeholder="misal: Masjid Raya Baiturrahman"
                      className="mt-1 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-700">
                      Terminal Tujuan / Titik Akhir:
                    </Label>
                    <Input
                      value={form.terminal_akhir}
                      onChange={(e) => setForm({ ...form, terminal_akhir: e.target.value })}
                      placeholder="misal: Bandara Sultan Iskandar Muda"
                      className="mt-1 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Warna Jalur */}
              <div>
                <Label className="text-xs font-semibold text-gray-700">Warna Rute di Peta</Label>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setForm({ ...form, warna: p.hex })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all shadow-xs ${
                        form.warna?.toLowerCase() === p.hex.toLowerCase()
                          ? 'ring-2 ring-offset-2 ring-sky-600 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    >
                      {form.warna?.toLowerCase() === p.hex.toLowerCase() && (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="color"
                      value={form.warna}
                      onChange={(e) => setForm({ ...form, warna: e.target.value })}
                      className="w-7 h-7 p-0 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={form.warna}
                      onChange={(e) => setForm({ ...form, warna: e.target.value })}
                      className="w-24 h-7 text-xs font-mono uppercase bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Jam Operasi & Hari */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Jam Operasi Bus</Label>
                  <Input
                    value={form.jam_operasi}
                    onChange={(e) => setForm({ ...form, jam_operasi: e.target.value })}
                    placeholder="06:30 - 18:30 WIB"
                    className="mt-1 text-xs bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Hari Layanan</Label>
                  <Input
                    value={form.hari}
                    onChange={(e) => setForm({ ...form, hari: e.target.value })}
                    placeholder="Setiap Hari (Senin - Minggu)"
                    className="mt-1 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <Label className="text-xs font-semibold text-gray-700">Keterangan / Deskripsi Rute</Label>
                <textarea
                  rows={2}
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Informasi tambahan mengenai rute ini..."
                  className="w-full mt-1 p-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setActiveTab('halte')}
                className="bg-sky-600 hover:bg-sky-700 text-xs px-5 h-9"
              >
                Lanjut Atur Tatanan Halte & Arah ➔
              </Button>
            </div>
          </div>
        )}

        {/* Isi Tab 2: Tatanan Halte Berdasarkan Arah ("Dari Mana ke Mana") */}
        {activeTab === 'halte' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-gray-50/50">
            {/* Navigasi Pilihan Arah / Trayek */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                  Pilih Arah Trayek yang Dikelola:
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNewArah(!isAddingNewArah)}
                  className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Tambah Arah Trayek
                </button>
              </div>

              {/* Tabs Pill Arah */}
              <div className="flex flex-wrap items-center gap-1.5">
                {distinctArahList.map((arah, idx) => {
                  const count = halteList.filter((h) => (h.arah || 'Rute Utama') === arah).length;
                  const isCurrent = activeArah === arah;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveArah(arah);
                        setIsRenamingArah(false);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-sky-600 text-white shadow-xs font-bold'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>{arah}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isCurrent ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Form Tambah Arah Baru */}
              {isAddingNewArah && (
                <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 flex items-center gap-2 mt-2">
                  <Input
                    value={newArahInput}
                    onChange={(e) => setNewArahInput(e.target.value)}
                    placeholder="Contoh: Terminal Batoh ➔ Ulee Lheue"
                    className="text-xs h-8 bg-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNewArah}
                    className="text-xs h-8 bg-sky-600 hover:bg-sky-700"
                  >
                    Buat
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingNewArah(false)}
                    className="text-xs h-8"
                  >
                    Batal
                  </Button>
                </div>
              )}
            </div>

            {/* Banner Trayek Aktif & Aksi Cepat */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div className="min-w-0">
                  {isRenamingArah ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={editingArahName}
                        onChange={(e) => setEditingArahName(e.target.value)}
                        className="text-xs h-7 w-64 bg-white"
                        placeholder="Nama trayek baru..."
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveRenameArah}
                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                      >
                        Simpan
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsRenamingArah(false)}
                        className="text-xs h-7"
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        Trayek: <span className="text-sky-700">{activeArah}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArahName(activeArah);
                          setIsRenamingArah(true);
                        }}
                        className="p-1 text-gray-400 hover:text-sky-600 rounded"
                        title="Ganti nama arah lintasan ini"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {currentArahHaltes.length} halte berurutan dari awal sampai akhir perjalanan.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReverseCurrentArah}
                    disabled={currentArahHaltes.length < 2}
                    className="text-xs h-7 px-2.5 border-gray-300 text-gray-700 hover:bg-gray-50"
                    title="Balik urutan halte untuk arah ini saja"
                  >
                    <ArrowUpDown className="w-3 h-3 mr-1" /> Balik Urutan Arah Ini
                  </Button>
                </div>
              </div>

              {/* Form Tambah Halte Cepat ke Arah Ini */}
              <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-100 space-y-2">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                  Tambah Halte ke Trayek Ini:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="relative sm:col-span-5">
                    <Input
                      value={newHalteName}
                      onChange={(e) => handleHalteNameChange(e.target.value)}
                      placeholder="Ketik nama halte baru / cari master..."
                      className="text-xs h-8 bg-white"
                    />
                    {/* Autocomplete dropdown */}
                    {autocompleteSuggestions.length > 0 && (
                      <div className="absolute top-9 left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {autocompleteSuggestions.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectAutocomplete(m)}
                            className="p-2 text-xs hover:bg-sky-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center justify-between"
                          >
                            <span className="font-semibold text-gray-800">{m.nama}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {m.lat?.toFixed(3)}, {m.lng?.toFixed(3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      step="any"
                      value={newHalteLat}
                      onChange={(e) => setNewHalteLat(e.target.value)}
                      placeholder="Lat (GPS)"
                      className="text-xs h-8 bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      step="any"
                      value={newHalteLng}
                      onChange={(e) => setNewHalteLng(e.target.value)}
                      placeholder="Lng (GPS)"
                      className="text-xs h-8 bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <select
                      value={insertPos}
                      onChange={(e) => setInsertPos(e.target.value)}
                      className="text-xs h-8 border border-gray-200 rounded-md px-1.5 bg-white flex-1"
                    >
                      <option value="end">Sisip di Akhir</option>
                      <option value="start">Sisip di #1 (Awal)</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddHalteToActiveArah}
                      className="text-xs h-8 px-3 bg-sky-600 hover:bg-sky-700"
                    >
                      + Tambah
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tatanan Urutan Halte (Reorder, Edit, Nomor Urut) */}
              <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                {currentArahHaltes.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <MapPin className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-gray-600">
                      Belum ada halte untuk trayek "{activeArah}"
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Gunakan form di atas untuk menambahkan halte pertama pada trayek ini.
                    </p>
                  </div>
                ) : (
                  currentArahHaltes.map((halte, localIdx) => {
                    const isFirst = localIdx === 0;
                    const isLast = localIdx === currentArahHaltes.length - 1;

                    return (
                      <div
                        key={localIdx}
                        className="p-2.5 bg-white rounded-lg border border-gray-200 hover:border-sky-300 transition-colors space-y-2 shadow-2xs"
                      >
                        {/* Baris Utama: Nomor Urut, Nama Halte, Tombol Geser */}
                        <div className="flex items-center gap-2">
                          {/* Input Nomor Urut Langsung */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[10px] text-gray-400 font-bold">#</span>
                            <input
                              type="number"
                              min={1}
                              max={currentArahHaltes.length}
                              defaultValue={localIdx + 1}
                              key={`${localIdx}-${currentArahHaltes.length}`}
                              onBlur={(e) => handleJumpHalteOrder(localIdx, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="w-9 h-7 text-xs font-bold text-center bg-sky-50 text-sky-900 border border-sky-200 rounded-md focus:bg-white focus:border-sky-500"
                              title="Ketik nomor untuk langsung memindah posisi urutan"
                            />
                          </div>

                          {/* Input Nama Halte */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={halte.nama || ''}
                              onChange={(e) => handleUpdateHalteField(halte, 'nama', e.target.value)}
                              className="w-full text-xs font-bold text-gray-900 border border-transparent hover:border-gray-200 focus:border-sky-500 rounded px-2 py-1 transition-colors"
                              placeholder="Nama Halte"
                            />
                          </div>

                          {/* Tombol Reorder Panah Naik / Turun */}
                          <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-md p-0.5 flex-shrink-0">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveHalteInArah(localIdx, -1)}
                              className="p-1 rounded text-gray-600 hover:text-sky-600 hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Geser Naik (Mendahului halte sebelumnya)"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveHalteInArah(localIdx, 1)}
                              className="p-1 rounded text-gray-600 hover:text-sky-600 hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Geser Turun (Setelah halte berikutnya)"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => handleRemoveHalte(halte)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                            title="Hapus halte dari rute"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Baris Kedua: Koordinat GPS & Pindah Arah */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-gray-50 text-[11px]">
                          <div className="flex items-center gap-2 font-mono text-gray-500">
                            <span>Lat:</span>
                            <input
                              type="number"
                              step="any"
                              value={halte.lat ?? ''}
                              onChange={(e) =>
                                handleUpdateHalteField(
                                  halte,
                                  'lat',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="5.55..."
                              className="w-20 text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50"
                            />
                            <span>Lng:</span>
                            <input
                              type="number"
                              step="any"
                              value={halte.lng ?? ''}
                              onChange={(e) =>
                                handleUpdateHalteField(
                                  halte,
                                  'lng',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="95.31..."
                              className="w-20 text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50"
                            />
                          </div>

                          {/* Pindah ke Arah Sebelah (Jika ada lebih dari 1 arah) */}
                          {distinctArahList.length > 1 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">Pindah ke:</span>
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleTransferHalteToOtherArah(halte, e.target.value);
                                  }
                                }}
                                className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white text-sky-700 font-semibold"
                              >
                                <option value="">Pilih Trayek Lain...</option>
                                {distinctArahList
                                  .filter((a) => a !== activeArah)
                                  .map((a, i) => (
                                    <option key={i} value={a}>
                                      ➔ {a}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Dialog (Sticky) */}
        <DialogFooter className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="text-xs text-gray-600 flex items-center justify-between sm:justify-start gap-2">
            <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {activeTab === 'info' ? 'Tab 1/2: Info Koridor' : `Tab 2/2: ${halteList.length} Halte Terpasang`}
            </span>
            <span className="text-[11px] text-gray-400">
              Tekan "Simpan Perubahan" agar langsung live di web
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-none text-xs"
            >
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
                  ? 'Menyimpan ke Server...'
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

// ── Main Admin Routes Page ───────────────────────────────────
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

  const filteredRoutes = useMemo(() => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase();
    return routes.filter(
      (r) =>
        r.nama?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.deskripsi?.toLowerCase().includes(q) ||
        r.terminal_awal?.toLowerCase().includes(q) ||
        r.terminal_akhir?.toLowerCase().includes(q)
    );
  }, [routes, search]);

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
          subtitle="Kelola rute, atur arah trayek ('dari mana ke mana'), dan susun urutan halte Trans Koetaradja"
          action={
            <Button onClick={openAdd} className="bg-sky-600 hover:bg-sky-700 text-xs sm:text-sm font-semibold shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Rute Baru
            </Button>
          }
        />

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-gray-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Rute</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{routes.length}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Koridor aktif di database</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Bus className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Halte</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{totalHalte}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Titik singgah bus terdaftar</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sinkronisasi Web</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">100% Konek</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Live ke Rute, Halte, & Trip Planner</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FolderSync className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari rute, koridor, terminal..."
              className="pl-9 text-xs sm:text-sm bg-white border-gray-200"
            />
          </div>
          <p className="text-xs text-gray-500 self-end sm:self-center font-medium">
            Menampilkan {filteredRoutes.length} dari {routes.length} rute
          </p>
        </div>

        {/* Daftar Rute Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Bus className="w-8 h-8 text-sky-500 animate-pulse mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Memuat daftar rute...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">Tidak ada rute ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Coba gunakan kata kunci pencarian lain.' : 'Klik tombol "Tambah Rute Baru" untuk memulai.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredRoutes.map((route) => {
                const routeColor = route.warna || '#0284c7';
                return (
                  <motion.div
                    key={route.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="border-gray-200 shadow-2xs hover:shadow-sm transition-all overflow-hidden flex flex-col h-full bg-white">
                      {/* Color Stripe Top */}
                      <div className="h-2 w-full" style={{ backgroundColor: routeColor }} />

                      <CardContent className="p-4 flex flex-col flex-1 space-y-3">
                        {/* Top: Icon + Title + Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs flex-shrink-0"
                              style={{ backgroundColor: routeColor }}
                            >
                              <Bus className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-gray-900 truncate">{route.nama}</h3>
                              <p className="text-[11px] font-mono text-gray-400 truncate">ID: {route.id}</p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className="text-[11px] px-2 py-0.5 font-semibold flex-shrink-0"
                            style={{ borderColor: routeColor, color: routeColor }}
                          >
                            {route.total_halte || 0} Halte
                          </Badge>
                        </div>

                        {/* Asal - Tujuan ("Dari mana ke mana") */}
                        {(route.terminal_awal || route.terminal_akhir) && (
                          <div className="bg-sky-50/50 p-2 rounded-lg border border-sky-100/60 text-xs text-gray-700 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                            <span className="truncate font-medium">
                              {route.terminal_awal || 'Awal'} ➔ {route.terminal_akhir || 'Akhir'}
                            </span>
                          </div>
                        )}

                        {/* Info Jam & Hari */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{route.jam_operasi || '06:30 - 18:30 WIB'}</span>
                          </div>
                          {route.deskripsi && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 pt-0.5">{route.deskripsi}</p>
                          )}
                        </div>

                        {/* Ringkasan Arah & Halte */}
                        <div className="flex-1">
                          <RouteHalteSummary haltes={route.halte} />
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100">
                          {/* Tombol Utama: Atur Tatanan Halte & Arah */}
                          <Button
                            size="sm"
                            onClick={() => openEdit(route, 'halte')}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs h-8 shadow-2xs font-semibold"
                          >
                            <Navigation className="w-3.5 h-3.5 mr-1.5" />
                            Kelola Arah & Tatanan Halte ({route.total_halte || 0})
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
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Dialog Form Tambah / Edit */}
        {dialogOpen && (
          <RouteEditorDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            initial={editTarget}
            initialTab={dialogTab}
            onSaved={fetchRoutes}
            masterHaltes={masterHaltes}
          />
        )}

        {/* Dialog Konfirmasi Hapus */}
        <Dialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
          <DialogContent className="max-w-md p-5 bg-white">
            <DialogHeader>
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Hapus Rute "{deleteConfirm?.nama}"?
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1">
                Tindakan ini akan menghapus rute koridor{' '}
                <strong className="text-gray-700">{deleteConfirm?.id}</strong> dan seluruh{' '}
                <strong>{deleteConfirm?.total_halte || 0} halte</strong> yang terdaftar di dalamnya. Data yang
                dihapus tidak dapat dipulihkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-4"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Rute'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRoutes;
