'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { Product, CartItem } from '@/types';
import { Order } from '@/features/smart-pos/db/schema';
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
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// --- TYPE DEFINITIONS UTAMA ---
interface SuccessData {
  order: Order;
  items: CartItem[];
}

interface POSInterfaceProps {
  initialProducts: Product[];
}

export default function POSInterface({ initialProducts }: POSInterfaceProps) {
  const router = useRouter(); // <--- Inisialisasi Router
  // --- STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // Modal Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    orderType: 'dine_in' as 'dine_in' | 'take_away',
    paymentMethod: 'cash' as 'cash' | 'transfer',
  });

  // Data Sukses
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // --- SHORTCUTS KEYBOARD ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[name="searchProduct"]'
        ) as HTMLInputElement;
        searchInput?.focus();
      }

      if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault();
        setIsCheckoutOpen(true);
      }

      if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setSuccessData(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  // --- DEBOUNCE SEARCH ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ------------------------------------------------------------------
  // FITUR 1: AUTO REFRESH DATA (Setiap 10 Detik)
  // ------------------------------------------------------------------
  // Tujuannya: Mengambil data terbaru (Active/Inactive/Stok) dari server
  // tanpa mengganggu kasir yang sedang input.
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 10000); // 10000 ms = 10 detik

    return () => clearInterval(interval);
  }, [router]);

  // ------------------------------------------------------------------
  // FITUR 2: CART VALIDATOR (Polisi Keranjang)
  // ------------------------------------------------------------------
  // Setiap kali data 'initialProducts' berubah (karena auto refresh di atas),
  // kita cek apakah barang di keranjang masih valid (Active).
  // ------------------------------------------------------------------
  // FITUR 2: CART VALIDATOR (Polisi Keranjang - FIXED)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (cart.length === 0) return;

    // FIX 1: Gunakan 'const' untuk array, karena kita hanya push isinya, bukan ganti variabelnya
    const itemsRemoved: string[] = [];

    const validCart = cart.filter((cartItem) => {
      const freshProductData = initialProducts.find(
        (p) => p.id === cartItem.id
      );

      if (!freshProductData || !freshProductData.isActive) {
        itemsRemoved.push(cartItem.name);
        return false;
      }
      return true;
    });

    // Jika ada perubahan (ada item yang harus dibuang)
    if (validCart.length !== cart.length) {
      // FIX 2: Bungkus dengan setTimeout(...)
      // Ini membuat update state menjadi 'Asynchronous' dan menghilangkan error 'Cascading Renders'
      setTimeout(() => {
        setCart(validCart);

        toast.error('Produk Tidak Tersedia!', {
          description: `${itemsRemoved.join(
            ', '
          )} telah dinonaktifkan admin dan dihapus dari keranjang.`,
          duration: 5000,
          icon: <X className="text-red-500" />,
        });
      }, 0);
    }
  }, [initialProducts, cart]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      // ----------------------------------------------------
      // LANGKAH 1: FILTER STATUS ("SATPAM")
      // ----------------------------------------------------
      // Jika statusnya false (mati) atau null, langsung tolak!
      // Produk ini tidak akan diperiksa nama/sku-nya lagi.
      if (!p.isActive) return false;

      // ----------------------------------------------------
      // LANGKAH 2: FILTER PENCARIAN (NAMA / SKU)
      // ----------------------------------------------------
      // Jika lolos langkah 1 (status aktif), baru kita cek pencarian.
      // Kita gunakan 'debouncedSearch' sesuai kodingan kamu.
      const query = debouncedSearch.toLowerCase();

      return (
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      );
    });
  }, [initialProducts, debouncedSearch]);

  // --- GSAP ANIMATION ---
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

  // --- LOCAL STORAGE INIT ---
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
      const currentQty = existing ? existing.quantity : 0;

      if (currentQty + 1 > product.stock) {
        toast.error(`Stok tidak cukup! Sisa hanya ${product.stock}`);
        return prev;
      }

      if (existing) {
        toast.info(`+1 ${product.name}`);
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Animasi feedback visual sederhana bisa ditambahkan disini
      toast.success(`${product.name} ditambahkan`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            const productInfo = initialProducts.find((p) => p.id === productId);

            if (delta > 0 && productInfo && newQty > productInfo.stock) {
              toast.error(`Maksimal stok: ${productInfo.stock}`);
              return item;
            }

            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleManualQuantity = (itemId: number, valueStr: string) => {
    if (valueStr === '') return;
    const newValue = parseInt(valueStr);
    if (isNaN(newValue) || newValue < 1) return;

    const itemInCart = cart.find((item) => item.id === itemId);
    if (itemInCart && newValue > itemInCart.stock) {
      toast.error(`Stok tidak cukup! Sisa stok: ${itemInCart.stock}`);
      setCart((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: itemInCart.stock } : item
        )
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newValue } : item
      )
    );
  };

  const removeFromCart = (productId: number) =>
    setCart((prev) => prev.filter((item) => item.id !== productId));

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  // --- CHECKOUT LOGIC ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  };

  const handleValueChange = (field: string, value: string) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFinalPayment = () => {
    if (
      customerForm.orderType === 'dine_in' &&
      !customerForm.tableNumber.trim()
    ) {
      toast.error('Mohon isi Nomor Meja untuk Dine In');
      return;
    }

    const currentCartSnapshot = [...cart];

    startTransition(async () => {
      const checkoutItems = currentCartSnapshot.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const result = await processCheckout(checkoutItems, customerForm);

      if (result.success && result.data) {
        setSuccessData({
          order: result.data,
          items: currentCartSnapshot,
        });
        setCart([]);
        setIsCheckoutOpen(false);
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

  // --- PRINT & WA ---
  const handlePrint = () => window.print();

  const handleSendWhatsApp = () => {
    if (!successData) return;
    const { order, items } = successData;

    let message = `*NEXLANDING POS*\n--------------------------------\n`;
    message += `No. Antrian: *${order.queueNumber}*\n`;
    message += `Meja: ${order.tableNumber}\nPelanggan: ${
      order.customerName || 'Guest'
    }\n`;
    message += `--------------------------------\n`;

    items.forEach((item) => {
      message += `${item.quantity}x ${item.name}\n@ ${formatRupiah(
        item.price
      )}\n`;
    });

    message += `--------------------------------\n*TOTAL: ${formatRupiah(
      order.totalAmount
    )}*\n--------------------------------\nTerima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    let phoneUrl = `https://wa.me/?text=${encodedMessage}`;

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
    // ✨ LAYOUT FIX 1: Menggunakan h-[calc(100vh-theme(spacing.8))] untuk memastikan
    // kontainer pas di layar (asumsi ada padding 4/1rem di parent page)
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-4 relative overflow-hidden"
    >
      {/* ======================= STRUK THERMAL (Hidden) ======================= */}
      {successData && (
        <div className="hidden print:block print:w-[58mm] print:text-black print:bg-white print:absolute print:top-0 print:left-0 print:z-[9999]">
          <div className="p-2 text-xs font-mono">
            <div className="text-center mb-2">
              <h1 className="text-lg font-bold">NEXLANDING</h1>
              <p>Smart POS System</p>
            </div>
            <div className="border-b border-black border-dashed my-2"></div>
            {/* ... Content Struk Sama ... */}
            <div className="flex justify-between">
              <span>Date:</span>
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

      {/* ======================= MODAL SUCCESS ======================= */}
      {successData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 print:hidden">
          {/* ... Modal Content Sama ... */}
          <div className="bg-[#1e1f24] border border-[#dfff4f]/20 w-full max-w-sm rounded-3xl shadow-[0_0_50px_rgba(223,255,79,0.1)] p-8 text-center relative overflow-hidden">
            {/* Background Effects */}
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

            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6">
              <p className="text-xs uppercase text-gray-500 font-bold mb-1">
                Nomor Antrian
              </p>
              <p className="text-5xl font-bold text-[#dfff4f] tracking-tighter">
                {successData.order.queueNumber}
              </p>
            </div>

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

      {/* ======================= MODAL CHECKOUT ======================= */}
      {isCheckoutOpen && !successData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 rounded-3xl animate-in fade-in duration-200 print:hidden">
          {/* ... Modal Checkout Content Sama ... */}
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
              {/* TIPE PESANAN */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block ml-1">
                  Tipe Pesanan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => handleValueChange('orderType', 'dine_in')}
                    className={cn(
                      'flex flex-col items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all',
                      customerForm.orderType === 'dine_in'
                        ? 'border-[#dfff4f] text-[#dfff4f] bg-white/5'
                        : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Utensils className="mb-2 h-6 w-6" />
                    <span className="font-bold">Dine In</span>
                  </div>
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

              {/* FORM INPUTS */}
              <div className="space-y-4">
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

              {/* METODE PEMBAYARAN */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block ml-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => handleValueChange('paymentMethod', 'cash')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer transition-all',
                      customerForm.paymentMethod === 'cash'
                        ? 'bg-[#dfff4f] text-black border-[#dfff4f] font-bold'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    )}
                  >
                    <Banknote size={18} />
                    <span>Cash</span>
                  </div>
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

      {/* --- BAGIAN KIRI: DAFTAR PRODUK (GRID FIX) --- */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden print:hidden">
        {/* Search Bar */}
        <div className="relative group shrink-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className="text-gray-500 group-focus-within:text-[#dfff4f] transition-colors"
              size={20}
            />
          </div>
          <input
            name="searchProduct"
            type="text"
            placeholder="Cari nama produk atau scan SKU... (F2)"
            className="w-full pl-12 pr-4 py-4 bg-[#18191e] border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-[#dfff4f]/50 focus:ring-1 focus:ring-[#dfff4f]/50 transition-all shadow-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-600 gap-4">
              <PackageOpen size={64} strokeWidth={1} />
              <p>Produk tidak ditemukan</p>
            </div>
          ) : (
            // ✨ LAYOUT FIX 2: Responsive Grid yang lebih presisi
            // grid-cols-2 (Mobile)
            // sm:grid-cols-3 (Tablet Kecil)
            // lg:grid-cols-3 (Desktop dgn Sidebar - space berkurang jadi kolom diturunkan)
            // xl:grid-cols-4 (Desktop Besar)
            // 2xl:grid-cols-5 (Monitor Ultra Wide)
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={(e) => {
                    if (product.stock > 0) {
                      e.stopPropagation();
                      addToCart(product);
                    }
                  }}
                  className={cn(
                    // ✨ LAYOUT FIX 3: Flex-col & h-full agar semua kartu tingginya sama
                    'product-card group relative flex flex-col gap-3 bg-[#18191e] p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-white/10 text-left h-full',
                    product.stock === 0 &&
                      'opacity-50 grayscale cursor-not-allowed'
                  )}
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/5 shrink-0">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <PackageOpen size={32} />
                      </div>
                    )}

                    {product.stock > 0 && product.stock < 10 && (
                      <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">
                        Sisa {product.stock}
                      </div>
                    )}

                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-red-600 px-3 py-1 rounded-full">
                          HABIS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Wrapper Content: Flex-1 push footer to bottom */}
                  <div className="flex flex-col justify-between flex-1 w-full">
                    <div>
                      <h3 className="text-gray-200 font-medium text-sm leading-snug line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatRupiah(Number(product.costPrice))}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <span className="text-[#dfff4f] font-bold font-mono text-sm">
                        {formatRupiah(product.price)}
                      </span>

                      {product.stock > 0 && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-[#dfff4f] group-hover:text-black transition-all shadow-lg">
                          <Plus size={16} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- BAGIAN KANAN: KERANJANG (SIDEBAR FIX) --- */}
      {/* ✨ LAYOUT FIX 4: Gunakan h-full pada flex container, bukan h-calc manual */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col h-full print:hidden">
        <div className="bg-[#18191e] border border-white/5 rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden">
          {/* Header Cart */}
          <div className="p-5 border-b border-white/5 bg-[#18191e] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-[#dfff4f]" size={20} />
              <h2 className="font-bold text-white">Current Order</h2>
            </div>
            <span className="bg-white/10 text-xs px-2 py-1 rounded-md text-gray-300">
              {cart.length} Items
            </span>
          </div>

          {/* List Item Cart (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 opacity-50">
                <ShoppingCart size={48} strokeWidth={1} />
                <p className="text-sm">Keranjang kosong (F2 untuk cari)</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="group flex gap-3 bg-white/5 hover:bg-white/[0.07] p-3 rounded-2xl transition-all border border-transparent hover:border-white/10 shrink-0"
                >
                  <div className="flex-1 min-w-0">
                    {' '}
                    {/* min-w-0 penting untuk truncate text di flex child */}
                    <p className="text-sm font-medium text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#dfff4f] font-mono mt-1">
                      {formatRupiah(item.price)}
                    </p>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center gap-2 bg-black/20 rounded-xl px-2 py-1 h-9 self-center">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="text" // Ubah ke text agar tidak ada panah spinner default
                      value={item.quantity}
                      onChange={(e) =>
                        handleManualQuantity(item.id, e.target.value)
                      }
                      className="w-8 text-center bg-transparent text-white font-mono font-bold text-sm focus:outline-none focus:bg-white/10 rounded"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Cart (Sticky Bottom di dalam Container) */}
          <div className="p-5 bg-[#121317] border-t border-white/5 space-y-4 shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span className="text-[#dfff4f]">{formatRupiah(subtotal)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="w-full bg-[#dfff4f] hover:bg-[#ccee3d] disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(223,255,79,0.2)] flex items-center justify-center gap-2 group"
            >
              <span>Bayar (F9)</span>
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
