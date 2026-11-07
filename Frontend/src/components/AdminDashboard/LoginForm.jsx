import { useState } from "react";
import { AlertCircle, Coffee, LoaderCircle, LockKeyhole } from "lucide-react";

export default function LoginForm({ onLogin, onCancel, sessionError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(loginError.response?.data?.message || "Unable to sign in. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f7f5f0] px-5 py-12">
      <section className="w-full max-w-[440px] rounded-2xl border border-[#e7e3da] bg-white p-7 shadow-[0_16px_55px_rgba(54,48,38,0.07)] sm:p-9">
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-[#77736a]">Sign in with the account provided by your shop administrator.</p>

        {(error || sessionError) && (
          <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-[#ead4c7] bg-[#fbf0e9] px-3.5 py-3 text-xs leading-5 text-[#8d4b30]">
            <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error || sessionError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold">Email address</label>
            <input id="login-email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-[#e4e0d7] px-3.5 py-3 text-sm outline-none transition focus:border-[#738976]" placeholder="you@coffeeshop.com" />
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-semibold">Password</label>
            <div className="relative mt-2">
              <LockKeyhole size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a19b90]" />
              <input id="login-password" type="password" autoComplete="current-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-[#e4e0d7] py-3 pl-10 pr-3.5 text-sm outline-none transition focus:border-[#738976]" placeholder="At least 12 characters" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#314c3b] px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-[#263b2e] disabled:cursor-wait disabled:opacity-60">
            {submitting && <LoaderCircle size={15} className="animate-spin" />} {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <button type="button" onClick={onCancel} className="mt-5 w-full text-center text-xs font-semibold text-[#77736a] transition hover:text-[#314c3b]">Back to the coffee menu</button>
      </section>
    </main>
  );
}
