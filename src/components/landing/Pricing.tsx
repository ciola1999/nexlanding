'use client';

import { useRef } from 'react';
import { Check } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: "Starter",
    price: "$997",
    desc: "Perfect for simple landing pages.",
    features: ["One-page Website", "Mobile Responsive", "Basic SEO", "1 Week Delivery"],
    recommended: false,
  },
  {
    name: "Growth",
    price: "$2,497",
    desc: "Best for growing businesses.",
    features: ["5-Page Website", "CMS Integration", "Advanced SEO", "Animation & Interactions", "1 Month Support"],
    recommended: true, // 👈 Ini yang akan kita highlight
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Full-scale web applications.",
    features: ["Unlimited Pages", "Custom Backend", "AI Features", "Priority Support", "SLA Agreement"],
    recommended: false,
  },
];

export default function Pricing() {
  const container = useRef(null);

 useGSAP(() => {
    // Pastikan elemen ada
    const cards = gsap.utils.toArray('.pricing-card') as HTMLElement[];
    
    // Kita pakai looping biar setiap kartu punya pemicu sendiri
    cards.forEach((card) => {
      gsap.fromTo(card, 
        { 
          y: 100,      // Posisi Awal: Turun 100px
          opacity: 0   // Posisi Awal: Transparan (Hilang)
        },
        {
          y: 0,        // Posisi Akhir: Kembali ke tempat asal
          opacity: 1,  // Posisi Akhir: Muncul Jelas (100%)
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,  // Pemicunya adalah kartu itu sendiri
            start: 'top 85%', // Mulai animasi saat bagian atas kartu masuk 85% layar
          }
        }
      );
    });
  }, { scope: container });

  return (
    <section ref={container} id="pricing" className="py-24 px-4 bg-black text-white relative overflow-hidden">
      
      {/* Background Glow Effect (Hiasan) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Investasi Project</h2>
          <p className="text-gray-400">Pilih paket yang sesuai dengan skala bisnis Anda saat ini.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div 
              key={i}
              className={`pricing-card relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2
                ${plan.recommended 
                  ? 'border-purple-500 bg-neutral-900 shadow-2xl shadow-purple-500/20' // Style Khusus "Recommended"
                  : 'border-white/10 bg-black hover:border-white/30' // Style Biasa
                }
              `}
            >
              {/* Badge "Most Popular" jika Recommended */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-300 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className={`w-5 h-5 ${plan.recommended ? 'text-purple-400' : 'text-gray-500'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 rounded-xl font-bold transition-colors
                ${plan.recommended
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-white text-black hover:bg-gray-200'
                }
              `}>
                Pilih Paket
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}