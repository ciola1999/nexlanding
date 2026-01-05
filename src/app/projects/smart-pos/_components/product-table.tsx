import type { Product } from '@/db/schema';
export type { Product };

// Helper: Format Angka ke Rupiah
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0, // Hilangkan desimal ,00
  }).format(number);
};

export default function ProductTable({ data }: { data: Product[] }) {
  // State Kosong
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-10 border border-dashed border-gray-300 rounded-xl bg-gray-50">
        <p className="text-gray-500">Belum ada data produk.</p>
        <p className="text-sm text-gray-400">
          Klik tombol di atas untuk mengisi data.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
          <tr>
            <th className="px-6 py-4">Nama Produk</th>
            <th className="px-6 py-4">SKU</th>
            <th className="px-6 py-4 text-right">Harga</th>
            <th className="px-6 py-4 text-center">Stok</th>
            <th className="px-6 py-4 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((product) => (
            <tr
              key={product.id}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{product.name}</div>
                {product.description && (
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                    {product.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 font-mono text-xs text-gray-600">
                {product.sku}
              </td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">
                {formatRupiah(product.price)}
              </td>
              <td className="px-6 py-4 text-center">
                {/* Logic warna: Merah jika stok menipis (< 20) */}
                <span
                  className={`font-bold ${
                    product.stock < 20 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {product.stock}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span
                  className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                    product.isActive
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {product.isActive ? 'Aktif' : 'Non-Aktif'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
