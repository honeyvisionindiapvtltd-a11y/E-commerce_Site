import { Lock, ShieldCheck, UserCog, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";

const iconMap = {
  1: UserCog,
  2: ShieldCheck,
  3: Lock,
  4: BellRing,
};

export default function AccountSettings() {
  const navigate = useNavigate();
  const { accountSettings, toggleAccountSetting } = useCommerce();

  const handlePrimaryAction = (item) => {
    if (item.id === 3) {
      navigate("/forgot-password");
      return;
    }

    toggleAccountSetting(item.id);
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">Account Settings</h1>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {accountSettings.map((item) => {
            const Icon = iconMap[item.id] || ShieldCheck;
            return (
              <div key={item.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7DB] text-[#D99D00]">
                  <Icon size={22} />
                </div>
                <h2 className="mt-5 text-xl font-bold text-[#071426]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handlePrimaryAction(item)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 font-semibold text-[#071426] transition hover:border-[#F4B400] hover:bg-[#FFF9E8]"
                  >
                    {item.id === 3 ? "Forgot Password" : "Manage"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAccountSetting(item.id)}
                    aria-label={`Toggle ${item.title}`}
                    className={`h-7 w-12 rounded-full p-1 transition ${item.enabled ? "bg-[#F4B400]" : "bg-gray-200"}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white shadow-sm ${item.enabled ? "ml-auto" : ""}`}></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
