import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Coffee, Instagram, LogOut, MapPin, Menu as MenuIcon, Phone, X } from "lucide-react";
import MenuGrid from "./components/MenuDisplay/MenuGrid.jsx";
import AdminLayout from "./components/AdminDashboard/AdminLayout.jsx";
import LoginForm from "./components/AdminDashboard/LoginForm.jsx";
import { getCurrentUser, login as loginUser, logout as logoutUser } from "./services/api.js";

const navItems = [
  { label: "Our menu", href: "#menu" },
  { label: "Our story", href: "#story" },
  { label: "Find us", href: "#visit" },
];

export default function App() {
  const [view, setView] = useState("menu");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((currentUser) => {
        if (active && currentUser) {
          setUser(currentUser);
          setView("admin");
        }
      })
      .catch(() => {
        if (active) setSessionError("Could not check your sign-in session. Please try again.");
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const showMenu = () => {
    setView("menu");
    setMobileMenuOpen(false);
  };

  const handleLogin = async (email, password) => {
    const signedInUser = await loginUser(email, password);
    setUser(signedInUser);
    setSessionError("");
    setView("admin");
  };

  const handleLogout = async () => {
    setSessionError("");
    try {
      await logoutUser();
      setUser(null);
      setView("menu");
      setMobileMenuOpen(false);
    } catch (error) {
      setSessionError(error.response?.data?.message || "Unable to sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen text-[#29251f]">
      {view === "admin" && user ? (
        <AdminLayout user={user} sessionError={sessionError} onLogout={handleLogout} />
      ) : view === "login" ? (
        <LoginForm onLogin={handleLogin} onCancel={showMenu} sessionError={sessionError} />
      ) : (
        <main>
          <section id="menu" className="scroll-mt-8 border-t border-[#e7e3da] bg-[#fbfaf7]">
            <div className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8 md:py-10">
              <div className="mb-10 flex items-center justify-between gap-4 border-b border-[#e9e0d2] pb-5 sm:mb-12 sm:pb-6">
                <a href="#menu" className="group inline-flex min-w-0 items-center  sm:gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-4xl border border-[#e8dfd2] shadow-[0_5px_16px_rgba(57,43,33,0.07)] sm:h-30 sm:w-30">
                    <img
                      src="https://res.cloudinary.com/cpgxtfdc/image/upload/v1794016989/photo_2026-11-07_09-02-41.jpg"
                      alt=""
                      className="h-full w-full rounded-x4 object-contain"
                    />
                  </span>
                  <span className="font-serif text-2xl font-semibold tracking-tight text-[#29251f] transition group-hover:text-[#314c3b] sm:text-3xl">
                    B7 Coffee<span className="text-[#bd8050]">.</span>
                  </span>
                </a>
                <div className="flex shrink-0 items-center gap-4">
                {view === "menu" && (
                  <button type="button" onClick={() => { setSessionError(""); setView("login"); }} disabled={authLoading} className="group inline-flex items-center gap-2 border-b border-transparent py-2 text-sm font-semibold text-[#4c554d] transition hover:border-[#314c3b] hover:text-[#263b2e] disabled:opacity-50">
                    Staff sign in <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </button>
                )}
                {view === "login" && (
                  <button onClick={showMenu} className="rounded-full bg-[#314c3b] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#263b2e]">
                    Back to the menu
                  </button>
                )}
                {view === "admin" && (
                  <>
                    <span className="text-xs text-[#77736a]">{user?.email}</span>
                    <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-[#d6d2c8] px-4 py-2.5 text-xs font-semibold transition hover:border-[#314c3b] hover:text-[#314c3b]">
                      <LogOut size={14} /> Sign out
                    </button>
                  </>
                )}
                </div>
              </div>
              <MenuGrid />
            </div>
          </section>
          <footer id="visit" className="bg-[#314c3b] text-[#f7f5f0]">
            <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_1.2fr_1fr] md:items-start">
              <div>
                <a href="#top" className="font-serif text-3xl font-semibold tracking-tight">B7 Coffee<span className="text-[#d5a77e]">.</span></a>
                <p className="mt-3 text-sm leading-6 text-[#c2cbbf]">Come by for a cup.</p>
              </div>

              <div>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#d5a77e]">Visit us</h2>
                <p className="flex items-start gap-3 text-sm leading-6 text-[#e2e8e1]">
                  <MapPin size={17} className="mt-1 shrink-0 text-[#d5a77e]" />
                  <span>Krang Angkrong Village,<br />Krang Thnong Sangkat, Sen Sok District,<br />Phnom Penh, Cambodia</span>
                </p>
              </div>

              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#d5a77e]">Call us</h2>
                  <div className="flex items-start gap-3 text-sm leading-6 text-[#e2e8e1]">
                    <Phone size={16} className="mt-1 shrink-0 text-[#d5a77e]" />
                    <p className="flex flex-col">
                      <a href="tel:+85517877222" className="transition hover:text-white">017 877 222</a>
                      <a href="tel:+85516426959" className="transition hover:text-white">016 426 959</a>
                    </p>
                  </div>
                </div>
                <a href="https://instagram.com" aria-label="Instagram" className="mt-8 rounded-full border border-[#637968] p-2.5 text-[#e2e8e1] transition hover:bg-[#405b49] hover:text-white"><Instagram size={16} /></a>
              </div>
            </div>
            <div className="border-t border-[#526b59]">
              <p className="mx-auto max-w-[1320px] px-5 py-4 text-xs text-[#b8c5b9] sm:px-8">B7 Coffee · Phnom Penh, Cambodia</p>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
