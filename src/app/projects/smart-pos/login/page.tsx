// src/app/projects/smart-pos/login/page.tsx
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { loginAction } from '@/features/smart-pos/_actions/auth';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  // React 19 Hook untuk Form Action
  const [state, action, isPending] = useActionState(loginAction, {
    success: false,
    message: '',
  });

  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Animasi Masuk (Awwwards Style)
  useGSAP(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      titleRef.current,
      { y: 50, opacity: 0, filter: 'blur(10px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power3.out',
      }
    ).fromTo(
      formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' },
      '-=0.4'
    );
  });

  // Handle Error Toast
  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
      // Animasi getar kalau salah password
      gsap.fromTo(
        formRef.current,
        { x: -10 },
        { x: 10, duration: 0.1, repeat: 3, yoyo: true }
      );
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-[#0f1014] flex items-center justify-center p-4 selection:bg-[#dfff4f] selection:text-black overflow-hidden relative force-show-cursor">
      {/* Background Ambience (Glow Effect) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#dfff4f]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Logo */}
        <div ref={titleRef} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dfff4f] rounded-2xl mb-6 shadow-[0_0_30px_rgba(223,255,79,0.3)]">
            <span className="text-3xl font-black text-black">N</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            NexPOS Access
          </h1>
          <p className="text-gray-400">Silakan masuk untuk memulai shift.</p>
        </div>

        {/* Form Card */}
        <form
          ref={formRef}
          action={action}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
        >
          <div className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Username ID
              </label>
              <div className="relative group">
                <input
                  name="username"
                  type="text"
                  placeholder="kasir01"
                  required
                  className="w-full bg-[#1c1d24] text-white border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-[#dfff4f]/50 focus:shadow-[0_0_15px_rgba(223,255,79,0.1)] transition-all placeholder:text-gray-600"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#dfff4f] transition-colors">
                  <ShieldCheck size={18} />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Passcode
              </label>
              <input
                name="password"
                type="password"
                placeholder="•••••••"
                required
                className="w-full bg-[#1c1d24] text-white border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-[#dfff4f]/50 focus:shadow-[0_0_15px_rgba(223,255,79,0.1)] transition-all placeholder:text-gray-600 tracking-widest"
              />
            </div>

            {/* Submit Button */}
            <button
              disabled={isPending}
              type="submit"
              className="w-full bg-[#dfff4f] hover:bg-[#ccee44] text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Buka Kasir</span>
                  <ArrowRight
                    size={18}
                    className="relative z-10 group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-600 text-xs mt-8">
          &copy; 2026 NexLanding POS System. Protected.
        </p>
      </div>
    </div>
  );
}
