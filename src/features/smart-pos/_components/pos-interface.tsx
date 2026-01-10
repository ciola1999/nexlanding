'use client';

import * as React from 'react';
import { useMemo, useTransition, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// --- ICONS ---
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
  CheckCircle2,
  Send,
  ArrowRight,
  Utensils,
  ShoppingBag,
  Banknote,
  CreditCard,
  Printer,
  Menu,
} from 'lucide-react';

// --- UTILS & ACTIONS ---
import { formatRupiah, cn } from '@/lib/utils';
import { processCheckout } from '@/features/smart-pos/_actions/transaction';
import type { Product, CartItem } from '@/types';
import type { Order } from '@/features/smart-pos/db/schema';

// --- SHADCN COMPONENTS (Pastikan sudah diinstall) ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- TYPES ---
interface POSInterfaceProps {
  initialProducts: Product[];
}

interface CustomerFormState {
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dine_in' | 'take_away';
  paymentMethod: 'cash' | 'transfer';
}

interface SuccessData {
  order: Order;
  items: CartItem[];
}

export default function POSInterface({ initialProducts }: POSInterfaceProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState(''); // Balik ke useState biasa dulu biar simple
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // UI States
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = React.useState(false); // State untuk Mobile Drawer

  // Form State
  const [customerForm, setCustomerForm] = React.useState<CustomerFormState>({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    orderType: 'dine_in',
    paymentMethod: 'cash',
  });

  // Result State
  const [successData, setSuccessData] = React.useState<SuccessData | null>(
    null
  );

  // --- INIT & LOCAL STORAGE ---
  useEffect(() => {
    const savedCart = localStorage.getItem('nexpos-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem('nexpos-cart');
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('nexpos-cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // --- AUTO REFRESH & VALIDATION ---
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 30000); // 30 Detik
    return () => clearInterval(interval);
  }, [router]);

  // Validasi Cart (Fix Infinite Loop)
  useEffect(() => {
    if (!isInitialized || cart.length === 0) return;

    let hasChanges = false;
    const itemsRemoved: string[] = [];

    const validatedCart = cart
      .map((item) => {
        const serverProduct = initialProducts.find((p) => p.id === item.id);

        if (!serverProduct || !serverProduct.isActive) {
          itemsRemoved.push(item.name);
          hasChanges = true;
          return null;
        }

        if (serverProduct.stock < item.quantity) {
          hasChanges = true;
          return {
            ...item,
            quantity: serverProduct.stock,
            stock: serverProduct.stock,
          };
        }

        if (item.stock !== serverProduct.stock) {
          return { ...item, stock: serverProduct.stock };
        }

        return item;
      })
      .filter(Boolean) as CartItem[];

    if (hasChanges || itemsRemoved.length > 0) {
      // Gunakan requestAnimationFrame atau timeout untuk menghindari update state saat render
      setTimeout(() => {
        setCart(validatedCart);
        if (itemsRemoved.length > 0) {
          toast.error('Stok Berubah', {
            description: `${itemsRemoved.join(', ')} tidak tersedia.`,
          });
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProducts, isInitialized]);
  // Dependency 'cart' dihapus sengaja agar tidak loop, validasi hanya jalan saat 'initialProducts' berubah (dari server)

  // --- FILTERING ---
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return initialProducts.filter((p) => {
      if (!p.isActive) return false;
      return (
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      );
    });
  }, [initialProducts, searchQuery]);

  // --- ANIMATION ---
  useGSAP(
    () => {
      if (filteredProducts.length > 0) {
        gsap.fromTo(
          '.product-card',
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.out',
            clearProps: 'all',
          }
        );
      }
    },
    {
      dependencies: [searchQuery, filteredProducts.length],
      scope: containerRef,
    }
  );

  // --- CART ACTIONS ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          toast.error('Stok Habis');
          return prev;
        }
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

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              toast.error('Maksimal Stok');
              return item;
            }
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  // --- CHECKOUT ---
  const handleCheckout = async () => {
    if (
      customerForm.orderType === 'dine_in' &&
      !customerForm.tableNumber.trim()
    ) {
      toast.error('Nomor Meja Wajib Diisi!');
      return;
    }

    startTransition(async () => {
      const res = await processCheckout(
        cart.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        customerForm
      );

      if (res.success && res.data) {
        setSuccessData({ order: res.data, items: [...cart] });
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartSheetOpen(false);
        setCustomerForm({
          tableNumber: '',
          customerName: '',
          customerPhone: '',
          orderType: 'dine_in',
          paymentMethod: 'cash',
        });
        toast.success('Transaksi Berhasil!');
      } else {
        toast.error(res.message || 'Gagal');
      }
    });
  };

  // --- SUB-COMPONENTS (RENDER HELPERS) ---
  const CartList = () => (
    <div className="flex flex-col gap-3">
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-4 opacity-50">
          <ShoppingBag size={48} strokeWidth={1} />
          <p>Keranjang Kosong</p>
        </div>
      ) : (
        cart.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 bg-muted/30 p-3 rounded-xl border border-border items-center"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-xs text-primary font-bold">
                {formatRupiah(item.price)}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1 border border-border">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => updateQuantity(item.id, -1)}
              >
                <Minus size={12} />
              </Button>
              <span className="w-6 text-center text-sm font-bold">
                {item.quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => updateQuantity(item.id, 1)}
              >
                <Plus size={12} />
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => updateQuantity(item.id, -item.quantity)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))
      )}
    </div>
  );

  const CheckoutSummary = () => (
    <div className="space-y-4">
      <div className="space-y-1 pt-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatRupiah(subtotal)}</span>
        </div>
      </div>
      <Button
        className="w-full font-bold h-12 text-base shadow-[0_0_15px_rgba(223,255,79,0.3)]"
        disabled={cart.length === 0}
        onClick={() => setIsCheckoutOpen(true)}
      >
        Bayar Sekarang (F9) <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  if (!isInitialized)
    return (
      <div className="h-dvh flex items-center justify-center text-primary">
        <Loader2 className="animate-spin" />
      </div>
    );

  // ... (Kode logic di atas biarkan sama) ...

  return (
    // FIX 1: Tambahkan 'overflow-x-hidden' agar tidak ada scroll ke samping
    <div
      ref={containerRef}
      className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden overflow-x-hidden relative"
    >
      {/* HEADER: Lebih Slim di Mobile */}
      {/* FIX 2: Ubah py-3 jadi py-2, dan px-4 jadi px-3 untuk mobile */}
      <header className="px-3 py-2 lg:px-4 lg:py-3 border-b border-border flex items-center gap-3 shrink-0 bg-background/50 backdrop-blur-sm z-20">
        <div className="relative flex-1 lg:max-w-md">
          {/* Icon Search lebih kecil dikit di mobile */}
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />

          {/* Input lebih pendek (h-9) dan text lebih kecil (text-sm) */}
          <Input
            className="pl-9 h-9 text-sm bg-muted/50 border-transparent focus:border-primary focus:bg-background rounded-full lg:rounded-md transition-all"
            placeholder="Cari Produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Bar (Desktop Only) */}
        <div className="hidden lg:flex items-center gap-4 ml-auto">
          <Badge variant="outline" className="border-primary text-primary">
            System Online
          </Badge>
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <User size={18} />
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: PRODUCT GRID */}
        {/* FIX 3: Padding mobile jadi p-2, Desktop p-4. Padding bawah ditambah biar gak ketutup floating bar */}
        <div className="flex-1 overflow-y-auto p-2 pb-24 lg:p-4 lg:pb-4 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-3">
              <PackageOpen size={48} strokeWidth={1} />
              <p className="text-sm">Produk tidak ditemukan</p>
            </div>
          ) : (
            // FIX 4: Grid gap diperkecil (gap-2) untuk mobile
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  disabled={product.stock === 0}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'product-card group relative flex flex-col bg-card rounded-lg lg:rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-md h-full active:scale-95', // active:scale-95 bikin efek klik di HP enak
                    product.stock === 0 &&
                      'opacity-50 grayscale cursor-not-allowed'
                  )}
                >
                  {/* Aspek Rasio Gambar */}
                  <div className="aspect-[4/3] relative bg-muted w-full">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <PackageOpen size={20} />
                      </div>
                    )}

                    {/* Label Stok Sisa */}
                    {product.stock > 0 && product.stock < 10 && (
                      <span className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-destructive text-destructive-foreground text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Sisa {product.stock}
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-bold text-white text-xs tracking-widest">
                        HABIS
                      </div>
                    )}
                  </div>

                  {/* Info Produk */}
                  <div className="p-2 lg:p-3 flex flex-col flex-1 gap-1 lg:gap-2">
                    {/* Nama Produk: Text lebih kecil di mobile (text-xs) */}
                    <h3 className="font-medium text-xs lg:text-sm line-clamp-2 leading-tight min-h-[2.5em]">
                      {product.name}
                    </h3>

                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="text-primary font-bold text-xs lg:text-sm">
                        {formatRupiah(product.price)}
                      </span>
                      {/* Tombol Plus Kecil */}
                      {product.stock > 0 && (
                        <div className="h-5 w-5 lg:h-6 lg:w-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Plus size={12} className="lg:w-[14px] lg:h-[14px]" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: CART SIDEBAR (DESKTOP ONLY) */}
        <div className="hidden lg:flex w-[380px] border-l border-border bg-card flex-col shrink-0 h-full z-10">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2 font-bold">
              <ShoppingCart size={18} className="text-primary" /> Current Order
            </div>
            <Badge variant="secondary">{cart.length} Items</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            <CartList />
          </ScrollArea>
          <div className="p-4 border-t border-border bg-muted/20">
            <CheckoutSummary />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM FLOATING BAR */}
      {/* FIX 5: Padding bottom aman, width calc biar gak nabrak pinggir */}
      <div className="lg:hidden fixed bottom-4 left-3 right-3 bg-card/90 backdrop-blur-md border border-primary/20 rounded-xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-40 flex items-center justify-between animate-in slide-in-from-bottom-4">
        <div className="flex flex-col pl-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            {cart.length} Item
          </span>
          <span className="text-lg font-bold text-primary leading-none">
            {formatRupiah(subtotal)}
          </span>
        </div>
        <Button
          onClick={() => setIsCartSheetOpen(true)}
          size="sm"
          className="font-bold h-9 px-4 shadow-[0_0_10px_rgba(223,255,79,0.2)]"
        >
          Lihat <ShoppingCart className="ml-2 h-3 w-3" />
        </Button>
      </div>

      {/* --- MODAL & DRAWERS (Sama seperti sebelumnya) --- */}
      <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] flex flex-col p-0 rounded-t-2xl border-t border-primary/20"
        >
          <SheetHeader className="p-4 border-b border-border text-left bg-muted/10">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="text-primary" size={18} /> Rincian
              Pesanan
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            <CartList />
          </ScrollArea>
          <div className="p-4 border-t border-border bg-background pb-8">
            {/* pb-8 untuk safe area iPhone */}
            <CheckoutSummary />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="w-[90%] rounded-xl sm:max-w-md bg-card border-border">
          {/* w-[90%] rounded-xl agar di HP modalnya tidak nempel pinggir */}
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Lengkapi detail pesanan.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() =>
                  setCustomerForm((p) => ({ ...p, orderType: 'dine_in' }))
                }
                className={cn(
                  'border rounded-lg p-2.5 flex flex-col items-center cursor-pointer transition-all',
                  customerForm.orderType === 'dine_in'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                )}
              >
                <Utensils className="mb-1 h-4 w-4" />{' '}
                <span className="font-bold text-[10px] uppercase">Dine In</span>
              </div>
              <div
                onClick={() =>
                  setCustomerForm((p) => ({ ...p, orderType: 'take_away' }))
                }
                className={cn(
                  'border rounded-lg p-2.5 flex flex-col items-center cursor-pointer transition-all',
                  customerForm.orderType === 'take_away'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                )}
              >
                <ShoppingBag className="mb-1 h-4 w-4" />{' '}
                <span className="font-bold text-[10px] uppercase">
                  Take Away
                </span>
              </div>
            </div>

            {customerForm.orderType === 'dine_in' && (
              <div className="relative">
                <Armchair
                  className="absolute left-3 top-2.5 text-muted-foreground"
                  size={14}
                />
                <Input
                  placeholder="Nomor Meja"
                  className="pl-9 h-10 text-sm"
                  value={customerForm.tableNumber}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      tableNumber: e.target.value,
                    })
                  }
                />
              </div>
            )}
            <div className="relative">
              <User
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={14}
              />
              <Input
                placeholder="Nama Pelanggan"
                className="pl-9 h-10 text-sm"
                value={customerForm.customerName}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    customerName: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-3 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total Bayar</span>
              <span className="text-lg font-bold text-primary leading-none">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={isPending}
              className="px-6 font-bold h-10"
            >
              {isPending ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                'Bayar Sekarang'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!successData}
        onOpenChange={(open) => !open && setSuccessData(null)}
      >
        <DialogContent className="w-[85%] rounded-2xl sm:max-w-sm text-center bg-card border-primary/30">
          <div className="mx-auto h-14 w-14 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(223,255,79,0.4)] mb-3">
            <CheckCircle2 size={28} className="text-primary-foreground" />
          </div>
          <DialogTitle className="text-lg font-bold">
            Pembayaran Sukses
          </DialogTitle>
          <DialogDescription className="text-xs mb-4">
            Order ID #{successData?.order.id}
          </DialogDescription>

          <div className="bg-muted/50 p-3 rounded-xl mb-4 border border-border dashed">
            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
              Nomor Antrian
            </p>
            <p className="text-4xl font-bold text-primary tracking-tighter my-1">
              {successData?.order.queueNumber}
            </p>
          </div>

          <div className="grid gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-3 w-3" /> Cetak Struk
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground h-8"
              onClick={() => setSuccessData(null)}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
