import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { fetchProducts } from "../../services/api.js";
import { getSavedCategories, subscribeToCategoryChanges } from "../../services/categories.js";
import CategoryFilter from "./CategoryFilter.jsx";
import MenuItemCard from "./MenuItemCard.jsx";

export default function MenuGrid() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [savedCategories, setSavedCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    try {
      setSavedCategories(getSavedCategories());
      setCategoryError("");
    } catch (categoryLoadError) {
      setCategoryError(categoryLoadError.message);
    }

    return subscribeToCategoryChanges((categories) => {
      setSavedCategories(categories);
      setCategoryError("");
    }, setCategoryError);
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    fetchProducts()
      .then((products) => {
        if (active) setItems(products);
      })
      .catch(() => {
        if (active) setError("We couldn’t load the menu just now. Please try again in a moment.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const categories = useMemo(
    () => ["All", ...new Set([
      ...savedCategories,
      ...items.map((item) => item.category).filter(Boolean),
    ])],
    [items, savedCategories],
  );
  const visibleItems = selectedCategory === "All"
    ? items
    : items.filter((item) => item.category === selectedCategory);

  return (
    <>
      {categoryError && <p role="alert" className="mb-4 text-sm text-[#a14d31]">{categoryError}</p>}
      {categories.length > 1 && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-[#77736a]">
          <LoaderCircle className="animate-spin text-[#314c3b]" size={19} /> Brewing up the menu…
        </div>
      ) : error ? (
        <div role="alert" className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-sm text-[#77736a]">
          <AlertCircle size={22} className="text-[#bd7149]" />
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-full border border-[#d6d2c8] px-4 py-2 text-xs font-semibold text-[#314c3b] transition hover:border-[#314c3b]">
            Try again
          </button>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-[#77736a]">
          {items.length === 0 ? "Our menu is being prepared. Check back soon." : "Nothing in this category just yet."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <MenuItemCard key={item.id ?? item._id ?? item.name} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
