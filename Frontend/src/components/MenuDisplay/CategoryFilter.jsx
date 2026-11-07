export default function CategoryFilter({ categories, selectedCategory, onSelect }) {
  return (
    <div className="mb-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter menu by category">
      {categories.map((category) => {
        const selected = category === selectedCategory;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            aria-pressed={selected}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
              selected
                ? "bg-[#314c3b] text-white"
                : "border border-[#e0ddd4] bg-transparent text-[#77736a] hover:border-[#314c3b] hover:text-[#314c3b]"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
