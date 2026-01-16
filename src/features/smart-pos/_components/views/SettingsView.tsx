'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateStoreSettingsAction } from '@/features/smart-pos/_actions/setting-action';
import type { StoreSetting } from '@/features/smart-pos/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Store, MapPin, ReceiptText, Save, Globe } from 'lucide-react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface SettingsViewProps {
  initialData: StoreSetting | null;
}

export default function SettingsView({ initialData }: SettingsViewProps) {
  const [state, formAction, isPending] = useActionState(
    updateStoreSettingsAction,
    {
      status: 'idle',
      message: '',
    }
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // --- ANIMASI GSAP ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.settings-card', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // --- TOAST FEEDBACK ---
  useEffect(() => {
    if (state.status === 'success') {
      toast.success('Berhasil Disimpan!', { description: state.message });
    } else if (state.status === 'error') {
      toast.error('Gagal Menyimpan', { description: state.message });
    }
  }, [state, state.timestamp]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full max-w-5xl mx-auto space-y-8 pb-40"
    >
      {/* Header */}
      <div className="space-y-1 pl-1">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Pengaturan Toko
        </h2>
        <p className="text-gray-400">
          Kelola identitas, alamat, dan tampilan struk.
        </p>
      </div>

      <form action={formAction} className="relative space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- CARD 1: IDENTITAS --- */}
          <Card className="settings-card lg:row-span-2 border-white/10 bg-[#18181b] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#dfff4f]">
                <Store className="w-5 h-5" />
                Identitas Utama
              </CardTitle>
              <CardDescription className="text-gray-400">
                Info dasar toko.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Nama Toko <span className="text-red-500">*</span>
                </Label>
                {/* Kita paksa text-white dan border lebih terang */}
                <Input
                  name="name"
                  defaultValue={initialData?.name || ''}
                  placeholder="Contoh: Kopi Senja"
                  className="bg-black/50 border-white/20 text-white placeholder:text-gray-600 focus:border-[#dfff4f]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Deskripsi</Label>
                <Textarea
                  name="description"
                  defaultValue={initialData?.description || ''}
                  placeholder="Slogan..."
                  className="bg-black/50 border-white/20 text-white placeholder:text-gray-600 resize-none h-24 focus:border-[#dfff4f]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Email Bisnis</Label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={initialData?.email || ''}
                  placeholder="admin@toko.com"
                  className="bg-black/50 border-white/20 text-white focus:border-[#dfff4f]"
                />
              </div>
            </CardContent>
          </Card>

          {/* --- CARD 2: LOKASI (YANG TADI GELAP) --- */}
          <Card className="settings-card lg:col-span-2 border-white/10 bg-[#18181b] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <MapPin className="w-5 h-5" />
                Lokasi & Kontak
              </CardTitle>
              <CardDescription className="text-gray-400">
                Data ini muncul di kop struk.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-300">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="address"
                  defaultValue={initialData?.address || ''}
                  placeholder="Jl. Mawar No. 123..."
                  className="bg-black/50 border-white/20 text-white placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">No. Telepon</Label>
                <Input
                  name="phone"
                  defaultValue={initialData?.phone || ''}
                  placeholder="0812..."
                  className="bg-black/50 border-white/20 text-white focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Website / IG</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    name="website"
                    defaultValue={initialData?.website || ''}
                    placeholder="instagram.com/..."
                    className="pl-9 bg-black/50 border-white/20 text-white focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- CARD 3: FOOTER STRUK --- */}
          <Card className="settings-card lg:col-span-1 border-white/10 bg-[#18181b] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <ReceiptText className="w-5 h-5" />
                Footer Struk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-gray-300">Pesan Bawah</Label>
                <Textarea
                  name="receiptFooter"
                  defaultValue={initialData?.receiptFooter || 'Terima kasih!'}
                  className="bg-black/50 border-white/20 text-white text-center italic resize-none h-24 focus:border-green-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* --- CARD 4: PAJAK --- */}
          <Card className="settings-card lg:col-span-1 border-white/10 bg-[#18181b] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <ReceiptText className="w-5 h-5" />
                Pajak (PPN)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-gray-300">Persentase (%)</Label>
                <div className="relative">
                  <Input
                    name="taxRate"
                    type="number"
                    step="0.01"
                    defaultValue={initialData?.taxRate?.toString() || '0'}
                    className="bg-black/50 border-white/20 text-white text-right pr-8 font-mono focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- TOMBOL SIMPAN (FIXED) --- */}
        <div className="fixed bottom-8 right-8 z-[9999]">
          <Button
            type="submit"
            disabled={isPending}
            className={cn(
              'h-14 px-8 rounded-full shadow-[0_0_20px_rgba(223,255,79,0.3)] border border-[#dfff4f]/50 transition-all duration-300 font-bold text-lg',
              isPending
                ? 'bg-zinc-800 text-gray-400 cursor-not-allowed w-48'
                : 'bg-[#dfff4f] text-black hover:bg-[#ccee3e] hover:scale-105 hover:shadow-[0_0_30px_rgba(223,255,79,0.6)] w-auto'
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
