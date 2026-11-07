import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Coffee, LoaderCircle, LogOut, PackagePlus, Plus, Tag, Trash2, UserPlus, Users } from "lucide-react";
import { createProduct, createStaffUser, deleteProduct, deleteStaffUser, fetchProducts, fetchUsers, updateProduct } from "../../services/api.js";
import { addSavedCategory, getSavedCategories, subscribeToCategoryChanges } from "../../services/categories.js";
import ProductTable from "./ProductTable.jsx";
import ProductModal from "./ProductModal.jsx";

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Something went wrong. Please try again.";
}

export default function AdminLayout({ user, sessionError, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState("checking");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState({ open: false, product: null });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categoryNotice, setCategoryNotice] = useState("");
  const [staffUsers, setStaffUsers] = useState([]);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffError, setStaffError] = useState("");
  const [staffNotice, setStaffNotice] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  const loadStaffUsers = useCallback(async () => {
    setStaffLoading(true);
    setStaffError("");
    try {
      setStaffUsers(await fetchUsers());
    } catch (requestError) {
      setStaffError(getErrorMessage(requestError));
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      setCategories(getSavedCategories());
    } catch (categoryLoadError) {
      setCategoryError(categoryLoadError.message);
    }

    return subscribeToCategoryChanges(setCategories, setCategoryError);
  }, []);

  useEffect(() => {
    if (user.role === "admin") loadStaffUsers();
  }, [loadStaffUsers, user.role]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setApiStatus("checking");
    setError("");
    try {
      setProducts(await fetchProducts());
      setApiStatus("connected");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setApiStatus("unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSave = async (product) => {
    setSaving(true);
    setError("");
    try {
      if (modal.product) {
        await updateProduct(modal.product.id ?? modal.product._id, product);
        setNotice("Product updated successfully.");
      } else {
        await createProduct(product);
        setNotice("Product added successfully.");
      }
      setModal({ open: false, product: null });
      await loadProducts();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete “${product.name}” from the menu? This can’t be undone.`);
    if (!confirmed) return;

    setError("");
    setNotice("");
    try {
      await deleteProduct(product.id ?? product._id);
      setNotice("Product deleted successfully.");
      await loadProducts();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const productCategories = products.map((product) => product.category).filter(Boolean);
  const availableCategories = [...new Set([...categories, ...productCategories])];

  const handleAddCategory = (event) => {
    event.preventDefault();
    setCategoryError("");
    setCategoryNotice("");
    try {
      const result = addSavedCategory(categoryName);
      setCategories(result.categories);
      setCategoryName("");
      setCategoryNotice(result.added ? "Category added to the menu." : "That category already exists.");
    } catch (requestError) {
      setCategoryError(requestError.message);
    }
  };

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    setStaffError("");
    setStaffNotice("");
    setStaffLoading(true);
    try {
      await createStaffUser(staffEmail, staffPassword);
      setStaffEmail("");
      setStaffPassword("");
      setStaffNotice("Staff sign-in account created.");
      await loadStaffUsers();
    } catch (requestError) {
      setStaffError(getErrorMessage(requestError));
    } finally {
      setStaffLoading(false);
    }
  };

  const handleDeleteStaff = async (staffUser) => {
    if (!window.confirm(`Remove the sign-in account for ${staffUser.email}?`)) return;
    setStaffError("");
    setStaffNotice("");
    try {
      await deleteStaffUser(staffUser.id);
      setStaffUsers((current) => current.filter((entry) => entry.id !== staffUser.id));
      setStaffNotice(`Removed ${staffUser.email}.`);
    } catch (requestError) {
      setStaffError(getErrorMessage(requestError));
    }
  };

  return (
    <main className="min-h-[calc(100vh-78px)] bg-[#f7f5f0]">
      <div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#bd7149]">
              <Coffee size={14} /> B7 Coffee · Workspace
            </p>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Your menu, managed.</h1>
            <p className="mt-3 text-sm text-[#77736a]">Keep your counter favorites fresh and up to date.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6d2c8] bg-white px-5 py-3 text-xs font-semibold text-[#4c554d] transition hover:border-[#314c3b] hover:text-[#263b2e]"
            >
              <LogOut size={15} /> Sign out
            </button>
            <button
              type="button"
              onClick={() => { setNotice(""); setModal({ open: true, product: null }); }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#314c3b] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#263b2e]"
            >
              <PackagePlus size={16} /> Add a product
            </button>
          </div>
        </div>

        {sessionError && <p role="alert" className="mb-4 rounded-lg border border-[#ead4c7] bg-[#fbf0e9] px-4 py-3 text-sm text-[#8d4b30]">{sessionError}</p>}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e7e3da] bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b877d]">Menu items</p>
            <p className="mt-2 font-serif text-3xl">{products.length}</p>
          </div>
          <div className="rounded-xl border border-[#e7e3da] bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b877d]">Categories</p>
            <p className="mt-2 font-serif text-3xl">{availableCategories.length}</p>
          </div>
          <div className="rounded-xl border border-[#e7e3da] bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b877d]">API status</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <span className={`h-2 w-2 rounded-full ${apiStatus === "connected" ? "bg-[#6b9b74]" : apiStatus === "checking" ? "animate-pulse bg-[#d49d76]" : "bg-[#bd7149]"}`} />
              {apiStatus === "connected" ? "Connected" : apiStatus === "checking" ? "Connecting…" : "Unavailable"}
            </p>
          </div>
        </div>

        <section className="mb-5 rounded-xl border border-[#e7e3da] bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3ee] text-[#526c56]"><Tag size={16} /></span>
            <div>
              <h2 className="font-serif text-xl">Menu categories</h2>
              <p className="mt-1 text-xs text-[#8b877d]">Customers can filter the menu using these categories.</p>
            </div>
          </div>
          <form onSubmit={handleAddCategory} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="new-category" className="sr-only">New category name</label>
            <input
              id="new-category"
              value={categoryName}
              onChange={(event) => { setCategoryName(event.target.value); setCategoryNotice(""); }}
              maxLength={60}
              placeholder="Add a category, e.g. Seasonal"
              className="min-w-0 flex-1 rounded-full border border-[#e4e0d7] bg-[#fbfaf7] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa498] focus:border-[#738976]"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#314c3b] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#263b2e]">
              <Plus size={15} /> Add category
            </button>
          </form>
          {categoryError && <p role="alert" className="mt-3 text-xs text-[#a14d31]">{categoryError}</p>}
          {categoryNotice && <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-[#526c56]"><Check size={14} /> {categoryNotice}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {availableCategories.length ? availableCategories.map((category) => (
              <span key={category} className="rounded-full border border-[#e7e3da] bg-[#fbfaf7] px-3.5 py-2 text-[11px] font-medium text-[#68665f]">{category}</span>
            )) : <p className="text-xs text-[#8b877d]">No categories yet. Add one to start organizing your menu.</p>}
          </div>
        </section>

        {user.role === "admin" && (
          <section className="mb-5 overflow-hidden rounded-xl border border-[#e7e3da] bg-white">
            <div className="border-b border-[#ece9e2] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3ee] text-[#526c56]"><Users size={16} /></span>
                <div>
                  <h2 className="font-serif text-xl">Staff accounts</h2>
                  <p className="mt-1 text-xs text-[#8b877d]">Create or remove accounts that can manage the menu.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleCreateStaff} className="grid gap-3 border-b border-[#ece9e2] p-5 sm:grid-cols-[1fr_1fr_auto] sm:px-6">
              <div>
                <label htmlFor="staff-email" className="text-xs font-semibold">Staff email</label>
                <input id="staff-email" type="email" autoComplete="off" required maxLength={254} value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder="staff@coffeeshop.com" className="mt-2 w-full rounded-lg border border-[#e4e0d7] px-3.5 py-3 text-sm outline-none transition focus:border-[#738976]" />
              </div>
              <div>
                <label htmlFor="staff-password" className="text-xs font-semibold">Initial password</label>
                <input id="staff-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={staffPassword} onChange={(event) => setStaffPassword(event.target.value)} placeholder="At least 12 characters" className="mt-2 w-full rounded-lg border border-[#e4e0d7] px-3.5 py-3 text-sm outline-none transition focus:border-[#738976]" />
              </div>
              <button type="submit" disabled={staffLoading} className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#314c3b] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#263b2e] disabled:opacity-60">
                <UserPlus size={15} /> Create account
              </button>
            </form>
            {staffError && <p role="alert" className="mx-5 mt-3 text-xs text-[#a14d31] sm:mx-6">{staffError}</p>}
            {staffNotice && <p role="status" className="mx-5 mt-3 flex items-center gap-1.5 text-xs text-[#526c56] sm:mx-6"><Check size={14} /> {staffNotice}</p>}
            <div className="divide-y divide-[#f0eee8]">
              {staffLoading && staffUsers.length === 0 ? (
                <p className="px-6 py-5 text-xs text-[#8b877d]">Loading accounts…</p>
              ) : staffUsers.length === 0 ? (
                <p className="px-6 py-5 text-xs text-[#8b877d]">No accounts found.</p>
              ) : staffUsers.map((staffUser) => (
                <div key={staffUser.id} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{staffUser.email}</p>
                    <p className="mt-0.5 text-[10px] capitalize text-[#8b877d]">{staffUser.role} account</p>
                  </div>
                  {staffUser.role === "staff" && (
                    <button onClick={() => handleDeleteStaff(staffUser)} aria-label={`Remove ${staffUser.email}`} className="rounded-lg p-2 text-[#77736a] transition hover:bg-[#fbefea] hover:text-[#a14d31]">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {notice && <p role="status" className="mb-4 rounded-lg border border-[#cbdacb] bg-[#edf4eb] px-4 py-3 text-sm text-[#314c3b]">{notice}</p>}
        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[#ead4c7] bg-[#fbf0e9] px-4 py-3 text-sm text-[#8d4b30]">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-[#e7e3da] bg-white">
          <div className="flex items-center justify-between border-b border-[#ece9e2] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-serif text-xl">All products</h2>
              <p className="mt-1 text-xs text-[#8b877d]">Items shown on your customer menu</p>
            </div>
            <button onClick={loadProducts} disabled={loading} className="text-xs font-semibold text-[#596d5b] hover:text-[#314c3b] disabled:opacity-50">
              Refresh list
            </button>
          </div>
          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-[#77736a]">
              <LoaderCircle className="animate-spin text-[#314c3b]" size={19} /> Loading products…
            </div>
          ) : (
            <ProductTable products={products} onEdit={(product) => { setNotice(""); setModal({ open: true, product }); }} onDelete={handleDelete} />
          )}
        </section>
      </div>

      {modal.open && (
        <ProductModal
          product={modal.product}
          categories={availableCategories}
          saving={saving}
          onClose={() => !saving && setModal({ open: false, product: null })}
          onSave={handleSave}
        />
      )}
    </main>
  );
}
