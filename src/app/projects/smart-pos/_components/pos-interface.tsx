'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { Product, CartItem } from '@/types';
import { formatRupiah, cn } from '@/lib/utils';
import { Trash2, Plus, Minus, Search, Loader2 } from 'lucide-react';
import { processCheckout } from '@/app/projects/smart-pos/_actions/transaction';
import { toast } from 'sonner';

interface POSInterfaceProps {
  initialProducts: Product[];
}

export default function POSInterface({ initialProducts }: POSInterfaceProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // --- 1. LOGIC LOAD (FIX: Pakai setTimeout untuk hindari Cascading Render Error) ---
  useEffect(() => {
    // Kita wrap dalam setTimeout agar update state terjadi di siklus render berikutnya
    // Ini menghilangkan garis merah "Calling setState synchronously..."
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('nexpos-cart');
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);
          } catch (error) {
            console.error('Gagal load cart:', error);
            localStorage.removeItem('nexpos-cart');
          }
        }
        setIsInitialized(true); // Tandai selesai loading
      }
    }, 0);

    return () => clearTimeout(timer); // Cleanup timer jika component unmount
  }, []);

  // --- 2. LOGIC SAVE ---
  useEffect(() => {
    // Hanya simpan jika sudah initialized agar tidak menimpa data dengan array kosong
    if (isInitialized) {
      localStorage.setItem('nexpos-cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // --- Logic Filter Produk ---
  const filteredProducts = initialProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Logic Cart Operation ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        toast.info(`Jumlah ${product.name} ditambah`);
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success(`${product.name} masuk keranjang`);
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
    toast.error('Item dihapus dari keranjang');
  };

  const clearCart = () => {
    setCart([]);
    toast.warning('Keranjang dikosongkan');
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  // --- FUNGSI HANDLE CHECKOUT ---
  const handleCheckout = () => {
    if (cart.length === 0) return;

    startTransition(async () => {
      const result = await processCheckout(cart);

      if (result.success) {
        toast.success('Transaksi Berhasil!', {
          description: result.message,
          duration: 4000,
        });
        setCart([]);
      } else {
        toast.error('Transaksi Gagal', {
          description: result.message,
        });
      }
    });
  };

  // UI Render (Loading State)
  if (!isInitialized) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // UI Utama
  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4 p-4 bg-gray-50">
      {/* BAGIAN KIRI: DAFTAR PRODUK */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cari produk atau SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              Produk tidak ditemukan
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all active:scale-95 flex flex-col justify-between h-full',
                    product.stock <= 0 &&
                      'opacity-50 pointer-events-none grayscale'
                  )}
                >
                  <div>
                    <h3 className="font-semibold text-gray-800 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{product.sku}</p>
                  </div>
                  <div className="mt-3 flex justify-between items-end">
                    <span className="font-bold text-blue-600">
                      {formatRupiah(product.price)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        product.stock < 10
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Stok: {product.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BAGIAN KANAN: KERANJANG */}
      <div className="w-[400px] bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden sticky top-4 h-full">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="font-bold text-lg">Keranjang Belanja</h2>
          <p className="text-sm text-gray-500">{cart.length} item dipilih</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <span className="text-4xl">🛒</span>
              <p>Keranjang kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center group"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800 line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-blue-600 text-xs font-bold">
                    {formatRupiah(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 ml-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:bg-white rounded shadow-sm text-gray-600"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:bg-white rounded shadow-sm text-gray-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="ml-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3 mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-bold text-lg">{formatRupiah(subtotal)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0 || isPending}
              className="col-span-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg py-3 font-medium text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isPending}
              className="col-span-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Memproses...
                </>
              ) : (
                'Bayar Sekarang'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
