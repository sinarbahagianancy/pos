import React, { useState } from "react";
import SearchableCombobox, { toComboboxItems } from "../../app/components/SearchableCombobox";

interface LoginProps {
  staffList: string[];
  onLogin: (name: string, password: string) => Promise<void>;
}

const LoginView: React.FC<LoginProps> = ({ staffList, onLogin }) => {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !password) {
      setError("Please select your name and enter password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onLogin(selectedStaff, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-3xl"></div>

      <div
        className={`w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative z-10 transition-all duration-700 ${isLoading ? "opacity-0 scale-95 translate-y-10" : "opacity-100 scale-100 translate-y-0"}`}
      >
        <div className="p-8 lg:p-10 text-center">
          <div className="w-24 h-24  rounded-3xl flex items-center justify-center mx-auto mb-6 overflow-hidden ">
            <img
              src="/logo.png"
              alt="Sinar Bahagia Logo"
              className="w-full h-full object-contain "
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Sinar Bahagia POS
          </h1>
          <p className="text-slate-500 text-sm font-medium">Cutting Edge Photography</p>
        </div>

        <div className="p-8 lg:p-10 pt-0">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Select Identity
              </label>
              <SearchableCombobox
                items={toComboboxItems(staffList)}
                value={selectedStaff}
                onChange={setSelectedStaff}
                placeholder="Select Staff"
                inputClassName="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all hover:bg-white text-left"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all hover:bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              Sinar Bahagia Surabaya © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
