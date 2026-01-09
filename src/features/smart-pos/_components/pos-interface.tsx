'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { Product, CartItem } from '@/types';
import { Order } from '@/features/smart-pos/db/schema'; // Import tipe Order dari schema
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
  Printer,
  CheckCircle2,
  Send,
  ArrowRight,
  Utensils,
  ShoppingBag,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { processCheckout } from '@/features/smart-pos/_actions/transaction';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// --- TYPE DEFINITIONS UTAMA ---
// Kita gabungkan data Order dari DB dengan Snapshot Cart Items untuk ditampilkan di struk
interface SuccessData {
  order: Order;
  items: CartItem[];
}

interface POSInterfaceProps {
  initialProducts: Product[];
}

export default function POSInterface({ initialProducts }: POSInterfaceProps) {
  // --- STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // Modal Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // --- UPDATE 1: Update State Form ---
  const [customerForm, setCustomerForm] = useState({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    // Tambahkan default value
    orderType: 'dine_in' as 'dine_in' | 'take_away',
    paymentMethod: 'cash' as 'cash' | 'transfer',
  });

  // STATE BARU: Menyimpan data sukses untuk Modal & Struk
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- MEMO & EFFECTS ---
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [initialProducts, searchQuery]);

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

  // --- CART ACTIONS ---
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
          if (item.id === productId)
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) =>
    setCart((prev) => prev.filter((item) => item.id !== productId));
  const clearCart = () => {
    setCart([]);
    toast.warning('Keranjang dikosongkan');
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  // --- CHECKOUT LOGIC ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  };

  // --- UPDATE 2: Handle Change Khusus untuk Radio/Select ---
  const handleValueChange = (field: string, value: string) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFinalPayment = () => {
    // Validasi conditional: Table Number hanya wajib jika Dine In
    if (
      customerForm.orderType === 'dine_in' &&
      !customerForm.tableNumber.trim()
    ) {
      toast.error('Mohon isi Nomor Meja untuk Dine In');
      return;
    }

    const currentCartSnapshot = [...cart];

    startTransition(async () => {
      // ... (mapping items tetap sama) ...
      const checkoutItems = currentCartSnapshot.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Kirim customerForm lengkap (termasuk orderType & paymentMethod)
      const result = await processCheckout(checkoutItems, customerForm);

      if (result.success && result.data) {
        // ... (Logic sukses tetap sama) ...
        setSuccessData({
          order: result.data,
          items: currentCartSnapshot,
        });
        setCart([]);
        setIsCheckoutOpen(false);
        // Reset form ke default
        setCustomerForm({
          tableNumber: '',
          customerName: '',
          customerPhone: '',
          orderType: 'dine_in',
          paymentMethod: 'cash',
        });
        toast.success('Transaksi Berhasil!');
      } else {
        toast.error(result.message || 'Terjadi kesalahan');
      }
    });
  };

  // --- ACTIONS: PRINT & WA ---
  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (!successData) return;
    const { order, items } = successData;

    // Format Pesan WA
    let message = `*NEXLANDING POS*\n`;
    message += `--------------------------------\n`;
    message += `No. Antrian: *${order.queueNumber}*\n`;
    message += `Meja: ${order.tableNumber}\n`;
    message += `Pelanggan: ${order.customerName || 'Guest'}\n`;
    message += `--------------------------------\n`;

    items.forEach((item) => {
      message += `${item.quantity}x ${item.name}\n`;
      message += `@ ${formatRupiah(item.price)}\n`;
    });

    message += `--------------------------------\n`;
    message += `*TOTAL: ${formatRupiah(order.totalAmount)}*\n`;
    message += `--------------------------------\n`;
    message += `Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);

    // Logic Redirect WA
    let phoneUrl = `https://wa.me/?text=${encodedMessage}`; // Default (pilih kontak sendiri)

    if (order.customerPhone) {
      let phone = order.customerPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.substring(1);
      phoneUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    }

    window.open(phoneUrl, '_blank');
  };

  if (!isInitialized) {
    return (
      <div className="flex h-full items-center justify-center text-[#dfff4f]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row h-full gap-6 relative"
    >
      {/* ========================================================= */}
      {/* STRUK THERMAL (HIDDEN ON SCREEN, VISIBLE ON PRINT)       */}
      {/* ========================================================= */}
      {successData && (
        <div className="hidden print:block print:w-[58mm] print:text-black print:bg-white print:absolute print:top-0 print:left-0 print:z-[9999]">
          <div className="p-2 text-xs font-mono">
            <div className="text-center mb-2">
              <h1 className="text-lg font-bold">NEXLANDING</h1>
              <p>Smart POS System</p>
            </div>

            <div className="border-b border-black border-dashed my-2"></div>

            <div className="flex justify-between">
              <span>Date:</span>
              {/* Menggunakan createdAt dari DB yang berupa Date object */}
              <span>
                {successData.order.createdAt
                  ? new Date(successData.order.createdAt).toLocaleDateString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Order ID:</span>
              <span>#{successData.order.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span>{successData.order.tableNumber}</span>
            </div>

            <div className="text-center my-4 border-2 border-black py-2 rounded">
              <span className="block text-sm">Nomor Antrian</span>
              <span className="text-3xl font-bold">
                {successData.order.queueNumber}
              </span>
            </div>

            <div className="border-b border-black border-dashed my-2"></div>

            {successData.items.map((item, idx) => (
              <div key={idx} className="mb-1">
                <div>{item.name}</div>
                <div className="flex justify-between">
                  <span>
                    {item.quantity} x {item.price.toLocaleString()}
                  </span>
                  <span>{(item.quantity * item.price).toLocaleString()}</span>
                </div>
              </div>
            ))}

            <div className="border-b border-black border-dashed my-2"></div>

            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>{formatRupiah(successData.order.totalAmount)}</span>
            </div>

            <div className="text-center mt-4 mb-8">
              <p>Terima Kasih</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL SUCCESS (GLASSMORPHISM)                             */}
      {/* ========================================================= */}
      {successData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 print:hidden">
          <div className="bg-[#1e1f24] border border-[#dfff4f]/20 w-full max-w-sm rounded-3xl shadow-[0_0_50px_rgba(223,255,79,0.1)] p-8 text-center relative overflow-hidden">
            {/* Decoration BG */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#dfff4f]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#dfff4f]/10 rounded-full blur-3xl"></div>

            <div className="w-20 h-20 bg-[#dfff4f] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#dfff4f]/20">
              <CheckCircle2 size={40} className="text-black" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              Transaksi Berhasil!
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Order #{successData.order.id} telah masuk antrian.
            </p>

            {/* Queue Number Display */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6">
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">
                Nomor Antrian
              </p>
              <p className="text-5xl font-bold text-[#dfff4f] tracking-tighter">
                {successData.order.queueNumber}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <Printer size={18} />
                Cetak Struk
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
              >
                <Send size={18} />
                Kirim WhatsApp
              </button>

              <button
                onClick={() => setSuccessData(null)}
                className="w-full text-gray-400 py-3 rounded-xl flex items-center justify-center gap-2 hover:text-white transition-colors mt-2"
              >
                Transaksi Baru <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CHECKOUT FORM (NO-DEPENDENCY VERSION)               */}
      {/* ========================================================= */}
      {isCheckoutOpen && !successData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 rounded-3xl animate-in fade-in duration-200 print:hidden">
          <div className="bg-[#1e1f24] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Info Pesanan</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* --- 1. TIPE PESANAN (Custom Radio Manual) --- */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block ml-1">
                  Tipe Pesanan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Tombol Dine In */}
                  <div
                    onClick={() => handleValueChange('orderType', 'dine_in')}
                    className={cn(
                      'flex flex-col items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all',
                      customerForm.orderType === 'dine_in'
                        ? 'border-[#dfff4f] text-[#dfff4f] bg-white/5' // Active State
                        : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white' // Inactive State
                    )}
                  >
                    <Utensils className="mb-2 h-6 w-6" />
                    <span className="font-bold">Dine In</span>
                  </div>

                  {/* Tombol Take Away */}
                  <div
                    onClick={() => handleValueChange('orderType', 'take_away')}
                    className={cn(
                      'flex flex-col items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all',
                      customerForm.orderType === 'take_away'
                        ? 'border-[#dfff4f] text-[#dfff4f] bg-white/5'
                        : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <ShoppingBag className="mb-2 h-6 w-6" />
                    <span className="font-bold">Take Away</span>
                  </div>
                </div>
              </div>

              {/* --- 2. FORM INPUTS --- */}
              <div className="space-y-4">
                {/* Conditional Rendering: Nomor Meja hanya muncul jika Dine In */}
                {customerForm.orderType === 'dine_in' && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-300">
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
                        value={customerForm.tableNumber}
                        onChange={handleFormChange}
                        placeholder="Contoh: 12 atau VIP A"
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-[#dfff4f] focus:outline-none placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                )}

                {/* Nama Pemesan */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                    Nama Pemesan
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
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-[#dfff4f] focus:outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* WhatsApp (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                    WhatsApp (Opsional)
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      name="customerPhone"
                      value={customerForm.customerPhone}
                      onChange={handleFormChange}
                      placeholder="08xxxxxxxx"
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-[#dfff4f] focus:outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* --- 3. METODE PEMBAYARAN (Custom Radio Manual) --- */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block ml-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Cash */}
                  <div
                    onClick={() => handleValueChange('paymentMethod', 'cash')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer transition-all',
                      customerForm.paymentMethod === 'cash'
                        ? 'bg-[#dfff4f] text-black border-[#dfff4f] font-bold' // Active (Tombol Solid)
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' // Inactive
                    )}
                  >
                    <Banknote size={18} />
                    <span>Cash</span>
                  </div>

                  {/* Transfer */}
                  <div
                    onClick={() =>
                      handleValueChange('paymentMethod', 'transfer')
                    }
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer transition-all',
                      customerForm.paymentMethod === 'transfer'
                        ? 'bg-[#dfff4f] text-black border-[#dfff4f] font-bold'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    )}
                  >
                    <CreditCard size={18} />
                    <span>Transfer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal: Total & Tombol Aksi */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400">Total Pembayaran</span>
                <span className="text-xl font-bold text-[#dfff4f]">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              <button
                onClick={handleFinalPayment}
                disabled={isPending}
                className="w-full bg-[#dfff4f] hover:bg-[#ccee3d] text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(223,255,79,0.2)]"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-wide">
                      Konfirmasi & Bayar
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BAGIAN KIRI: DAFTAR PRODUK (SAMA, TAMBAH CLASS print:hidden) --- */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden print:hidden">
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
                  <div className="h-24 w-full bg-white/5 rounded-xl mb-4 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <span className="text-2xl font-bold text-white/20 group-hover:text-[#dfff4f]/50 transition-colors">
                      {product.name.charAt(0)}
                    </span>
                  </div>
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

      {/* --- BAGIAN KANAN: KERANJANG (SAMA, TAMBAH CLASS print:hidden) --- */}
      <div className="w-full lg:w-[400px] flex flex-col h-[calc(100vh-140px)] sticky top-4 print:hidden">
        <div className="bg-[#18191e] border border-white/5 rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-[#18191e] flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-[#dfff4f]" size={20} />
              <h2 className="font-bold text-white">Current Order</h2>
            </div>
            <span className="bg-white/10 text-xs px-2 py-1 rounded-md text-gray-300">
              {cart.length} Items
            </span>
          </div>

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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#dfff4f] font-mono mt-1">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
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
                onClick={() => setIsCheckoutOpen(true)}
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
