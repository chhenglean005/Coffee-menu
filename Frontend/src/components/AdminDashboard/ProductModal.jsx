import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { resolveImageUrl } from "../../services/api.js";

const emptyProduct = { name: "", description: "", price: "", category: "", imageFile: null };
const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ProductModal({ product, categories, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyProduct);
  const [validationError, setValidationError] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    setForm(product ? {
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      category: product.category ?? "",
      imageFile: null,
    } : emptyProduct);
    setValidationError("");
  }, [product]);

  useEffect(() => {
    if (form.imageFile) {
      const previewUrl = URL.createObjectURL(form.imageFile);
      setImagePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }

    setImagePreview(resolveImageUrl(product?.image));
    return undefined;
  }, [form.imageFile, product]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setValidationError("");
    if (file && !allowedImageTypes.includes(file.type)) {
      setValidationError("Choose a JPEG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file && file.size > maxImageSize) {
      setValidationError("Image files must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setForm((current) => ({ ...current, imageFile: file }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.category.trim() || form.price === "" || Number(form.price) < 0) {
      setValidationError("Enter a name, category, and a valid non-negative price.");
      return;
    }
    setValidationError("");
    onSave({
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
    });
  };

  const inputClass = "mt-2 w-full rounded-lg border border-[#e4e0d7] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#b2ada3] focus:border-[#738976]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#201f1b]/50 p-4 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className="my-auto w-full max-w-[540px] overflow-hidden rounded-2xl bg-[#fbfaf7] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e9e5dc] px-6 py-5 sm:px-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#bd7149]">Menu management</p>
            <h2 id="product-modal-title" className="mt-1 font-serif text-2xl">{product ? "Update product" : "Add a product"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close dialog" className="rounded-full p-2 text-[#77736a] transition hover:bg-[#efede7] disabled:opacity-50"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6 sm:px-8">
          <div>
            <label htmlFor="product-name" className="text-xs font-semibold">Product name <span className="text-[#bd7149]">*</span></label>
            <input id="product-name" name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. Honey oat latte" required maxLength={100} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-category" className="text-xs font-semibold">Category <span className="text-[#bd7149]">*</span></label>
              <select id="product-category" name="category" value={form.category} onChange={handleChange} className={inputClass} required>
                <option value="" disabled>{categories.length ? "Choose a category" : "Add a category first"}</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="product-price" className="text-xs font-semibold">Price <span className="text-[#bd7149]">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-[24px] text-sm text-[#8b877d]">$</span>
                <input id="product-price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} className={`${inputClass} pl-7`} placeholder="0.00" required />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="product-description" className="text-xs font-semibold">Description</label>
            <textarea id="product-description" name="description" value={form.description} onChange={handleChange} className={`${inputClass} min-h-[92px] resize-y`} placeholder="A short, tasty description…" maxLength={500} />
          </div>
          <div>
            <label htmlFor="product-image" className="text-xs font-semibold">Product image</label>
            <input id="product-image" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-[#edf1ea] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#314c3b]`} />
            <p className="mt-1.5 text-[11px] text-[#8b877d]">JPEG, PNG, WebP, or GIF · up to 5 MB</p>
            {imagePreview && <img src={imagePreview} alt="Product preview" className="mt-3 h-28 w-36 rounded-lg border border-[#e4e0d7] object-cover" />}
            {product?.image && !form.imageFile && <p className="mt-1 text-[11px] text-[#8b877d]">Choose a new file to replace the current image.</p>}
          </div>
          {validationError && <p role="alert" className="text-xs text-[#a14d31]">{validationError}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-[#e9e5dc] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-[#ddd9d0] px-5 py-3 text-xs font-semibold text-[#68665f] transition hover:bg-[#f1efe9] disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#314c3b] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#263b2e] disabled:cursor-wait disabled:opacity-60">
              {saving ? "Saving…" : product ? "Save changes" : "Add to menu"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
