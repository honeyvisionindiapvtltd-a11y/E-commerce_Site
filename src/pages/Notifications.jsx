import { Bell, Mail, MessageSquareText, Smartphone, ShieldCheck } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";

const iconMap = {
  mail: Mail,
  message: MessageSquareText,
  shield: ShieldCheck,
  phone: Smartphone,
};

export default function Notifications() {
  const { notifications, toggleNotification } = useCommerce();

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">Notifications</h1>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7DB] text-[#D99D00]">
              <Bell size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#071426]">Communication Preferences</h2>
              <p className="text-sm text-slate-500">Manage the alerts you receive from Honey Vision.</p>
            </div>
          </div>

          <div className="space-y-4">
            {notifications.map((item) => {
              const Icon = iconMap[item.icon] || Bell;
              return (
                <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-[#071426]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#071426]">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Toggle ${item.title}`}
                    onClick={() => toggleNotification(item.id)}
                    className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${item.enabled ? "bg-[#F4B400]" : "bg-gray-200"}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white shadow-sm ${item.enabled ? "ml-auto" : ""}`}></span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
