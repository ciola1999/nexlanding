'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { Product, CartItem } from '@/types'; // Pastikan path types benar
import { formatRupiah, cn } from '@/lib/utils';
import {
  Trash2,
  Plus,
  Minus,
  Search,
  Loader2,
  ShoppingCart,
  PackageOpen,
  X,
  User,
  Phone,
  Armchair,
} from 'lucide-react';
import { processCheckout } from '@/features/smart-pos/_actions/transaction';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface POSInterfaceProps {
  initialProducts: Product[];
}

export default function POSInterface({ initialProducts }: POSInterfaceProps) {
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // STATE BARU: Untuk Modal Checkout
  // STATE BARU: Kontrol Modal & Form Konsumen
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
  });

  // Refs untuk animasi
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. PERFORMANCE OPTIMIZATION (useMemo) ---
  // Filter produk dibungkus useMemo agar tidak render ulang saat ngetik cart
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [initialProducts, searchQuery]);

  // --- 2. GSAP ANIMATION ---
  // Animasi saat hasil pencarian berubah (Grid produk muncul smooth)
  useGSAP(
    () => {
      if (filteredProducts.length > 0) {
        gsap.fromTo(
          '.product-card',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
        );
      }
    },
    { dependencies: [filteredProducts], scope: containerRef }
  );

  // --- 3. STORAGE LOGIC (Tetap pertahankan logic kamu yg sudah benar) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('nexpos-cart');
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (error) {
            console.error('Gagal load cart:', error);
            localStorage.removeItem('nexpos-cart');
          }
        }
        setIsInitialized(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('nexpos-cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // --- 4. CART LOGIC ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        toast.info(`+1 ${product.name}`);
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success(`${product.name} ditambahkan`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    toast.warning('Keranjang dikosongkan');
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  // LOGIC BARU: Handle Input Change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  };

  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setIsCheckoutOpen(true);
  };

  // LOGIC BARU: Submit Transaksi Final
  // FUNGSI BARU: Proses Pembayaran Final (Dipanggil dari Modal)
  const handleFinalPayment = () => {
    if (!customerForm.tableNumber.trim()) {
      toast.error('Mohon isi Nomor Meja');
      return;
    }

    startTransition(async () => {
      // Panggil Server Action dengan parameter tambahan
      const result = await processCheckout(cart, customerForm);

      if (result.success) {
        toast.success(result.message);
        setCart([]); // Kosongkan keranjang
        setIsCheckoutOpen(false); // Tutup modal
        setCustomerForm({
          tableNumber: '',
          customerName: '',
          customerPhone: '',
        }); // Reset form
      } else {
        toast.error(result.message);
      }
    });
  };
  // UI Loading Awal
  if (!isInitialized) {
    return (
      <div className="flex h-full items-center justify-center text-[#dfff4f]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    // Gunakan h-full agar mengisi sisa ruang dari parent
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row h-full gap-6 relative"
    >
      {/* ========================================================= */}
      {/* MODAL CHECKOUT OVERLAY (Tambahkan di dalam container utama) */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 rounded-3xl animate-in fade-in duration-200">
          <div className="bg-[#1e1f24] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Info Pesanan</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form Input */}
            <div className="space-y-4">
              {/* Nomor Meja (Wajib) */}
              <div>
                <label className="block text-xs font-bold text-[#dfff4f] uppercase mb-1 ml-1">
                  Nomor Meja *
                </label>
                <div className="relative">
                  <Armchair
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    name="tableNumber"
                    autoFocus
                    value={customerForm.tableNumber}
                    onChange={handleFormChange}
                    placeholder="Contoh: 12 atau VIP A"
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-[#dfff4f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Nama (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Nama Pemesan (Opsional)
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    name="customerName"
                    value={customerForm.customerName}
                    onChange={handleFormChange}
                    placeholder="Nama pelanggan..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-[#dfff4f] focus:outline-none"
                  />
                </div>
              </div>

              {/* No HP (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  WhatsApp / HP (Opsional)
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    name="customerPhone"
                    type="number"
                    value={customerForm.customerPhone}
                    onChange={handleFormChange}
                    placeholder="08..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-[#dfff4f] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Total Summary Kecil */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center mb-6">
              <span className="text-gray-400">Total Pembayaran</span>
              <span className="text-xl font-bold text-[#dfff4f]">
                {formatRupiah(subtotal)}
              </span>
            </div>

            {/* Tombol Aksi */}
            <button
              onClick={handleFinalPayment}
              disabled={isPending}
              className="w-full bg-[#dfff4f] hover:bg-[#ccee3d] text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Konfirmasi & Bayar'
              )}
            </button>
          </div>
        </div>
      )}
      {/* ========================================================= */}

      {/* --- BAGIAN KIRI: DAFTAR PRODUK (70% width) --- */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Search Bar (Modern Glass) */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className="text-gray-500 group-focus-within:text-[#dfff4f] transition-colors"
              size={20}
            />
          </div>
          <input
            type="text"
            placeholder="Cari nama produk atau scan SKU..."
            className="w-full pl-12 pr-4 py-3 bg-[#18191e] border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-[#dfff4f]/50 focus:ring-1 focus:ring-[#dfff4f]/50 transition-all shadow-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-600 gap-4">
              <PackageOpen size={64} strokeWidth={1} />
              <p>Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => product.stock > 0 && addToCart(product)}
                  className={cn(
                    'product-card group relative bg-[#18191e] border border-white/5 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:border-[#dfff4f]/30 hover:shadow-[0_0_20px_rgba(223,255,79,0.05)] hover:-translate-y-1',
                    product.stock <= 0 &&
                      'opacity-50 pointer-events-none grayscale'
                  )}
                >
                  {/* Stok Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-bold',
                        product.stock < 10
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-white/5 text-gray-400'
                      )}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Icon/Image Placeholder */}
                  <div className="h-24 w-full bg-white/5 rounded-xl mb-4 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    {/* Nanti bisa diganti <Image> */}
                    <span className="text-2xl font-bold text-white/20 group-hover:text-[#dfff4f]/50 transition-colors">
                      {product.name.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <h3 className="font-medium text-gray-200 line-clamp-1 group-hover:text-[#dfff4f] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 font-mono">
                    {product.sku || 'NO-SKU'}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">
                      {formatRupiah(product.price)}
                    </p>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#dfff4f] opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- BAGIAN KANAN: KERANJANG (30% width / Fixed Sidebar) --- */}
      <div className="w-full lg:w-[400px] flex flex-col h-[calc(100vh-140px)] sticky top-4">
        <div className="bg-[#18191e] border border-white/5 rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden">
          {/* Header Keranjang */}
          <div className="p-5 border-b border-white/5 bg-[#18191e] flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-[#dfff4f]" size={20} />
              <h2 className="font-bold text-white">Current Order</h2>
            </div>
            <span className="bg-white/10 text-xs px-2 py-1 rounded-md text-gray-300">
              {cart.length} Items
            </span>
          </div>

          {/* List Item */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 opacity-50">
                <ShoppingCart size={48} strokeWidth={1} />
                <p className="text-sm">Keranjang kosong</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="group flex gap-3 bg-white/5 hover:bg-white/[0.07] p-3 rounded-2xl transition-all border border-transparent hover:border-white/10"
                >
                  {/* Item Info */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#dfff4f] font-mono mt-1">
                      {formatRupiah(item.price)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl px-2 py-1 h-fit self-center">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-600 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          <div className="p-5 bg-[#121317] border-t border-white/5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Tax (0%)</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/5">
                <span>Total</span>
                <span className="text-[#dfff4f]">{formatRupiah(subtotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 pt-2">
              <button
                onClick={clearCart}
                disabled={cart.length === 0 || isPending}
                className="col-span-1 flex items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all disabled:opacity-30"
              >
                <Trash2 size={18} />
              </button>

              <button
                onClick={openCheckoutModal}
                disabled={cart.length === 0 || isPending}
                className="col-span-3 bg-[#dfff4f] hover:bg-[#ccee3d] text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(223,255,79,0.1)] hover:shadow-[0_0_30px_rgba(223,255,79,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  'Bayar Sekarang'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
