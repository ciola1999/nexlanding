'use client';

import { useRef, useState, useActionState } from 'react'; // <--- REACT 19 IMPORT
import { useFormStatus } from 'react-dom'; // <--- REACT 19 HOOK UTK STATUS
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import {
  Save,
  Calculator,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { createProduct } from '../_actions/products';
import Image from 'next/image'; // Import Next Image
import { toast } from 'sonner'; // Jangan lupa import toast

// --- SUB-COMPONENT: TOMBOL SUBMIT (Wajib dipisah agar useFormStatus jalan) ---
function SubmitButton() {
  const { pending } = useFormStatus(); // Otomatis true saat action jalan

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-lg bg-[#dfff4f] text-black text-sm font-bold hover:bg-[#ccee2e] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Menyimpan...
        </>
      ) : (
        <>
          <Save size={16} /> Simpan Produk
        </>
      )}
    </button>
  );
}

// --- COMPONENT UTAMA ---
export default function ProductForm({ onClose }: { onClose: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);

  // REACT 19: Gunakan useActionState
  // Argumen: (ActionFunction, InitialState)
  const [state, formAction] = useActionState(createProduct, {
    message: '',
    success: false,
  });

  // Derived State untuk Kalkulator Bisnis
  const [cost, setCost] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  const profit = (price || 0) - (cost || 0);
  const marginRaw = price > 0 ? (profit / price) * 100 : 0;
  const margin = parseFloat(marginRaw.toFixed(2));

  // 👇 STATE UNTUK PREVIEW GAMBAR
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Efek samping: Jika sukses, tutup modal setelah delay
  if (state.success) {
    // Kita biarkan user baca pesan sukses sebentar, lalu tutup
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  // Animasi Masuk
  useGSAP(() => {
    gsap.fromTo(
      formRef.current,
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' }
    );
  }, []);

  // Animasi Margin Bar
  useGSAP(() => {
    const color = margin < 15 ? '#ef4444' : margin < 30 ? '#eab308' : '#22c55e';
    gsap.to('#margin-indicator', { color: color, duration: 0.5 });
    gsap.to('#margin-bar', {
      width: `${Math.min(Math.max(margin, 0), 100)}%`,
      backgroundColor: color,
      duration: 0.5,
    });
  }, [margin]);

  // 👇 FUNGSI HANDLE SAAT PILIH FILE
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 🛡️ VALIDASI SIZE (Cek di sini sebelum upload)
      // 5MB = 5 * 1024 * 1024
      if (file.size > 1024 * 1024) {
        toast.error('File terlalu besar! Maksimal 1MB.');
        // Reset input agar user bisa pilih ulang
        e.target.value = '';
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* REACT 19: Form action langsung ke function dari hook */}
      <form
        ref={formRef}
        action={formAction}
        className="bg-[#18191e] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden relative"
      >
        {/* Header & Success Message Overlay */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Tambah Produk</h2>
            <p className="text-gray-400 text-sm">
              Perspektif Manajemen: Jaga margin di atas 30%.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* FEEDBACK PESAN DARI SERVER */}
        {state.message && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm flex items-center gap-2 ${
              state.success
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {state.success ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {state.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* --- BAGIAN INPUT GAMBAR (TARUH DI ATAS NAMA PRODUK) --- */}
          <div className="mb-6 flex flex-col items-center">
            <label
              htmlFor="image-upload"
              className="group relative w-32 h-32 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#dfff4f] hover:bg-white/5 transition-all overflow-hidden"
            >
              {imagePreview ? (
                // Jika ada gambar dipilih, tampilkan preview
                <>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  {/* Overlay saat hover untuk ganti gambar */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImagePlus className="text-white" size={24} />
                  </div>
                </>
              ) : (
                // Jika belum ada gambar
                <div className="text-center p-2">
                  <ImagePlus
                    className="mx-auto text-gray-400 mb-2 group-hover:text-[#dfff4f] transition-colors"
                    size={24}
                  />
                  <span className="text-[10px] text-gray-500 uppercase font-bold">
                    Upload Foto
                  </span>
                </div>
              )}

              {/* Input File Tersembunyi */}
              <input
                id="image-upload"
                name="image" // Harus sama dengan formData.get('image') di action
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Format: JPG, PNG (Max 2MB)
            </p>
          </div>
          {/* KOLOM KIRI (Input Biasa) */}
          <div className="space-y-5">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                Nama Produk
              </label>
              <input
                name="name"
                required
                type="text"
                placeholder="Nama Produk"
                className="smart-input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                  SKU
                </label>
                <input
                  name="sku"
                  type="text"
                  placeholder="SKU-001"
                  className="smart-input w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                  Stok
                </label>
                <input
                  name="stock"
                  type="number"
                  defaultValue={0}
                  className="smart-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                Deskripsi
              </label>
              <textarea
                name="description"
                rows={2}
                className="smart-input w-full resize-none"
              />
            </div>
          </div>

          {/* KOLOM KANAN (Financial Logic) */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-400 uppercase font-bold mb-2">
                  <Calculator size={14} /> Cost Price (HPP)
                </label>
                <input
                  name="costPrice"
                  type="number"
                  required
                  min="0"
                  step="100"
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="smart-input w-full font-mono text-yellow-400"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                  Selling Price
                </label>
                <input
                  name="price"
                  type="number"
                  required
                  min="0"
                  step="100"
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="smart-input w-full font-mono text-green-400"
                  placeholder="0"
                />
              </div>

              {/* VISUALISASI MARGIN (Client Only Logic) */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-gray-400 text-xs">Margin</span>
                  <span
                    id="margin-indicator"
                    className="text-xl font-bold font-mono"
                  >
                    {margin}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-3">
                  <div
                    id="margin-bar"
                    className="h-full w-0 rounded-full"
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Profit/Unit:</span>
                  <span className="font-mono text-white">
                    Rp {profit.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white"
          >
            Batal
          </button>

          {/* BUTTON COMPONENT YANG MEMAKAI USEFORMSTATUS */}
          <SubmitButton />
        </div>
      </form>

      {/* Utility Class untuk styling input biar ga redundant */}
      <style jsx>{`
        .smart-input {
          @apply bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#dfff4f] focus:outline-none transition-colors;
        }
      `}</style>
    </div>
  );
}
