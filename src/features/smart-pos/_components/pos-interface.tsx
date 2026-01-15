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
  User,
  Phone, // Pastikan icon ini ada
  Armchair,
  CheckCircle2,
  ArrowRight,
  Utensils,
  ShoppingBag,
  Banknote,
  CreditCard,
  Printer,
  MessageCircle, // <--- TAMBAHAN: Icon untuk WA
} from 'lucide-react';

// --- UTILS & ACTIONS ---
import { formatRupiah, cn } from '@/lib/utils';
import { processCheckout } from '@/features/smart-pos/_actions/transaction';
import type { Product, CartItem } from '@/types';
import type { Order } from '@/features/smart-pos/db/schema';

// --- SHADCN COMPONENTS ---
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

import { ReceiptTemplate } from './ReceiptTemplate';

// --- TYPES ---
interface POSInterfaceProps {
  initialProducts: Product[];
}

interface CustomerFormState {
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dine_in' | 'take_away';
  paymentMethod: 'cash' | 'debit' | 'qris'; // Update agar sesuai db
}

export default function POSInterface({ initialProducts }: POSInterfaceProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = React.useState(false);
  // State untuk Split Bill
  const [isSplitMode, setIsSplitMode] = React.useState(false);
  const [splitPayments, setSplitPayments] = React.useState<
    { method: 'cash' | 'debit' | 'qris'; amount: number; referenceId: string }[]
  >([]);
  // 👇 TAMBAHKAN INI (Hitung Kembalian Otomatis)
  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  // Hitung sisa tagihan untuk Split Bill
  const totalPaidSplit = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingSplit = subtotal - totalPaidSplit;

  // UI States
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = React.useState(false);

  // Form State
  const [customerForm, setCustomerForm] = React.useState<CustomerFormState>({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    orderType: 'dine_in',
    paymentMethod: 'cash',
  });

  const [cashGiven, setCashGiven] = React.useState(0);

  // Result State
  const [successData, setSuccessData] = React.useState<{
    order: Order;
    items: CartItem[];
    cashReceived?: number;
    change?: number;
    payments?: { method: string; amount: number }[];
  } | null>(null);

  // --- STATE FORM DEBIT (Tambahkan ini di bawah state lainnya) ---
  const [debitForm, setDebitForm] = React.useState({
    bankName: '',
    lastFourDigits: '',
    approvalCode: '',
  });

  // Reset form saat dialog checkout ditutup
  useEffect(() => {
    if (!isCheckoutOpen) {
      setDebitForm({ bankName: '', lastFourDigits: '', approvalCode: '' });
    }
  }, [isCheckoutOpen]);

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
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

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

  // Hitung kembalian real-time
  const change = cashGiven - subtotal;

  // --- CHECKOUT ---
  // --- CHECKOUT (REVISI) ---
  // --- CHECKOUT (SUDAH DIPERBAIKI UTK SPLIT BILL) ---
  const handleCheckout = async () => {
    // 1. Validasi Meja (Dine In)
    if (
      customerForm.orderType === 'dine_in' &&
      !customerForm.tableNumber.trim()
    ) {
      toast.error('Nomor Meja Wajib Diisi!');
      return;
    }

    // 2. SIAPKAN DATA PEMBAYARAN (Final Payments)
    let finalPayments = [];

    if (isSplitMode) {
      // --- LOGIC SPLIT BILL ---
      // Cek apakah pembayaran sudah lunas?
      if (remainingSplit > 0) {
        toast.error(`Pembayaran kurang ${formatRupiah(remainingSplit)}`);
        return;
      }
      if (splitPayments.length === 0) {
        toast.error('Belum ada pembayaran yang dimasukkan');
        return;
      }
      finalPayments = splitPayments;
    } else {
      // --- LOGIC PEMBAYARAN BIASA (Single) ---
      // Validasi Uang Tunai jika Cash
      if (customerForm.paymentMethod === 'cash' && cashGiven < subtotal) {
        toast.error('Uang tunai kurang!', {
          description: `Kurang ${formatRupiah(subtotal - cashGiven)}`,
        });
        return;
      }

      const amount =
        customerForm.paymentMethod === 'cash' ? cashGiven : subtotal;

      // 🔥 TAMBAHAN BARU: Validasi Debit & Buat Reference ID
      let refId = '';
      if (customerForm.paymentMethod === 'debit') {
        if (
          !debitForm.bankName ||
          debitForm.lastFourDigits.length < 4 ||
          !debitForm.approvalCode
        ) {
          toast.error(
            'Mohon lengkapi data kartu debit (Bank, 4 Digit, Approval)'
          );
          return;
        }
        // Gabungkan data jadi string
        refId = `${debitForm.bankName.toUpperCase()}|${
          debitForm.lastFourDigits
        }|APPR:${debitForm.approvalCode.toUpperCase()}`;
      }

      finalPayments = [
        {
          method: customerForm.paymentMethod,
          amount: amount,
          referenceId: refId,
        },
      ];
    }

    // 3. PROSES KE DATABASE
    startTransition(async () => {
      const res = await processCheckout(
        cart.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        {
          // Spread data form
          orderType: customerForm.orderType,
          tableNumber: customerForm.tableNumber,
          customerName: customerForm.customerName,
          customerPhone: customerForm.customerPhone,

          // 🔥 KIRIM ARRAY PEMBAYARAN (SPLIT ATAU SINGLE)
          payments: finalPayments,
        }
      );

      if (res.success && res.data) {
        setSuccessData({
          order: res.data,
          items: [...cart],
          // 👇 TAMBAHKAN 2 BARIS INI AGAR STRUK MUNCUL ANGKA DUITNYA 👇
          cashReceived: isSplitMode ? subtotal : cashGiven,
          change: isSplitMode ? 0 : cashGiven - subtotal,
          payments: finalPayments,
        });

        // Reset State
        setCart([]);
        setCashGiven(0);
        setIsSplitMode(false); // Reset mode split
        setSplitPayments([]); // Reset array split
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

  // --- 🔥 NEW FEATURE: GENERATE WHATSAPP RECEIPT ---
  const handleSendWhatsApp = () => {
    // 1. Cek ketersediaan data sukses
    if (!successData || !successData.order) return;

    // Ambil juga 'payments' dari successData
    const { order, items, payments } = successData;

    // --- PEMBUATAN TEXT STRUK ---
    let text = `*STRUK PEMBAYARAN - NEXPOS*\n`;
    text += `--------------------------------\n`;
    text += `📅 Tgl: ${new Date().toLocaleDateString(
      'id-ID'
    )} ${new Date().toLocaleTimeString('id-ID')}\n`; // Tambah jam biar detail
    text += `🧾 No: #${order.id}\n`;
    text += `👤 Pelanggan: ${order.customerName || 'Guest'}\n`;

    if (order.tableNumber) {
      text += `🪑 Meja: ${order.tableNumber}\n`;
    }

    text += `--------------------------------\n`;

    // Detail Item
    items.forEach((item) => {
      // Format: 2x Nasi Goreng (Rp 30.000)
      text += `${item.quantity}x ${item.name}\n`;
      text += `   @ ${formatRupiah(item.price)} = ${formatRupiah(
        item.price * item.quantity
      )}\n`;
    });

    // Footer & Total
    text += `--------------------------------\n`;
    text += `*TOTAL: ${formatRupiah(order.totalAmount)}*\n`;

    // 🔥 LOGIKA PEMBAYARAN (SINKRON DENGAN STRUK FISIK)
    if (order.paymentMethod === 'split' && payments && payments.length > 0) {
      text += `💳 Metode: SPLIT PAYMENT\n`;
      text += `Rincian:\n`;
      payments.forEach((p) => {
        text += `   - ${p.method.toUpperCase()}: ${formatRupiah(p.amount)}\n`;
      });
    } else if (order.paymentMethod === 'cash') {
      text += `💳 Metode: CASH\n`;
      // Pastikan field ini ada di object order kamu (amountPaid/cashAmount)
      text += `💵 Tunai: ${formatRupiah(
        successData.cashReceived || order.amountPaid || 0
      )}\n`;
      // Tampilkan kembalian jika ada
      const kembalian = successData.change || order.change || 0;
      if (kembalian > 0) {
        text += `🔄 Kembali: ${formatRupiah(kembalian)}\n`;
      }
    } else {
      // Untuk QRIS / Transfer
      text += `💳 Metode: ${
        order.paymentMethod ? order.paymentMethod.toUpperCase() : '-'
      }\n`;
    }

    text += `--------------------------------\n`;
    text += `Terima kasih telah berbelanja! 🙏\n`;
    text += `_Simpan struk ini sebagai bukti pembayaran yang sah._`;

    // --- LOGIKA KIRIM WA ---
    const encodedText = encodeURIComponent(text);
    let waUrl = '';

    // Prioritas nomor HP:
    // 1. Dari data Order (jika tersimpan di DB)
    // 2. Dari Form input saat ini (fallback)
    const phoneTarget = order.customerPhone || customerForm.customerPhone;

    if (phoneTarget) {
      // Format 08xx -> 628xx
      let p = phoneTarget.replace(/\D/g, ''); // Hapus karakter non-angka
      if (p.startsWith('0')) {
        p = '62' + p.substring(1);
      }

      waUrl = `https://wa.me/${p}?text=${encodedText}`;
    } else {
      // Jika tidak ada nomor, buka WA picker (pilih kontak manual)
      waUrl = `https://wa.me/?text=${encodedText}`;
      toast.info('Membuka WhatsApp. Silakan pilih kontak tujuan.');
    }

    window.open(waUrl, '_blank');
  };

  // --- RENDER HELPERS ---
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

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-dvh bg-background text-foreground overflow-hidden overflow-x-hidden relative"
    >
      {/* HEADER */}
      <header className="px-3 py-2 lg:px-4 lg:py-3 border-b border-border flex items-center gap-3 shrink-0 bg-background/50 backdrop-blur-sm z-20">
        <div className="relative flex-1 lg:max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="pl-9 h-9 text-sm bg-muted/50 border-transparent focus:border-primary focus:bg-background rounded-full lg:rounded-md transition-all"
            placeholder="Cari Produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
        {/* PRODUCT GRID */}
        <div className="flex-1 overflow-y-auto p-2 pb-24 lg:p-4 lg:pb-4 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-3">
              <PackageOpen size={48} strokeWidth={1} />
              <p className="text-sm">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  disabled={product.stock === 0}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'product-card group relative flex flex-col bg-card rounded-lg lg:rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-md h-full active:scale-95',
                    product.stock === 0 &&
                      'opacity-50 grayscale cursor-not-allowed'
                  )}
                >
                  <div className="aspect-4/3 relative bg-muted w-full">
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

                  <div className="p-2 lg:p-3 flex flex-col flex-1 gap-1 lg:gap-2">
                    <h3 className="font-medium text-xs lg:text-sm line-clamp-2 leading-tight min-h-[2.5em]">
                      {product.name}
                    </h3>

                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="text-primary font-bold text-xs lg:text-sm">
                        {formatRupiah(product.price)}
                      </span>
                      {product.stock > 0 && (
                        <div className="h-5 w-5 lg:h-6 lg:w-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Plus size={12} className="lg:w-3.5 lg:h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CART SIDEBAR (DESKTOP) */}
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

      {/* MOBILE FLOATING BAR */}
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

      {/* MODAL & DRAWERS */}
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
            <CheckoutSummary />
          </div>
        </SheetContent>
      </Sheet>

      {/* DIALOG CHECKOUT (INPUT FORM) */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="w-[90%] rounded-xl sm:max-w-md bg-card border-border">
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
            {/* TAMBAHAN: Input Nomor HP di Modal Checkout agar lebih lengkap */}
            <div className="relative">
              <Phone
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={14}
              />
              <Input
                placeholder="Nomor HP (WhatsApp)"
                type="tel"
                className="pl-9 h-10 text-sm"
                value={customerForm.customerPhone}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    customerPhone: e.target.value,
                  })
                }
              />
            </div>
          </div>
          {/* --- UPDATE: PAYMENT METHOD SELECTOR (DENGAN SPLIT BILL) --- */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {' '}
            {/* 👈 Ubah jadi 4 kolom */}
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'debit', label: 'Debit', icon: CreditCard },
              { id: 'qris', label: 'QRIS', icon: CheckCircle2 },
            ].map((method) => (
              <div
                key={method.id}
                onClick={() => {
                  // 1. Matikan mode split jika user pilih metode biasa
                  setIsSplitMode(false);
                  // 2. Set metode pembayaran
                  setCustomerForm((p) => ({
                    ...p,
                    paymentMethod: method.id as 'cash' | 'debit' | 'qris',
                  }));
                }}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all',
                  // Cek: Jika TIDAK split mode DAN method cocok, highlight
                  !isSplitMode && customerForm.paymentMethod === method.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                )}
              >
                <method.icon size={16} className="mb-1" />
                <span className="text-[10px] font-bold uppercase">
                  {method.label}
                </span>
              </div>
            ))}
            {/* 👇 TOMBOL KHUSUS SPLIT BILL 👇 */}
            <div
              onClick={() => {
                setIsSplitMode(true);
                // Inisialisasi pembayaran pertama dengan total tagihan
                if (splitPayments.length === 0) {
                  setSplitPayments([
                    { method: 'cash', amount: subtotal, referenceId: '' },
                  ]);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all',
                // Highlight jika Mode Split AKTIF
                isSplitMode
                  ? 'border-lime-500 bg-lime-500/10 text-lime-500' // Warna beda biar mencolok
                  : 'border-border hover:bg-muted'
              )}
            >
              {/* Icon Split (Bisa pakai icon apa saja, misal Percent atau Divide) */}
              <div className="mb-1 font-bold text-lg">½</div>
              <span className="text-[10px] font-bold uppercase">Split</span>
            </div>
          </div>

          {/* 🔥 LOGIC TAMPILAN INPUT (SPLIT vs SINGLE) */}
          {isSplitMode ? (
            // === TAMPILAN MODE SPLIT BILL ===
            <div className="mt-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-white/10 pb-2">
                <span>Rincian Pembayaran</span>
                <span>
                  Sisa:{' '}
                  <span
                    className={
                      remainingSplit > 0
                        ? 'text-red-500 font-bold'
                        : 'text-green-500 font-bold'
                    }
                  >
                    {formatRupiah(remainingSplit)}
                  </span>
                </span>
              </div>

              {/* List Pembayaran Split */}
              {splitPayments.map((payment, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  {/* Select Metode */}
                  <select
                    value={payment.method}
                    onChange={(e) => {
                      const newSplits = [...splitPayments];
                      newSplits[idx].method = e.target.value as
                        | 'cash'
                        | 'debit'
                        | 'qris';
                      setSplitPayments(newSplits);
                    }}
                    className="h-9 bg-background text-xs rounded border border-input px-2 w-[80px]"
                  >
                    <option value="cash">Cash</option>
                    <option value="debit">Debit</option>
                    <option value="qris">QRIS</option>
                  </select>

                  {/* Input Nominal */}
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="number"
                      value={payment.amount || ''}
                      onChange={(e) => {
                        const newSplits = [...splitPayments];
                        newSplits[idx].amount = Number(e.target.value);
                        setSplitPayments(newSplits);
                      }}
                      className="h-9 pl-6 text-xs"
                    />
                  </div>

                  {/* Tombol Hapus */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      const newSplits = splitPayments.filter(
                        (_, i) => i !== idx
                      );
                      setSplitPayments(newSplits);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}

              {/* Tombol Tambah Pembayaran */}
              {remainingSplit > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSplitPayments([
                      ...splitPayments,
                      {
                        method: 'cash',
                        amount: remainingSplit,
                        referenceId: '',
                      },
                    ])
                  }
                  className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10 h-8 text-xs"
                >
                  <Plus size={12} className="mr-1" /> Tambah Pembayaran
                </Button>
              )}
            </div>
          ) : (
            // === TAMPILAN MODE BIASA (CASH ONLY INPUT) ===
            customerForm.paymentMethod === 'cash' && (
              <div className="mt-4 p-3 bg-muted/50 rounded-xl border border-dashed border-border animate-in fade-in zoom-in-95 duration-200">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Uang Diterima (Cash)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-9 text-lg font-bold h-11 bg-background"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    autoFocus
                  />
                </div>

                {/* Display Kembalian Real-time */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                  <span className="text-sm font-medium">Kembalian:</span>
                  <span
                    className={cn(
                      'text-xl font-bold',
                      change < 0 ? 'text-destructive' : 'text-green-600'
                    )}
                  >
                    {formatRupiah(change)}
                  </span>
                </div>
              </div>
            )
          )}
          {customerForm.paymentMethod === 'debit' && (
            <div className="mt-4 p-4 bg-indigo-950/10 rounded-xl border border-indigo-500/30 space-y-3 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Bank
                  </label>
                  <Input
                    placeholder="BCA"
                    className="h-9 text-xs"
                    value={debitForm.bankName}
                    onChange={(e) =>
                      setDebitForm((p) => ({ ...p, bankName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">
                    4 Digit Akhir
                  </label>
                  <Input
                    placeholder="8821"
                    maxLength={4}
                    className="h-9 text-xs font-mono"
                    value={debitForm.lastFourDigits}
                    onChange={(e) =>
                      setDebitForm((p) => ({
                        ...p,
                        lastFourDigits: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Approval Code (EDC)
                </label>
                <Input
                  placeholder="XX123456"
                  className="h-9 text-xs tracking-widest uppercase"
                  value={debitForm.approvalCode}
                  onChange={(e) =>
                    setDebitForm((p) => ({
                      ...p,
                      approvalCode: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
          {/* UI QRIS (Opsional) */}
          {customerForm.paymentMethod === 'qris' && (
            <div className="mt-4 p-4 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Scan QRIS di Customer Display
              </p>
            </div>
          )}

          {/* ... DialogFooter di bawah ... */}

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

      {/* --- DIALOG SUKSES (DENGAN TOMBOL WA) --- */}
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
            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mt-1">
              Metode: {successData?.order.paymentMethod.toUpperCase()}
            </p>
          </div>

          {/* GRID TOMBOL */}
          <div className="grid gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-3 w-3" /> Cetak Struk
            </Button>

            {/* 🔥 TOMBOL KIRIM WA BARU 🔥 */}
            <Button
              size="sm"
              className="bg-[#25D366] hover:bg-[#128C7E] text-white border-0 font-bold"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Kirim Struk WA
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground h-8 mt-1"
              onClick={() => setSuccessData(null)}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- INVISIBLE RECEIPT TEMPLATE (Hanya muncul saat Print) --- */}
      <div id="printable-content" className="hidden print:block">
        {successData && (
          <ReceiptTemplate
            orderId={successData.order.id}
            date={successData.order.createdAt || new Date()}
            storeName="NexLanding POS"
            storeAddress="Cabang Utama - Bekasi"
            cashierName="Kasir"
            customerName={successData.order.customerName || 'Guest'}
            items={successData.items.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }))}
            totalAmount={successData.order.totalAmount}
            paymentMethod={successData.order.paymentMethod}
            cashAmount={successData.cashReceived}
            changeAmount={successData.change}
            // 🔥 PERBAIKAN DISINI:
            // Jangan kirim array kosong [], tapi kirim data dari state
            payments={successData.payments || []}
          />
        )}
      </div>
    </div>
  );
}
