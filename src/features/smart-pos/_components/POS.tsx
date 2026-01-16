'use client';

import * as React from 'react';
import { useMemo, useTransition, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReactToPrint } from 'react-to-print';

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
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Banknote,
  CreditCard,
  Printer,
  MessageCircle,
} from 'lucide-react';

// --- COMPONENTS & UTILS ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn, formatRupiah } from '@/lib/utils';
import { processCheckout } from '@/features/smart-pos/_actions/transaction';

// --- TYPES (Strict Type-Safety) ---
import type { Products, CartItem } from '@/types';
import type { Order, StoreSetting, Tax } from '@/features/smart-pos/db/schema';
import { ReceiptTemplate } from './ReceiptTemplate';

// Interface Props
interface POSInterfaceProps {
  initialProducts: Products[];
  storeSettings: StoreSetting | null;
  taxesData?: Tax[];
}

// State Form Customer
interface CustomerFormState {
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dine_in' | 'take_away';
  paymentMethod: 'cash' | 'debit' | 'qris';
}

// Payment Item untuk Split Bill
interface PaymentItem {
  method: 'cash' | 'debit' | 'qris';
  amount: number;
  referenceId: string;
}

export default function POSInterface({
  initialProducts,
  storeSettings,
  taxesData = [],
}: POSInterfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // --- CORE STATE ---
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // --- UI STATE ---
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = React.useState(false);
  const [isSplitMode, setIsSplitMode] = React.useState(false);

  // --- FORM STATE ---
  const [customerForm, setCustomerForm] = React.useState<CustomerFormState>({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    orderType: 'dine_in',
    paymentMethod: 'cash',
  });

  const [debitForm, setDebitForm] = React.useState({
    bankName: '',
    lastFourDigits: '',
    approvalCode: '',
  });

  // State Keuangan
  const [cashGiven, setCashGiven] = React.useState<number | ''>(''); // Allow empty string for better UX
  const [splitPayments, setSplitPayments] = React.useState<PaymentItem[]>([]);

  // Result State (Untuk Dialog Sukses)
  const [successData, setSuccessData] = React.useState<{
    order: Order;
    items: CartItem[];
    cashReceived?: number;
    change?: number;
    payments?: PaymentItem[];
  } | null>(null);

  // --- CALCULATIONS (Memoized for Performance) ---
  const taxRate = useMemo(
    () => (taxesData.length > 0 ? parseFloat(taxesData[0].rate) : 0),
    [taxesData]
  );
  const taxName = useMemo(
    () => (taxesData.length > 0 ? taxesData[0].name : 'Pajak'),
    [taxesData]
  );

  const { subtotal, taxAmount, finalTotal } = useMemo(() => {
    const sub = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = Math.round((sub * taxRate) / 100); // Rounding untuk menghindari desimal aneh
    return {
      subtotal: sub,
      taxAmount: tax,
      finalTotal: sub + tax,
    };
  }, [cart, taxRate]);

  // Split Bill Calculations
  const totalPaidSplit = useMemo(
    () => splitPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [splitPayments]
  );
  const remainingSplit = Math.max(0, finalTotal - totalPaidSplit); // Prevent negative display

  // --- INIT & LOCAL STORAGE SAFEGUARD (FIXED) ---
  useEffect(() => {
    // Kita bungkus dalam setTimeout agar tidak memblokir render pertama (Synchronous SetState Error Fix)
    const timer = setTimeout(() => {
      const savedCart = localStorage.getItem('nexpos-cart');

      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          // Validasi sederhana array sebelum set
          if (Array.isArray(parsedCart)) {
            setCart(parsedCart);
          }
        } catch (e) {
          console.error('Cart parse error', e);
          localStorage.removeItem('nexpos-cart');
        }
      }

      // Tandai inisialisasi selesai agar UI tidak berkedip
      setIsInitialized(true);
    }, 0);

    // Cleanup timer untuk mencegah memory leak jika komponen di-unmount cepat
    return () => clearTimeout(timer);
  }, []);

  // Sync Cart ke LocalStorage (Tetap sama)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('nexpos-cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // --- GSAP ANIMATION (Entry) ---
  useGSAP(
    () => {
      // Animasi Stagger halus saat produk dimuat
      gsap.fromTo(
        '.product-card',
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.04,
          ease: 'back.out(1.2)',
          clearProps: 'all',
        }
      );
    },
    { scope: containerRef, dependencies: [initialProducts, searchQuery] }
  );

  // --- ACTIONS ---

  // 1. Add to Cart (Optimized)
  const addToCart = useCallback((product: Products) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      // Animasi feedback visual (Micro interaction)
      const cardId = `#card-${product.id}`;
      gsap.to(cardId, { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1 });

      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          toast.error('Stok Maksimal Tercapai');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      toast.success(`${product.name} ditambahkan`);
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  // 2. Update Qty
  const updateQuantity = useCallback((id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              toast.error(`Stok hanya tersedia ${item.stock}`);
              return item;
            }
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  // 3. Print Action
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Struk-${new Date().getTime()}`,
  });

  // Filter Logic
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return initialProducts.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query))
    );
  }, [initialProducts, searchQuery]);

  // --- ACTIONS (LANJUTAN) ---

  // 4. Handle Checkout (Logic Inti)
  const handleCheckout = async () => {
    // A. Validasi Dasar
    if (
      customerForm.orderType === 'dine_in' &&
      !customerForm.tableNumber.trim()
    ) {
      toast.error('Nomor Meja Wajib Diisi untuk Dine In!');
      return;
    }

    let finalPayments: PaymentItem[] = [];
    const amountToPay =
      customerForm.paymentMethod === 'cash' ? Number(cashGiven) : finalTotal;

    // B. Logic Split Bill vs Single Payment
    if (isSplitMode) {
      if (remainingSplit > 100) {
        // Toleransi 100 rupiah untuk pembulatan
        toast.error(`Pembayaran kurang ${formatRupiah(remainingSplit)}`);
        return;
      }
      if (splitPayments.length === 0) {
        toast.error('Belum ada pembayaran split dimasukkan');
        return;
      }
      finalPayments = splitPayments;
    } else {
      // Single Payment Logic
      if (customerForm.paymentMethod === 'cash' && amountToPay < finalTotal) {
        toast.error('Uang tunai kurang!', {
          description: `Kurang ${formatRupiah(finalTotal - amountToPay)}`,
        });
        return;
      }

      // Validasi Debit
      let refId = '';
      if (customerForm.paymentMethod === 'debit') {
        if (
          !debitForm.bankName ||
          debitForm.lastFourDigits.length < 4 ||
          !debitForm.approvalCode
        ) {
          toast.error(
            'Lengkapi data kartu debit (Bank, 4 Digit, Approval Code)'
          );
          return;
        }
        refId = `${debitForm.bankName.toUpperCase()}|${
          debitForm.lastFourDigits
        }|${debitForm.approvalCode}`;
      }

      finalPayments = [
        {
          method: customerForm.paymentMethod,
          amount: amountToPay, // Simpan amount yang dibayar (bisa lebih kalau cash)
          referenceId: refId,
        },
      ];
    }

    // C. Server Action
    startTransition(async () => {
      const res = await processCheckout(
        cart.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        {
          ...customerForm,
          payments: finalPayments,
        }
      );

      if (res.success && res.data) {
        setSuccessData({
          order: res.data,
          items: [...cart],
          cashReceived: isSplitMode ? totalPaidSplit : Number(cashGiven),
          change: isSplitMode ? 0 : Number(cashGiven) - finalTotal,
          payments: finalPayments,
        });

        // Reset
        setCart([]);
        setCashGiven('');
        setIsSplitMode(false);
        setSplitPayments([]);
        setIsCheckoutOpen(false);
        setIsCartSheetOpen(false);
        setCustomerForm({
          tableNumber: '',
          customerName: '',
          customerPhone: '',
          orderType: 'dine_in',
          paymentMethod: 'cash',
        });
        toast.success('Transaksi Berhasil Simpan!');
      } else {
        toast.error(res.message || 'Gagal memproses transaksi');
      }
    });
  };

  // 5. WhatsApp Generator
  const handleSendWhatsApp = () => {
    if (!successData?.order) return;
    const { order, items, payments } = successData;

    let text = `*STRUK #${order.id}*\n${storeSettings?.name || 'NEXPOS'}\n\n`;
    text += `📅 ${new Date().toLocaleString('id-ID')}\n`;
    text += `👤 ${order.customerName || 'Guest'}\n`;
    if (order.tableNumber) text += `🪑 Meja ${order.tableNumber}\n`;
    text += `--------------------------------\n`;

    items.forEach((item) => {
      text += `${item.quantity}x ${item.name.substring(0, 20)}\n`;
      text += `   @${formatRupiah(item.price)} = ${formatRupiah(
        item.price * item.quantity
      )}\n`;
    });

    text += `--------------------------------\n`;
    text += `*TOTAL: ${formatRupiah(order.totalAmount)}*\n`;

    if (order.paymentMethod === 'split' && payments) {
      text += `\n💳 SPLIT PAYMENT:\n`;
      payments.forEach(
        (p) =>
          (text += `• ${p.method.toUpperCase()}: ${formatRupiah(p.amount)}\n`)
      );
    } else if (order.paymentMethod === 'cash') {
      text += `💵 Tunai: ${formatRupiah(successData.cashReceived || 0)}\n`;
      text += `🔄 Kembali: ${formatRupiah(successData.change || 0)}\n`;
    } else {
      text += `💳 ${order.paymentMethod?.toUpperCase()}\n`;
    }

    text += `\nTerima kasih! 🙏`;

    const phone = order.customerPhone || customerForm.customerPhone;
    const target = phone ? phone.replace(/\D/g, '').replace(/^0/, '62') : '';
    const url = target
      ? `https://wa.me/${target}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // --- RENDER HELPERS (UI COMPONENTS) ---

  const renderCartList = () => (
    <div className="flex flex-col gap-3 pb-4">
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40 gap-4">
          <ShoppingBag size={56} strokeWidth={0.5} />
          <p className="text-sm font-medium">Keranjang Kosong</p>
        </div>
      ) : (
        cart.map((item) => (
          <div
            key={item.id}
            className="group flex gap-3 bg-card p-3 rounded-xl border border-border/40 hover:border-primary/40 transition-colors items-center shadow-sm"
          >
            {/* Image Thumbnail Kecil (Optional) */}
            <div className="h-10 w-10 bg-muted rounded-md overflow-hidden relative shrink-0">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <PackageOpen className="m-auto h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-foreground">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {formatRupiah(item.price)} x {item.quantity}
              </p>
            </div>

            {/* Qty Controls */}
            <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 border border-border/50">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-md hover:bg-background hover:text-destructive"
                onClick={() => updateQuantity(item.id, -1)}
              >
                <Minus size={10} strokeWidth={3} />
              </Button>
              <span className="w-6 text-center text-xs font-bold tabular-nums">
                {item.quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-md hover:bg-background hover:text-primary"
                onClick={() => updateQuantity(item.id, 1)}
              >
                <Plus size={10} strokeWidth={3} />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCheckoutSummary = () => (
    <div className="space-y-4">
      <div className="space-y-1.5 pt-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>
            {taxName} ({taxRate}%)
          </span>
          <span className="font-mono">{formatRupiah(taxAmount)}</span>
        </div>
        <div className="h-px bg-border/50 my-2" />
        <div className="flex justify-between text-base font-bold text-foreground">
          <span>Total Tagihan</span>
          <span className="text-primary font-mono text-lg">
            {formatRupiah(finalTotal)}
          </span>
        </div>
      </div>
      <Button
        className="w-full font-bold h-12 text-base shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98]"
        disabled={cart.length === 0}
        onClick={() => setIsCheckoutOpen(true)}
      >
        Bayar Sekarang <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  if (!isInitialized)
    return (
      <div className="h-dvh flex items-center justify-center text-primary">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  // --- MAIN RENDER ---
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-dvh bg-muted/10 text-foreground overflow-hidden font-sans"
    >
      {/* 1. HEADER (Fixed Height) */}
      <header className="h-16 px-4 border-b border-border/40 flex items-center gap-4 shrink-0 bg-background/80 backdrop-blur-md z-20 sticky top-0">
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="pl-9 h-10 bg-muted/40 border-transparent focus:bg-background focus:border-primary/50 transition-all rounded-full"
            placeholder="Cari menu, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Mobile Search Trigger (Bisa dikembangkan nanti) */}
        <div className="sm:hidden flex-1">
          <span className="font-bold text-lg tracking-tight">NexPOS</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <Badge
            variant="outline"
            className="hidden sm:flex border-green-500/30 text-green-600 bg-green-500/5 gap-1.5 py-1"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Online
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 bg-muted/50"
          >
            <User size={18} />
          </Button>
        </div>
      </header>

      {/* 2. CONTENT AREA (Split Layout) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: PRODUCT GRID */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-5 pb-32 lg:pb-5">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground opacity-60">
              <PackageOpen size={64} strokeWidth={1} />
              <p className="mt-4 font-medium">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  id={`card-${product.id}`} // Untuk target animasi GSAP
                  onClick={() => product.stock > 0 && addToCart(product)}
                  className={cn(
                    'product-card group relative flex flex-col bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 cursor-pointer transition-all shadow-sm hover:shadow-md active:scale-[0.97]',
                    product.stock === 0 &&
                      'opacity-60 grayscale cursor-not-allowed pointer-events-none'
                  )}
                >
                  {/* Image Aspect Ratio Lock 4:3 */}
                  <div className="aspect-[4/3] relative bg-muted w-full overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground/30">
                        <PackageOpen size={24} />
                      </div>
                    )}

                    {/* Stock Badge Overlay */}
                    {product.stock > 0 && product.stock <= 5 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 animate-pulse">
                        Sisa {product.stock}
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="text-white font-bold text-xs tracking-widest border border-white px-2 py-1">
                          HABIS
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5em] text-foreground/90">
                      {product.name}
                    </h3>

                    <div className="mt-auto flex items-end justify-between pt-3">
                      <span className="text-primary font-bold text-sm">
                        {formatRupiah(product.price)}
                      </span>
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: SIDEBAR (Desktop Only) */}
        <div className="hidden lg:flex w-[380px] border-l border-border/40 bg-card/50 flex-col shrink-0 h-full backdrop-blur-sm shadow-xl z-10">
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/80">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                <ShoppingCart size={16} />
              </div>
              Current Order
            </div>
            <Badge variant="secondary" className="font-mono">
              {cart.length} Item
            </Badge>
          </div>

          <ScrollArea className="flex-1 p-4 bg-muted/5">
            {renderCartList()}
          </ScrollArea>

          <div className="p-5 border-t border-border/40 bg-card shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
            {renderCheckoutSummary()}
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BAR (Sticky Bottom) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-3 shadow-2xl flex items-center justify-between">
          <div className="flex flex-col pl-2">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {cart.length} Item di Keranjang
            </span>
            <span className="text-lg font-extrabold text-primary leading-none">
              {formatRupiah(finalTotal)}
            </span>
          </div>
          <Button
            onClick={() => setIsCartSheetOpen(true)}
            className="font-bold rounded-xl shadow-lg shadow-primary/20"
          >
            Lihat Menu <ShoppingCart className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 3. MOBILE CART SHEET */}
      <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/50"
        >
          <SheetHeader className="p-4 border-b border-border/40 bg-muted/5">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart size={18} /> Keranjang Pesanan
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {renderCartList()}
          </div>
          <div className="p-4 bg-muted/10 border-t border-border/40">
            {renderCheckoutSummary()}
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. CHECKOUT DIALOG (MAIN FORM) */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-card border-none shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 h-full md:h-[650px]">
            {/* Left: Summary (Hidden on mobile, or collapsible) */}
            <div className="md:col-span-4 bg-muted/20 border-r border-border/40 p-6 flex flex-col h-full">
              <DialogHeader>
                <DialogTitle>Detail Pembayaran</DialogTitle>
                <DialogDescription>
                  Periksa kembali pesanan sebelum memproses.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-2 border-b border-border/30 last:border-0 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono font-medium">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pajak</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold bg-primary/10 p-3 rounded-lg text-primary mt-2">
                  <span>Total</span>
                  <span>{formatRupiah(finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Right: Input Forms */}
            <div className="md:col-span-8 p-6 flex flex-col h-full overflow-y-auto">
              <div className="space-y-6">
                {/* A. Customer Info */}
                <section className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <User size={16} /> Informasi Pelanggan
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Tipe Pesanan
                      </label>
                      <div className="flex bg-muted p-1 rounded-lg">
                        {(['dine_in', 'take_away'] as const).map((type) => (
                          <button
                            key={type}
                            // FIX: Casting ke tipe spesifik, bukan any
                            onClick={() =>
                              setCustomerForm((prev) => ({
                                ...prev,
                                orderType: type,
                              }))
                            }
                            className={cn(
                              'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                              customerForm.orderType === type
                                ? 'bg-background shadow text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {type === 'dine_in'
                              ? 'Makan di Tempat'
                              : 'Bawa Pulang'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        No. Meja
                      </label>
                      <Input
                        placeholder="Contoh: 12"
                        value={customerForm.tableNumber}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            tableNumber: e.target.value,
                          }))
                        }
                        disabled={customerForm.orderType === 'take_away'}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Nama Pelanggan
                      </label>
                      <Input
                        placeholder="Nama (Opsional)"
                        value={customerForm.customerName}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        WhatsApp (Opsional)
                      </label>
                      <Input
                        placeholder="0812..."
                        value={customerForm.customerPhone}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            customerPhone: e.target.value,
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                  </div>
                </section>

                <div className="h-px bg-border/50" />

                {/* B. Payment Method */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <CreditCard size={16} /> Metode Pembayaran
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        Split Bill?
                      </span>
                      <button
                        onClick={() => setIsSplitMode(!isSplitMode)}
                        className={cn(
                          'w-10 h-5 rounded-full relative transition-colors',
                          isSplitMode ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform',
                            isSplitMode && 'translate-x-5'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Payment Tabs */}
                  {!isSplitMode ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {/* GANTI BAGIAN MAP PAYMENT METHOD DENGAN INI */}
                        {[
                          { id: 'cash', label: 'Tunai', icon: Banknote },
                          { id: 'qris', label: 'QRIS', icon: Loader2 },
                          {
                            id: 'debit',
                            label: 'Debit/Kredit',
                            icon: CreditCard,
                          },
                        ].map((m) => (
                          <button
                            key={m.id}
                            // FIX: Casting m.id ke tipe PaymentMethod spesifik
                            onClick={() =>
                              setCustomerForm((prev) => ({
                                ...prev,
                                paymentMethod:
                                  m.id as CustomerFormState['paymentMethod'],
                              }))
                            }
                            className={cn(
                              'flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all',
                              customerForm.paymentMethod === m.id
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-muted bg-card hover:border-primary/30'
                            )}
                          >
                            <m.icon size={20} />
                            <span className="text-xs font-bold">{m.label}</span>
                          </button>
                        ))}
                      </div>

                      {customerForm.paymentMethod === 'cash' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Uang Diterima
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                              Rp
                            </span>
                            <Input
                              type="number"
                              className="pl-9 h-12 text-lg font-mono font-bold"
                              placeholder="0"
                              value={cashGiven}
                              onChange={(e) =>
                                setCashGiven(
                                  e.target.value === ''
                                    ? ''
                                    : parseFloat(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            {[50000, 100000].map((amt) => (
                              <Badge
                                key={amt}
                                variant="outline"
                                className="cursor-pointer hover:bg-muted py-1"
                                onClick={() => setCashGiven(amt)}
                              >
                                {formatRupiah(amt)}
                              </Badge>
                            ))}
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-muted py-1 ml-auto border-primary text-primary"
                              onClick={() => setCashGiven(finalTotal)}
                            >
                              Uang Pas
                            </Badge>
                          </div>
                          {Number(cashGiven) > finalTotal && (
                            <div className="p-3 bg-green-500/10 text-green-700 rounded-lg text-sm font-bold flex justify-between">
                              <span>Kembali:</span>
                              <span>
                                {formatRupiah(Number(cashGiven) - finalTotal)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {customerForm.paymentMethod === 'debit' && (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                          <Input
                            placeholder="Nama Bank (BCA, Mandiri...)"
                            className="col-span-2"
                            value={debitForm.bankName}
                            onChange={(e) =>
                              setDebitForm({
                                ...debitForm,
                                bankName: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="4 Digit Terakhir"
                            maxLength={4}
                            value={debitForm.lastFourDigits}
                            onChange={(e) =>
                              setDebitForm({
                                ...debitForm,
                                lastFourDigits: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Kode Approval / Ref"
                            value={debitForm.approvalCode}
                            onChange={(e) =>
                              setDebitForm({
                                ...debitForm,
                                approvalCode: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // SPLIT BILL UI
                    <div className="space-y-4 border rounded-xl p-4 bg-muted/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">Sisa Tagihan</span>
                        <span
                          className={cn(
                            'font-mono font-bold',
                            remainingSplit > 0
                              ? 'text-red-500'
                              : 'text-green-600'
                          )}
                        >
                          {formatRupiah(remainingSplit)}
                        </span>
                      </div>

                      {/* Input Split */}
                      {remainingSplit > 0 && (
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-[10px] uppercase text-muted-foreground font-bold">
                              Metode
                            </label>
                            <select
                              id="split-method"
                              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="cash">Tunai</option>
                              <option value="debit">Debit/Kredit</option>
                              <option value="qris">QRIS</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] uppercase text-muted-foreground font-bold">
                              Nominal
                            </label>
                            <Input
                              id="split-amount"
                              type="number"
                              defaultValue={remainingSplit}
                              className="h-9"
                            />
                          </div>
                          <Button
                            size="sm"
                            // GANTI CODE DI DALAM ONCLICK TOMBOL PLUS (+) SPLIT BILL
                            onClick={() => {
                              // Ambil elemen select
                              const selectElement = document.getElementById(
                                'split-method'
                              ) as HTMLSelectElement;
                              const inputElement = document.getElementById(
                                'split-amount'
                              ) as HTMLInputElement;

                              // FIX: Type Casting yang aman
                              const method =
                                selectElement.value as PaymentItem['method'];
                              const amount = parseFloat(inputElement.value);

                              if (amount <= 0) return;

                              setSplitPayments([
                                ...splitPayments,
                                {
                                  method,
                                  amount,
                                  referenceId: `SPLIT-${Date.now()}`,
                                },
                              ]);
                            }}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      )}

                      {/* List Split Payments */}
                      <div className="space-y-2 mt-2">
                        {splitPayments.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm bg-background p-2 rounded border border-dashed"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {p.method.toUpperCase()}
                              </Badge>
                              <span>{formatRupiah(p.amount)}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setSplitPayments(
                                  splitPayments.filter((_, i) => i !== idx)
                                )
                              }
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-[2] font-bold text-lg h-12"
                  onClick={handleCheckout}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="mr-2" />
                  )}
                  {isPending
                    ? 'Memproses...'
                    : `Bayar ${formatRupiah(
                        isSplitMode
                          ? totalPaidSplit
                          : customerForm.paymentMethod === 'cash'
                          ? finalTotal
                          : finalTotal
                      )}`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. SUCCESS / RECEIPT DIALOG */}
      <Dialog
        open={!!successData}
        onOpenChange={(open) => !open && setSuccessData(null)}
      >
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl text-center">
              Pembayaran Berhasil!
            </DialogTitle>
            <DialogDescription className="text-center">
              Transaksi telah tersimpan di sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 p-4 rounded-xl space-y-3 mb-4 border border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tagihan</span>
              <span className="font-bold">
                {successData?.order
                  ? formatRupiah(successData.order.totalAmount)
                  : 0}
              </span>
            </div>
            {(successData?.change || 0) > 0 && (
              <div className="flex justify-between text-lg font-bold text-green-600 border-t border-dashed border-border pt-2 mt-2">
                <span>Kembalian</span>
                <span>{formatRupiah(successData?.change || 0)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 border-primary/30 hover:bg-primary/5 text-primary"
              onClick={handlePrint}
            >
              <Printer className="mr-2 w-4 h-4" /> Cetak Struk
            </Button>
            <Button
              variant="outline"
              className="h-12 border-green-500/30 hover:bg-green-50 text-green-600"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="mr-2 w-4 h-4" /> Kirim WA
            </Button>
            <Button
              className="col-span-2 h-12 font-bold"
              onClick={() => setSuccessData(null)}
            >
              Transaksi Baru
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. HIDDEN PRINT COMPONENT */}
      <div className="hidden">
        {successData && storeSettings && (
          <ReceiptTemplate
            ref={receiptRef}
            orderId={successData.order.id}
            date={successData.order.createdAt || new Date()}
            storeName={storeSettings?.name || 'NexPOS'}
            storeAddress={storeSettings?.address || 'Alamat Toko'}
            storePhone={storeSettings?.phone || ''}
            receiptFooter={storeSettings?.receiptFooter || undefined}
            subtotal={successData.order.subtotal || 0}
            taxAmount={successData.order.taxAmount || 0}
            discountAmount={successData.order.discountAmount || 0}
            totalAmount={successData.order.totalAmount || 0}
            cashierName="Admin"
            customerName={successData.order.customerName || 'Pelanggan Umum'}
            tableNumber={successData.order.tableNumber || undefined}
            orderType={successData.order.orderType}
            items={successData.items.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }))}
            paymentMethod={successData.order.paymentMethod}
            amountPaid={successData.order.amountPaid || 0}
            changeAmount={successData.order.change || 0}
            payments={successData.payments || []}
          />
        )}
      </div>
    </div>
  );
}
