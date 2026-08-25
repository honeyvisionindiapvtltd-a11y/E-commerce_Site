import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  Camera,
  Car,
  ChartLine,
  Cloud,
  Database,
  Flame,
  LockKeyhole,
  MessageSquare,
  PlayCircle,
  ScanFace,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const AI_API_URL = import.meta.env.VITE_AI_CHAT_API_URL || "/api/ai/chat";
const DETECTION_API_URL =
  import.meta.env.VITE_AI_DETECTION_API_URL || "/api/ai/detect";

const aiTools = [
  {
    id: "camera",
    title: "Camera Recommendation",
    description:
      "Get camera recommendations based on site type, area, lighting and security requirements.",
    icon: Camera,
    color: "from-purple-500/30 to-fuchsia-500/10",
    kind: "camera",
  },
  {
    id: "coverage",
    title: "Coverage Calculator",
    description:
      "Estimate camera coverage and the number of cameras required for your area.",
    icon: Target,
    color: "from-blue-500/30 to-cyan-500/10",
    kind: "coverage",
  },
  {
    id: "storage",
    title: "Storage Calculator",
    description:
      "Estimate CCTV storage requirements from cameras, resolution, FPS, bitrate and retention.",
    icon: Database,
    color: "from-teal-500/30 to-emerald-500/10",
    kind: "storage",
  },
  {
    id: "bandwidth",
    title: "Bandwidth Calculator",
    description:
      "Estimate network bandwidth from camera count, bitrate and compression settings.",
    icon: Activity,
    color: "from-amber-500/30 to-orange-500/10",
    kind: "bandwidth",
  },
  {
    id: "chat",
    title: "AI Chat Assistant",
    description:
      "Ask surveillance, CCTV, networking and security-planning questions.",
    icon: MessageSquare,
    color: "from-purple-500/30 to-violet-500/10",
    kind: "chat",
  },
  {
    id: "face",
    title: "Face Recognition",
    description:
      "Upload an image and send it to your configured AI detection service for analysis.",
    icon: ScanFace,
    color: "from-blue-500/30 to-indigo-500/10",
    kind: "detection",
    detectionType: "face",
  },
  {
    id: "vehicle",
    title: "Vehicle Detection",
    description:
      "Upload a frame and analyze vehicles through your configured AI detection endpoint.",
    icon: Car,
    color: "from-teal-500/30 to-cyan-500/10",
    kind: "detection",
    detectionType: "vehicle",
  },
  {
    id: "fire",
    title: "Fire Detection",
    description:
      "Analyze an uploaded image for smoke/fire events through your configured AI endpoint.",
    icon: Flame,
    color: "from-red-500/30 to-orange-500/10",
    kind: "detection",
    detectionType: "fire",
  },
  {
    id: "intrusion",
    title: "Intrusion Detection",
    description:
      "Analyze a scene for possible intrusion events using your configured AI service.",
    icon: ShieldAlert,
    color: "from-violet-500/30 to-purple-500/10",
    kind: "detection",
    detectionType: "intrusion",
  },
];

const solutions = [
  {
    title: "Intelligent Surveillance",
    description:
      "AI-enhanced monitoring for real-time detection, alerts and automated response.",
    icon: Camera,
  },
  {
    title: "Smart Analytics",
    description:
      "Extract meaningful insights with advanced analytics and behavior detection.",
    icon: ChartLine,
  },
  {
    title: "AI Video Search",
    description:
      "Search footage by objects, faces, events and attributes in seconds.",
    icon: Search,
  },
  {
    title: "Predictive Monitoring",
    description:
      "Predict risks and anomalies before they happen with AI-powered predictive models.",
    icon: ShieldCheck,
  },
];

const advantages = [
  {
    title: "Fast Processing",
    description:
      "AI workflows are designed for responsive planning and quick results.",
    icon: Zap,
    border: "border-blue-500/70",
    iconColor: "text-blue-400",
  },
  {
    title: "Accurate Planning",
    description:
      "Use consistent inputs and transparent calculations to reduce planning errors.",
    icon: Target,
    border: "border-purple-500/70",
    iconColor: "text-purple-400",
  },
  {
    title: "Cloud Integration",
    description:
      "Connect the UI to your own cloud APIs for scalable storage and remote access.",
    icon: Cloud,
    border: "border-teal-500/70",
    iconColor: "text-teal-300",
  },
  {
    title: "Enterprise Security",
    description:
      "Keep secrets on the server and protect production AI endpoints with authentication.",
    icon: LockKeyhole,
    border: "border-amber-500/70",
    iconColor: "text-amber-400",
  },
];

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(value);
}

