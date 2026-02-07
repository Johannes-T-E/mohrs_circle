import { getMohrsCircle, StressState, transformStress } from "@/lib/mohrs";

type MohrsCircleProps = {
  stress: StressState;
  angleDeg: number;
};

export default function MohrsCircle({ stress, angleDeg }: MohrsCircleProps) {
  const { center, radius, sigma1, sigma2, tauMax } = getMohrsCircle(stress);
  const { sigmaXPrime, sigmaYPrime, tauXYPrime } = transformStress(stress, angleDeg);

  const size = 360;
  const padding = 20;
  const cx = size / 2;
  const cy = size / 2;
  const axisLimit = 400;
  const xMin = -axisLimit;
  const xMax = axisLimit;
  const yMin = -axisLimit;
  const yMax = axisLimit;

  const mapX = (value: number) =>
    padding + ((value - xMin) / (xMax - xMin || 1)) * (size - padding * 2);
  const mapY = (value: number) =>
    padding + ((yMax - value) / (yMax - yMin || 1)) * (size - padding * 2);

  const ticks = 5;
  const xStep = (xMax - xMin) / (ticks - 1 || 1);
  const yStep = (yMax - yMin) / (ticks - 1 || 1);
  const xTicks = Array.from({ length: ticks }, (_, i) => xMin + i * xStep);
  const yTicks = Array.from({ length: ticks }, (_, i) => yMin + i * yStep);

  const shearColor = "#f1c40f";
  const positiveColor = "#1f77b4";
  const negativeColor = "#d62728";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={mapX(center)}
        cy={mapY(0)}
        r={Math.abs(mapX(center + radius) - mapX(center))}
        fill="none"
        stroke="#9ca3af"
        strokeWidth={2}
      />
      <line x1={padding} y1={mapY(0)} x2={size - padding} y2={mapY(0)} stroke="#999" />
      <line x1={mapX(center)} y1={padding} x2={mapX(center)} y2={size - padding} stroke="#999" />
      <line
        x1={mapX(0)}
        y1={padding}
        x2={mapX(0)}
        y2={size - padding}
        stroke="#b5b5b5"
        strokeWidth={1}
        strokeDasharray="4 6"
        opacity={0.6}
      />

      {xTicks.map((tick) => (
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
      {yTicks
        .filter((tick) => tick !== 0)
        .map((tick) => (
        <g key={`y-${tick}`}>
          <line
            x1={mapX(center) - 6}
            y1={mapY(tick)}
            x2={mapX(center) + 6}
            y2={mapY(tick)}
            stroke="#111"
            strokeWidth={0.5}
          />
          <text x={mapX(center) - 10} y={mapY(tick) + 3} textAnchor="end" fontSize={10} fill="#111">
            {tick.toFixed(0)}
          </text>
        </g>
      ))}

      <circle cx={mapX(sigma1)} cy={mapY(0)} r={4} fill="#111" />
      <circle cx={mapX(sigma2)} cy={mapY(0)} r={4} fill="#111" />

      <circle
        cx={mapX(stress.sigmaX)}
        cy={mapY(stress.tauXY)}
        r={4}
        fill="#d62728"
        fillOpacity={0.35}
      />
      <circle
        cx={mapX(stress.sigmaY)}
        cy={mapY(-stress.tauXY)}
        r={4}
        fill="#2ca02c"
        fillOpacity={0.35}
      />

      <g>
        <line
          x1={mapX(sigmaXPrime)}
          y1={mapY(tauXYPrime)}
          x2={mapX(0)}
          y2={mapY(tauXYPrime)}
          stroke={sigmaXPrime >= 0 ? positiveColor : negativeColor}
          strokeWidth={2}
        />
        <line
          x1={mapX(sigmaXPrime)}
          y1={mapY(tauXYPrime)}
          x2={mapX(sigmaXPrime)}
          y2={mapY(0)}
          stroke={shearColor}
          strokeWidth={2}
        />
        <circle
          cx={mapX(sigmaXPrime)}
          cy={mapY(tauXYPrime)}
          r={4}
          fill="#d62728"
        />
      </g>
      <g>
        <line
          x1={mapX(sigmaYPrime)}
          y1={mapY(-tauXYPrime)}
          x2={mapX(0)}
          y2={mapY(-tauXYPrime)}
          stroke={sigmaYPrime >= 0 ? positiveColor : negativeColor}
          strokeWidth={2}
        />
        <line
          x1={mapX(sigmaYPrime)}
          y1={mapY(-tauXYPrime)}
          x2={mapX(sigmaYPrime)}
          y2={mapY(0)}
          stroke={shearColor}
          strokeWidth={2}
        />
        <circle
          cx={mapX(sigmaYPrime)}
          cy={mapY(-tauXYPrime)}
          r={4}
          fill="#2ca02c"
        />
      </g>

      <text x={size - padding} y={mapY(0) - 6} textAnchor="end" fontSize="12" fill="#666">
        σ
      </text>
      <text x={mapX(center) + 6} y={padding + 12} textAnchor="start" fontSize="12" fill="#666">
        τ
      </text>
      <text x={mapX(sigma1)} y={mapY(0) + 18} textAnchor="middle" fontSize="12" fill="#444">
        σ1
      </text>
      <text x={mapX(sigma2)} y={mapY(0) + 18} textAnchor="middle" fontSize="12" fill="#444">
        σ2
      </text>
      <text
        x={mapX(sigmaXPrime) - 30}
        y={mapY(tauXYPrime) + 15}
        textAnchor="start"
        fontSize={12}
        fill="#d62728"
      >
        (σₓ, τₓᵧ)
      </text>
      <text
        x={mapX(sigmaYPrime) - 30}
        y={mapY(-tauXYPrime) + 15}
        textAnchor="start"
        fontSize={12}
        fill="#2ca02c"
      >
        (σᵧ, τᵧₓ)
      </text>
    </svg>
  );
}
