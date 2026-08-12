export default function SalesChart({ data = [] }) {
  const chartData = data.length
    ? data
    : [
        { label: "04 Aug", value: 20000 },
        { label: "05 Aug", value: 12000 },
        { label: "06 Aug", value: 26000 },
        { label: "07 Aug", value: 14000 },
        { label: "08 Aug", value: 24000 },
        { label: "09 Aug", value: 19000 },
        { label: "10 Aug", value: 31000 },
      ];

  const maxValue = Math.max(...chartData.map((point) => Number(point.value || 0)), 1);
  const points = chartData.map((point, index) => {
    const x = chartData.length === 1 ? 350 : (index / (chartData.length - 1)) * 700;
    const y = 200 - (Number(point.value || 0) / maxValue) * 150;
    return { ...point, x, y };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const latest = points.at(-1)?.value || 0;

  return (
    <div className="mt-5">
      <div className="relative h-[235px]">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[125, 100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="flex items-center gap-3">
              <span className="w-7 text-right text-[8px] text-slate-400">₹{value}K</span>
              <div className="h-px flex-1 border-t border-dashed border-slate-200" />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-10 inset-y-0">
          <svg viewBox="0 0 700 235" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="salesGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
            </defs>

            <polygon points={`0,235 ${linePoints} 700,235`} fill="url(#salesGradient)" />
            <polyline points={linePoints} fill="none" stroke="#f59e0b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />

            {points.map((point, index) => (
              <circle key={index} cx={point.x} cy={point.y} r="4" fill="white" stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>

          <div className="absolute right-0 top-[25px] rounded-md bg-[#071426] px-2 py-1 text-[9px] font-semibold text-white shadow">
            ₹{new Intl.NumberFormat("en-IN").format(latest)}
          </div>
        </div>
      </div>

      <div className="ml-10 mt-1 flex justify-between text-[8px] text-slate-400">
        {chartData.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
