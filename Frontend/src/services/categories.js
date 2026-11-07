const STORAGE_KEY = "daybreak-menu-categories";
const CHANGE_EVENT = "daybreak:categories-changed";

function normalizeCategories(value) {
  if (!Array.isArray(value) || value.some((category) => typeof category !== "string")) {
    throw new Error("Saved categories have an invalid format. Clear the saved menu categories and try again.");
  }

  return value
    .map((category) => category.trim())
    .filter((category, index, list) => (
      category &&
      category.toLowerCase() !== "all" &&
      list.findIndex((other) => other.toLowerCase() === category.toLowerCase()) === index
    ));
}

export function getSavedCategories() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === null) return [];

  try {
    return normalizeCategories(JSON.parse(saved));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Saved categories could not be read. Clear the saved menu categories and try again.");
    }
    throw error;
  }
}

export function addSavedCategory(value) {
  const category = value.trim();
  if (!category) throw new Error("Enter a category name.");
  if (category.toLowerCase() === "all") throw new Error("“All” is reserved for the menu filter.");
  if (category.length > 60) throw new Error("Category names must be 60 characters or fewer.");

  const categories = getSavedCategories();
  if (categories.some((existing) => existing.toLowerCase() === category.toLowerCase())) {
    return { categories, added: false };
  }

  const nextCategories = [...categories, category];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCategories));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return { categories: nextCategories, added: true };
}

export function subscribeToCategoryChanges(onChange, onError = () => {}) {
  const handleChange = () => {
    try {
      onChange(getSavedCategories());
      onError("");
    } catch (error) {
      onError(error.message);
    }
  };
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) handleChange();
  };

  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}
