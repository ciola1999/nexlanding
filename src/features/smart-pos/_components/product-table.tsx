'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useQueryState } from 'nuqs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Search,
  Package,
  Copy,
  CheckCircle2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  MoreHorizontal,
} from 'lucide-react';

import type { Product } from '@/features/smart-pos/db/schema';
import { cn, formatPercent, formatRupiah } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { PriceEditableCell } from './price-editable-cell';
import { CostEditableCell } from './cost-editable-cell';
import { StockEditableCell } from './stock-editable-cell';
import { StatusToggleCell } from './status-toggle-cell';
import { DeleteProductsDialog } from './delete-products-dialog';

// --- SUB-COMPONENTS ---

const SkuBadge = ({ sku }: { sku: string | null }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!sku) return;
    navigator.clipboard.writeText(sku);
    setCopied(true);
    toast.success('SKU disalin');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      disabled={!sku}
      className="group/sku flex items-center gap-1.5 text-[10px] text-gray-500 font-mono hover:text-[#dfff4f] transition-colors cursor-pointer bg-white/5 px-1.5 py-0.5 rounded"
    >
      <span>{sku || 'NO-SKU'}</span>
      {sku && (
        <span className="opacity-0 group-hover/sku:opacity-100 transition-opacity">
          {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
        </span>
      )}
    </button>
  );
};

const SortableHeader = ({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentOrder: string | null;
  onSort: (key: string) => void;
  align?: 'left' | 'right' | 'center';
}) => {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={cn(
        'p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-[#18191e] cursor-pointer hover:text-white hover:bg-white/5 transition-colors select-none border-b border-white/5',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center'
      )}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={cn(
          'flex items-center gap-1.5',
          align === 'right' && 'justify-end',
          align === 'center' && 'justify-center'
        )}
      >
        {label}
        <span
          className={cn(
            'transition-all duration-200',
            isActive ? 'text-primary opacity-100' : 'text-gray-600 opacity-30'
          )}
        >
          {isActive ? (
            currentOrder === 'asc' ? (
              <ArrowUp size={12} />
            ) : (
              <ArrowDown size={12} />
            )
          ) : (
            <ArrowUpDown size={12} />
          )}
        </span>
      </div>
    </th>
  );
};

// --- MAIN COMPONENT ---

export default function ProductTable({ data }: { data: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Logic Sorting (Nuqs State)
  const [sortBy] = useQueryState('sort', { defaultValue: 'createdAt' });
  const [sortOrder] = useQueryState('order', { defaultValue: 'desc' });

  // Handle Sort Click (Manual Router Push)
  const handleSort = (key: string) => {
    let newOrder = 'desc';
    if (sortBy === key) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', key);
    params.set('order', newOrder);
    router.push(`?${params.toString()}`);
  };

  // Logic Selection
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? data.map((p) => p.id) : []);
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id)
    );
  };

  const selectedProducts = data.filter((p) => selectedIds.includes(p.id));

  // Render Empty State
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#18191e]/50 backdrop-blur-sm">
        <div className="p-4 bg-white/5 rounded-full mb-4 ring-1 ring-white/10">
          <Search className="text-gray-500" size={24} />
        </div>
        <h3 className="text-white font-bold text-lg">Data Tidak Ditemukan</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          Coba ubah filter pencarian atau sorting kamu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#202127] border border-white/10 p-2 pl-4 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 ring-1 ring-black/50">
          <div className="flex items-center gap-2">
            <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-sm text-gray-300 font-medium">Dipilih</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full h-8 px-3"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
            className="text-gray-500 hover:text-white rounded-full h-8 w-8 p-0"
          >
            <MoreHorizontal size={14} />
          </Button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-[#18191e] border border-white/5 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#18191e]">
              <tr>
                <th className="p-4 w-[40px] border-b border-white/5">
                  <Checkbox
                    checked={
                      data.length > 0 && selectedIds.length === data.length
                    }
                    onCheckedChange={handleSelectAll}
                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black translate-y-[2px]"
                  />
                </th>
                <SortableHeader
                  label="Produk"
                  sortKey="name"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="HPP"
                  sortKey="costPrice"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Harga Jual"
                  sortKey="price"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  align="right"
                />
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b border-white/5">
                  Margin
                </th>
                <SortableHeader
                  label="Stok"
                  sortKey="stock"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  align="center"
                />
                <SortableHeader
                  label="Tgl Input"
                  sortKey="createdAt"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                  align="center"
                />
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b border-white/5">
                  Status
                </th>
              </tr>
            </thead>

            {/* 👇 PERHATIKAN: Tag <tbody> langsung nempel dengan {data.map...} tanpa spasi/enter */}
            <tbody className="divide-y divide-white/5">
              {data.map((product) => {
                const cost = Number(product.costPrice);
                const price = product.price;
                const marginPercentage =
                  price > 0 ? ((price - cost) / price) * 100 : 0;
                const isSelected = selectedIds.includes(product.id);

                return (
                  <tr
                    key={product.id}
                    className={cn(
                      'group transition-colors duration-200',
                      isSelected
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-white/[0.02]'
                    )}
                  >
                    <td className="p-4 text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(c) =>
                          handleSelectRow(product.id, c as boolean)
                        }
                        className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black translate-y-[2px]"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <Package className="text-gray-600" size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm line-clamp-1 max-w-[180px]">
                            {product.name}
                          </div>
                          <SkuBadge sku={product.sku} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <CostEditableCell id={product.id} initialCost={cost} />
                    </td>
                    <td className="p-4 text-right">
                      <PriceEditableCell
                        id={product.id}
                        initialPrice={product.price}
                        costPrice={cost}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                          {formatPercent(marginPercentage)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <StockEditableCell
                        id={product.id}
                        initialStock={product.stock}
                      />
                    </td>

                    {/* 👇 PERBAIKAN DATE HYDRATION: Ditambah suppressHydrationWarning */}
                    <td className="p-4 text-center text-xs text-gray-500 font-mono">
                      <div
                        className="flex items-center justify-center gap-1.5"
                        title={
                          product.createdAt
                            ? format(
                                new Date(product.createdAt),
                                'dd MMM yyyy HH:mm'
                              )
                            : '-'
                        }
                      >
                        <CalendarDays size={12} className="opacity-40" />
                        <span suppressHydrationWarning>
                          {product.createdAt
                            ? format(new Date(product.createdAt), 'dd/MM/yy', {
                                locale: id,
                              })
                            : '-'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <StatusToggleCell
                          id={product.id}
                          initialStatus={product.isActive ?? false}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteProductsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        productsToDelete={selectedProducts}
        onSuccess={() => setSelectedIds([])}
      />
    </div>
  );
}
