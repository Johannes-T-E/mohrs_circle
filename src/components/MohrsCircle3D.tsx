import type { PrincipalStresses3D } from "@/lib/mohrs3d";

type MohrsCircle3DProps = {
  stresses: PrincipalStresses3D;
  size?: number;
  axisLimit?: number;
};

export default function MohrsCircle3D({
  stresses,
  size = 360,
  axisLimit = 400,
}: MohrsCircle3DProps) {
  const padding = 20;
  const cx = size / 2;
  const cy = size / 2;
  const xMin = -axisLimit;
  const xMax = axisLimit;
  const yMin = -axisLimit;
  const yMax = axisLimit;

  const mapX = (value: number) =>
    padding + ((value - xMin) / (xMax - xMin || 1)) * (size - padding * 2);
  const mapY = (value: number) =>
    padding + ((yMax - value) / (yMax - yMin || 1)) * (size - padding * 2);

  const ticks = 5;
  const step = (xMax - xMin) / (ticks - 1 || 1);
  const tickValues = Array.from({ length: ticks }, (_, i) => xMin + i * step);

  const circles = [
    { a: stresses.sigma1, b: stresses.sigma2, color: "#1f77b4" },
    { a: stresses.sigma2, b: stresses.sigma3, color: "#2ca02c" },
    { a: stresses.sigma1, b: stresses.sigma3, color: "#d62728" },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <line x1={padding} y1={mapY(0)} x2={size - padding} y2={mapY(0)} stroke="#999" />
      <line x1={mapX(0)} y1={padding} x2={mapX(0)} y2={size - padding} stroke="#999" />

      {tickValues.map((tick) => (
        <g key={`x-${tick}`}>
          <line
            x1={mapX(tick)}
            y1={mapY(0) - 6}
            x2={mapX(tick)}
            y2={mapY(0) + 6}
            stroke="#111"
            strokeWidth={0.5}
          />
          <text x={mapX(tick)} y={mapY(0) + 18} textAnchor="middle" fontSize={10} fill="#111">
            {tick.toFixed(0)}
          </text>
        </g>
      ))}
      {tickValues
        .filter((tick) => tick !== 0)
        .map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={mapX(0) - 6}
              y1={mapY(tick)}
              x2={mapX(0) + 6}
              y2={mapY(tick)}
              stroke="#111"
              strokeWidth={0.5}
            />
            <text x={mapX(0) - 10} y={mapY(tick) + 3} textAnchor="end" fontSize={10} fill="#111">
              {tick.toFixed(0)}
            </text>
          </g>
        ))}

      {circles.map(({ a, b, color }, index) => {
        const center = (a + b) / 2;
        const radius = Math.abs(a - b) / 2;
        return (
          <circle
            key={`circle-${index}`}
            cx={mapX(center)}
            cy={mapY(0)}
            r={Math.abs(mapX(center + radius) - mapX(center))}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.7}
          />
        );
      })}

      <circle cx={mapX(stresses.sigma1)} cy={mapY(0)} r={4} fill="#111" />
      <circle cx={mapX(stresses.sigma2)} cy={mapY(0)} r={4} fill="#111" />
      <circle cx={mapX(stresses.sigma3)} cy={mapY(0)} r={4} fill="#111" />

      <text x={size - padding} y={mapY(0) - 6} textAnchor="end" fontSize={12} fill="#666">
        σ
      </text>
      <text x={mapX(0) + 6} y={padding + 12} textAnchor="start" fontSize={12} fill="#666">
        τ
      </text>
    </svg>
  );
}
