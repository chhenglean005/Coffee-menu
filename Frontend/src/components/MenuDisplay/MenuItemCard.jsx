import { Coffee } from "lucide-react";
import { resolveImageUrl } from "../../services/api.js";

export default function MenuItemCard({ item }) {
  const image = resolveImageUrl(item.imageUrl || item.image_url || item.image);

  return (
    <article className="group overflow-hidden rounded-xl border border-[#e9e5dc] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(54,48,38,0.08)]">
      <div className="relative aspect-[1.36/1] overflow-hidden bg-[#eeeae2]">
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#b8b2a7]">
            <Coffee size={35} strokeWidth={1.2} />
          </div>
        )}
        {item.category && (
          <span className="absolute left-3 top-3 rounded-full bg-[#f7f5f0]/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#615a4e] backdrop-blur">
            {item.category}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg leading-tight">{item.name}</h3>
          {item.price != null && <span className="shrink-0 text-sm font-semibold text-[#314c3b]">${Number(item.price).toFixed(2)}</span>}
        </div>
        {item.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#89857b]">{item.description}</p>}
      </div>
    </article>
  );
}
