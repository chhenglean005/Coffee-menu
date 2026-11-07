import { Coffee, Pencil, Trash2 } from "lucide-react";
import { resolveImageUrl } from "../../services/api.js";

export default function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1efe9] text-[#8c887f]"><Coffee size={21} /></span>
        <h3 className="font-serif text-lg">Nothing on the menu yet</h3>
        <p className="mt-1 text-xs text-[#8b877d]">Add your first product to get things brewing.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="bg-[#fbfaf7] text-[9px] font-bold uppercase tracking-[0.16em] text-[#8b877d]">
            <th className="px-6 py-3 font-semibold">Product</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Price</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-6 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0eee8]">
          {products.map((product) => {
            const id = product.id ?? product._id ?? product.name;
            const image = resolveImageUrl(product.imageUrl || product.image_url || product.image);
            return (
              <tr key={id} className="transition hover:bg-[#fdfcf9]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#eeeae2]">
                      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#aaa498]"><Coffee size={17} /></div>}
                    </div>
                    <span className="text-sm font-semibold">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4"><span className="rounded-full bg-[#f1f3ee] px-3 py-1.5 text-[10px] font-semibold text-[#60715f]">{product.category || "Uncategorized"}</span></td>
                <td className="px-4 py-4 text-sm font-semibold text-[#314c3b]">{product.price != null ? `$${Number(product.price).toFixed(2)}` : "—"}</td>
                <td className="max-w-[230px] truncate px-4 py-4 text-xs text-[#89857b]">{product.description || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`} className="rounded-lg p-2 text-[#77736a] transition hover:bg-[#edf1ea] hover:text-[#314c3b]"><Pencil size={15} /></button>
                    <button onClick={() => onDelete(product)} aria-label={`Delete ${product.name}`} className="rounded-lg p-2 text-[#77736a] transition hover:bg-[#fbefea] hover:text-[#a14d31]"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
