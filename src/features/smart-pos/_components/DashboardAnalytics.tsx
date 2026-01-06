'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { getDashboardMetrics } from '@/features/smart-pos/_actions/dashboard';
import { TrendingUp, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// 1. DEFINISI TIPE DATA (INTERFACE)
interface ChartData {
  name: string;
  value: number;
}

interface DashboardMetrics {
  revenueToday: number;
  ordersToday: number;
  chartData: ChartData[];
}

// Tipe untuk Custom Tooltip Recharts
// Kita ambil value hanya number, karena Recharts payload-nya dinamis
interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

// Helper: Format Integer ke Rupiah
const formatRupiah = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Component Custom Tooltip (Typed)
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // payload[0].value dijamin number karena interface di atas
    const value = payload[0].value;
    return (
      <div className="bg-[#18191e]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-[#dfff4f] font-bold font-mono text-lg">
          {formatRupiah(value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardAnalytics() {
  // 2. STATE DENGAN TIPE DATA YANG JELAS
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getDashboardMetrics();
      if (res.success && res.data) {
        // TypeScript sekarang tahu res.data strukturnya sesuai DashboardMetrics
        setMetrics(res.data);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.from('.anim-card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="h-[400px] w-full flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="animate-spin text-[#dfff4f]" size={32} />
        <p className="text-sm tracking-widest uppercase">
          Syncing Analytics...
        </p>
      </div>
    );
  }

  // Guard clause: Jika metrics null (misal error fetch), jangan render chart
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* REVENUE CARD */}
        <div className="anim-card bg-[#18191e] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#dfff4f]/30 transition-colors">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} />
          </div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
            Revenue Today
          </p>
          <h3 className="text-4xl font-bold text-white mt-2 font-mono tracking-tight">
            {formatRupiah(metrics.revenueToday)}
          </h3>
          <div className="mt-4 flex items-center text-green-400 text-sm font-medium bg-green-400/10 w-fit px-2 py-1 rounded-full">
            <TrendingUp size={14} className="mr-1" />
            <span>Live Update</span>
          </div>
        </div>

        {/* ORDER COUNT CARD */}
        <div className="anim-card bg-[#18191e] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#dfff4f]/30 transition-colors">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag size={64} />
          </div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
            Total Orders
          </p>
          <h3 className="text-4xl font-bold text-white mt-2 font-mono tracking-tight">
            {metrics.ordersToday}
          </h3>
          <div className="mt-4 text-gray-500 text-sm">
            Transactions processed today
          </div>
        </div>
      </div>

      {/* 2. CHART AREA */}
      <div className="anim-card bg-[#18191e] border border-white/5 rounded-2xl p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">Sales Trend</h3>
            <p className="text-sm text-gray-500">Last 7 days performance</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-full bg-[#dfff4f]"></span> Revenue
          </div>
        </div>

        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dfff4f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dfff4f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: '#dfff4f',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#dfff4f"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
