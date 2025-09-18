"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setEmail(data.user.email || "");
      }
    };
    fetchUser();
  }, []);

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-fuchsia-900 to-cyan-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-black/50 p-8 shadow-xl border border-white/10 backdrop-blur">
        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
          Profile
        </h1>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <span className="block text-xs text-white/50">Email</span>
            {email || "—"}
          </div>

         

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/20 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