function ToolModal({ tool, onClose }) {
  if (!tool) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-tool-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-400/30 bg-[#06142c] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#06142c]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <tool.icon className="text-cyan-300" size={24} />
            <h2 id="ai-tool-dialog-title" className="text-lg font-semibold">
              {tool.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tool"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          {tool.kind === "camera" && <CameraRecommendation />}
          {tool.kind === "coverage" && <CoverageCalculator />}
          {tool.kind === "storage" && <StorageCalculator />}
          {tool.kind === "bandwidth" && <BandwidthCalculator />}
          {tool.kind === "chat" && <AIChatAssistant />}
          {tool.kind === "detection" && (
            <DetectionTool type={tool.detectionType} />
          )}
        </div>
      </div>
    </div>
  );
}

function CameraRecommendation() {
  const [site, setSite] = useState("home");
  const [area, setArea] = useState(1500);
  const [lighting, setLighting] = useState("mixed");
  const [result, setResult] = useState(null);

  const recommend = () => {
    const sqFt = Math.max(100, safeNumber(area, 100));
    let count = Math.ceil(sqFt / 500);
    if (site === "warehouse") count = Math.max(count, Math.ceil(sqFt / 700));
    if (site === "retail") count = Math.max(count, Math.ceil(sqFt / 400));
    if (site === "office") count = Math.max(count, Math.ceil(sqFt / 450));

    const camera =
      lighting === "low"
        ? "4MP/5MP full-color or low-light IP camera with IR"
        : "4MP/5MP IP dome/bullet camera with IR";

    setResult({
      count: Math.max(2, count),
      camera,
      nvr: Math.max(4, Math.ceil(Math.max(2, count) / 4) * 4),
    });
  };

  return (
    <ToolShell
      description="This is a planning estimate. Final camera selection should consider lens, mounting height, field of view and site conditions."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site type">
          <select value={site} onChange={(e) => setSite(e.target.value)} className={inputClass}>
            <option value="home">Home</option>
            <option value="office">Office</option>
            <option value="retail">Retail / Shop</option>
            <option value="warehouse">Warehouse</option>
          </select>
        </Field>
        <Field label="Approx. area (sq ft)">
          <input type="number" min="100" value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Lighting">
          <select value={lighting} onChange={(e) => setLighting(e.target.value)} className={inputClass}>
            <option value="good">Good</option>
            <option value="mixed">Mixed</option>
            <option value="low">Low light</option>
          </select>
        </Field>
      </div>
      <ActionButton onClick={recommend}>Get Recommendation</ActionButton>

      {result && (
        <ResultBox>
          <ResultRow label="Estimated cameras" value={result.count} />
          <ResultRow label="Suggested camera" value={result.camera} />
          <ResultRow label="Suggested NVR channel capacity" value={`${result.nvr} channels`} />
        </ResultBox>
      )}
    </ToolShell>
  );
}

function CoverageCalculator() {
  const [area, setArea] = useState(1000);
  const [coverage, setCoverage] = useState(400);
  const cameras = Math.max(1, Math.ceil(safeNumber(area, 0) / Math.max(1, safeNumber(coverage, 1))));

  return (
    <ToolShell description="Enter the usable area and practical coverage area per camera. Add overlap and blind-spot planning during final installation.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Area (sq ft)">
          <input type="number" min="1" value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Coverage per camera (sq ft)">
          <input type="number" min="1" value={coverage} onChange={(e) => setCoverage(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <ResultBox>
        <ResultRow label="Estimated cameras required" value={cameras} />
        <ResultRow label="Recommended planning allowance" value={`${Math.max(1, Math.ceil(cameras * 1.1))} cameras`} />
      </ResultBox>
    </ToolShell>
  );
}

function StorageCalculator() {
  const [cameras, setCameras] = useState(8);
  const [bitrate, setBitrate] = useState(4096);
  const [days, setDays] = useState(30);

  const storageGB =
    (safeNumber(cameras, 0) *
      safeNumber(bitrate, 0) *
      86400 *
      safeNumber(days, 0)) /
    8 /
    1024 /
    1024;

  return (
    <ToolShell description="This estimate uses continuous recording at the entered bitrate. Actual storage changes with VBR, motion recording, audio and retention policy.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cameras">
          <input type="number" min="1" value={cameras} onChange={(e) => setCameras(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Bitrate per camera (Kbps)">
          <input type="number" min="1" value={bitrate} onChange={(e) => setBitrate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Retention (days)">
          <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <ResultBox>
        <ResultRow label="Estimated storage" value={`${formatNumber(storageGB)} GB`} />
        <ResultRow label="Approx. usable capacity with 15% reserve" value={`${formatNumber(storageGB / 0.85)} GB`} />
      </ResultBox>
    </ToolShell>
  );
}

function BandwidthCalculator() {
  const [cameras, setCameras] = useState(8);
  const [bitrate, setBitrate] = useState(4096);

  const mbps = (safeNumber(cameras, 0) * safeNumber(bitrate, 0)) / 1024;

  return (
    <ToolShell description="For production networks, allow additional headroom for overhead, bursts, remote viewing and other network traffic.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cameras">
          <input type="number" min="1" value={cameras} onChange={(e) => setCameras(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Bitrate per camera (Kbps)">
          <input type="number" min="1" value={bitrate} onChange={(e) => setBitrate(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <ResultBox>
        <ResultRow label="Estimated aggregate bandwidth" value={`${formatNumber(mbps)} Mbps`} />
        <ResultRow label="Recommended network headroom" value={`${formatNumber(mbps * 1.25)} Mbps+`} />
      </ResultBox>
    </ToolShell>
  );
}

function AIChatAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! Ask me about CCTV cameras, NVRs, storage, bandwidth or surveillance planning.",
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const prompt = text.trim();
    if (!prompt || loading) return;

    const next = [...messages, { role: "user", content: prompt }];
    setMessages(next);
    setText("");
    setLoading(true);

    try {
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: prompt, messages: next }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.reply ||
        data.message ||
        data.content ||
        data?.choices?.[0]?.message?.content;

      if (!reply) throw new Error("AI service returned no reply.");

      setMessages((current) => [
        ...current,
        { role: "assistant", content: String(reply) },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "The AI service is not available right now. Configure VITE_AI_CHAT_API_URL and make sure your backend exposes a POST endpoint that returns { reply: \"...\" }.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell description={`Connected endpoint: ${AI_API_URL}`}>
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/10 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-lg p-3 text-sm ${
              message.role === "user"
                ? "ml-8 bg-blue-600/20 text-blue-50"
                : "mr-8 bg-white/5 text-slate-300"
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && <div className="text-sm text-cyan-300">Thinking…</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Ask a security question..."
          className={inputClass}
        />
        <ActionButton onClick={send} disabled={loading}>
          Send
        </ActionButton>
      </div>
    </ToolShell>
  );
}

function DetectionTool({ type }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setResult({ error: "Please select an image file." });
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setResult({ error: "Image must be 10 MB or smaller." });
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("type", type);

      const response = await fetch(DETECTION_API_URL, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Detection service returned ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        error:
          "Detection API is not configured or unavailable. Set VITE_AI_DETECTION_API_URL to your secure backend endpoint.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      description={`Upload an image for ${type} analysis. The browser sends the image to your backend; keep AI provider API keys on the server.`}
    >
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-400/40 bg-blue-500/5 p-8 text-center transition hover:bg-blue-500/10">
        <Upload className="mb-3 text-cyan-300" size={30} />
        <span className="font-medium">Choose an image</span>
        <span className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP up to 10 MB</span>
        <input type="file" accept="image/*" className="hidden" onChange={selectFile} />
      </label>

      {preview && (
        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
          <img src={preview} alt={`${type} preview`} className="max-h-80 w-full object-contain bg-black/20" />
        </div>
      )}

      <ActionButton onClick={analyze} disabled={!file || loading}>
        {loading ? "Analyzing..." : `Analyze ${type}`}
      </ActionButton>

      {result && (
        <pre className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </ToolShell>
  );
}

function ToolShell({ description, children }) {
  return (
    <div>
      <p className="mb-5 text-sm leading-6 text-slate-400">{description}</p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function ResultBox({ children }) {
  return (
    <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
      {children}
    </div>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/10 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <strong className="text-sm text-white">{value}</strong>
    </div>
  );
}

function SmallBenefit({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-2 text-xs text-slate-300">
      <div className="rounded-md bg-violet-500/20 p-2 text-cyan-300">
        <Icon size={15} />
      </div>
      <span className="leading-5">{text}</span>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#07172e] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function ActionButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
      <ArrowRight size={17} />
    </button>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2">
        {links.map(({ label, to }) => (
          <li key={label}>
            <Link
              to={to}
              className="text-slate-400 transition hover:text-blue-300"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AiTools() {
  const [selectedTool, setSelectedTool] = useState(null);

  const toolCount = useMemo(() => aiTools.length, []);

  const scrollToTools = () => {
    document.getElementById("tools")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#020b1b] text-white">
      <section className="relative border-b border-blue-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(0,99,255,0.24),transparent_30%),radial-gradient(circle_at_25%_30%,rgba(25,105,255,0.12),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-3 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Brain size={14} className="text-blue-400" />
              AI POWERED SOLUTIONS
            </span>

            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
                AI
              </span>{" "}
              Tools
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Powerful calculators and intelligent security tools designed to
              simplify surveillance planning and management.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={scrollToTools}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <Bot size={18} />
                Explore {toolCount} AI Tools
              </button>

              <button
                type="button"
                onClick={() => setSelectedTool(aiTools.find((t) => t.id === "chat"))}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-400/70 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-500/10"
              >
                <PlayCircle size={18} />
                Try AI Assistant
              </button>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-4">
              <SmallBenefit icon={Brain} text="Smart calculations" />
              <SmallBenefit icon={Zap} text="Save time & resources" />
              <SmallBenefit icon={Target} text="Data-driven decisions" />
            </div>
          </div>

          <div className="relative">
            <img
              src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786345411/Ai_zmtvl8.png"
              alt="AI-powered surveillance tools"
              className="mx-auto w-full max-w-xl object-contain"
              loading="eager"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      </section>

      <section id="tools" className="scroll-mt-20 px-3 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-xl border border-blue-500/20 bg-[#06142c]/80 p-5 shadow-[0_0_35px_rgba(20,85,255,0.08)] sm:p-7">
          <div className="text-center">
            <h2 className="text-3xl font-bold">AI Tools</h2>
            <p className="mt-3 text-sm text-slate-400">
              Click any tool to use it directly without navigating to a missing route.
            </p>
            <div className="mx-auto mt-3 h-0.5 w-10 bg-gradient-to-r from-blue-500 to-purple-500" />
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiTools.map(({ title, description, icon: Icon, color, id }) => (
              <button
                type="button"
                key={id}
                onClick={() => setSelectedTool(aiTools.find((tool) => tool.id === id))}
                className="group text-left rounded-xl border border-blue-500/40 bg-[#07172e] p-5 transition hover:-translate-y-1 hover:border-blue-400 hover:bg-[#0a1e3e] focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <div className="flex gap-4">
                  <div className={`grid h-13 w-13 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${color}`}>
                    <Icon size={27} className="text-cyan-300" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-5 text-slate-400">{description}</p>
                  </div>
                </div>

                <span className="ml-auto mt-4 flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/60 text-blue-300 transition group-hover:bg-blue-500 group-hover:text-white">
                  <ArrowRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-3 py-2 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-7 rounded-xl border border-blue-500/20 bg-[#06142c]/80 p-5 sm:p-7 lg:grid-cols-2 lg:items-center">
          <img
            src="/images/ai/ai-dashboard.png"
            alt="HoneyVision AI surveillance dashboard"
            className="w-full rounded-lg border border-blue-400/30"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Zap size={14} />
              SMARTER SURVEILLANCE
            </span>

            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              Featured{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AI
              </span>{" "}
              Solutions
            </h2>

            <p className="mt-4 max-w-lg text-slate-400">
              Advanced AI workflows to help you monitor, analyze and respond smarter.
            </p>

            <div className="mt-6 space-y-5">
              {solutions.map(({ title, description, icon: Icon }) => (
                <div key={title} className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-blue-500/50 bg-blue-500/10 text-blue-300">
                    <Icon size={23} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-xl border border-blue-500/20 bg-[#06142c]/80 p-5 sm:p-7">
          <h2 className="text-center text-3xl font-bold">
            Why Use <span className="text-amber-400">HoneyVision AI?</span>
          </h2>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map(({ title, description, icon: Icon, border, iconColor }) => (
              <article key={title} className={`rounded-xl border ${border} bg-[#07172e] p-6 text-center`}>
                <Icon className={`mx-auto ${iconColor}`} size={42} />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-3 pb-10 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-blue-400 bg-gradient-to-r from-purple-900 via-blue-900 to-[#071d4f] p-7 sm:p-10">
          <div className="relative ml-auto max-w-xl">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Experience
              <br />
              AI-Powered Security?
            </h2>

            <p className="mt-4 text-slate-300">
              Start with the calculators and AI assistant, then connect your production AI APIs.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={scrollToTools}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
              >
                Get Started
                <ArrowRight size={18} />
              </button>

              <Link
                to="/contact"
                className="rounded-lg border border-white/50 px-6 py-3 font-semibold hover:bg-white/10"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
    </main>
  );
}