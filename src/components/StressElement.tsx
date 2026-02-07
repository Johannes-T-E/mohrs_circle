import { useCallback, useEffect, useMemo, useRef } from "react";
import { getMohrsCircle, StressState, transformStress } from "@/lib/mohrs";

type StressElementProps = {
  stress: StressState;
  angleDeg: number;
  onAngleChange: (angleDeg: number) => void;
};

const normalizeAngle = (angle: number) => {
  let normalized = ((angle + 180) % 360) - 180;
  if (normalized < -180) normalized += 360;
  return normalized;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function StressElement({ stress, angleDeg, onAngleChange }: StressElementProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragState = useRef({
    isDragging: false,
    lastTime: 0,
    lastX: 0,
    lastDragTime: 0,
  });
  const dragHistory = useRef<Array<{ time: number; position: number }>>([]);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const angleRef = useRef(angleDeg);

  useEffect(() => {
    angleRef.current = angleDeg;
  }, [angleDeg]);

  const stopSpin = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startSpin = useCallback(() => {
    stopSpin();
    const minVelocity = 0.1;

    const step = (time: number) => {
      const velocity = velocityRef.current;
      if (Math.abs(velocity) < minVelocity) {
        velocityRef.current = 0;
        return;
      }

      const nextAngle = normalizeAngle(angleRef.current + velocity);
      onAngleChange(nextAngle);
      velocityRef.current = velocity * 0.99;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [onAngleChange, stopSpin]);

  useEffect(() => () => stopSpin(), [stopSpin]);

  const updateDragHistory = (time: number, position: number) => {
    dragHistory.current.push({ time, position });
    const maxHistoryTime = 50;
    dragHistory.current = dragHistory.current.filter(
      (entry) => time - entry.time <= maxHistoryTime
    );
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    stopSpin();
    dragState.current.isDragging = true;
    const startTime = performance.now();
    dragState.current.lastTime = startTime;
    dragState.current.lastDragTime = startTime;
    dragState.current.lastX = event.clientX;
    dragHistory.current = [];
    updateDragHistory(startTime, event.clientX);
    velocityRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState.current.isDragging) return;
    const now = performance.now();
    const deltaX = event.clientX - dragState.current.lastX;
    const rotationDelta = -deltaX * 0.5;
    const nextAngle = normalizeAngle(angleRef.current + rotationDelta);
    dragState.current.lastX = event.clientX;
    dragState.current.lastTime = now;
    dragState.current.lastDragTime = now;
    updateDragHistory(now, event.clientX);
    onAngleChange(nextAngle);
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const currentTime = performance.now();
    const history = dragHistory.current;
    const maxHistoryTime = 50;

    if (currentTime - dragState.current.lastDragTime > maxHistoryTime && history.length > 0) {
      updateDragHistory(currentTime, history[history.length - 1].position);
    }

    if (history.length >= 2) {
      const lastEntry = history[history.length - 1];
      let deltaPosition = 0;
      for (let i = history.length - 1; i > 0; i -= 1) {
        const curr = history[i];
        const prev = history[i - 1];
        if (lastEntry.time - prev.time <= maxHistoryTime) {
          deltaPosition += curr.position - prev.position;
        } else {
          break;
        }
      }
      const totalTime = lastEntry.time - history[0].time;
      if (totalTime > 0 && Math.abs(deltaPosition) > 0) {
        velocityRef.current = clamp(-(deltaPosition * 5) / totalTime, -50, 50);
      } else {
        velocityRef.current = 0;
      }
    } else {
      velocityRef.current = 0;
    }

    startSpin();
  };

  const { sigmaXPrime, sigmaYPrime, tauXYPrime } = transformStress(stress, angleDeg);
  const { sigma1, sigma2, tauMax } = getMohrsCircle(stress);
  const arrow = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    markerId: string
  ) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={6}
      strokeLinecap="round"
      markerEnd={`url(#${markerId})`}
    />
  );

  const cx = 180;
  const cy = 180;
  const size = 120;
  const half = size / 2;
  const normalOffset = 24;
  const shearOffset = 12;
  const maxShearLen = size;
  const markerWidth = size / 10;
  const markerHeight = size / 10;
  const viewBoxSize = markerWidth;

  const baseScale =
    Math.abs(tauMax) > 0
      ? maxShearLen / Math.abs(tauMax)
      : maxShearLen / Math.max(Math.abs(sigma1), Math.abs(sigma2), 1);

  const sigmaXLen = Math.abs(sigmaXPrime) * baseScale;
  const sigmaYLen = Math.abs(sigmaYPrime) * baseScale;
  const shearLen = Math.min(maxShearLen, Math.abs(tauXYPrime) * baseScale);
  const shearHalf = shearLen / 2;
  const positiveColor = "#1f77b4";
  const negativeColor = "#d62728";
  const tauColor = "#f1c40f";
  const sigmaColor = sigmaXPrime >= 0 ? positiveColor : negativeColor;
  const sigmaYColor = sigmaYPrime >= 0 ? positiveColor : negativeColor;

  const sigmaXLabel = useMemo(() => (Math.abs(sigmaXPrime) < 1e-3 ? "0.0" : sigmaXPrime.toFixed(1)), [sigmaXPrime]);
  const sigmaYLabel = useMemo(() => (Math.abs(sigmaYPrime) < 1e-3 ? "0.0" : sigmaYPrime.toFixed(1)), [sigmaYPrime]);
  const tauLabel = useMemo(() => (Math.abs(tauXYPrime) < 1e-3 ? "0.0" : tauXYPrime.toFixed(1)), [tauXYPrime]);

  const showSigmaX = Math.abs(sigmaXPrime) >= 0.05;
  const showSigmaY = Math.abs(sigmaYPrime) >= 0.05;
  const showTau = Math.abs(tauXYPrime) >= 0.05;

  return (
    <svg
      ref={svgRef}
      width={360}
      height={360}
      viewBox="0 0 360 360"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "none", cursor: "grab", overflow: "visible" }}
    >
      <defs>
        <marker
          id="arrowhead-normal-positive"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          refX={markerWidth / 2}
          refY={markerHeight / 2}
          markerWidth={markerWidth}
          markerHeight={markerHeight}
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path
            d={`M0,0 L${markerWidth},${markerHeight / 2} L0,${markerHeight} Z`}
            fill={positiveColor}
          />
        </marker>
        <marker
          id="arrowhead-normal-negative"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          refX={markerWidth / 2}
          refY={markerHeight / 2}
          markerWidth={markerWidth}
          markerHeight={markerHeight}
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path
            d={`M0,0 L${markerWidth},${markerHeight / 2} L0,${markerHeight} Z`}
            fill={negativeColor}
          />
        </marker>
        <marker
          id="arrowhead-shear"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          refX={size / 20}
          refY={size / 20}
          markerWidth={size / 10}
          markerHeight={size / 10}
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path
            d={`M0,0 L${markerWidth},${markerHeight / 2} L0,${markerHeight} Z`}
            fill={tauColor}
          />
        </marker>
      </defs>
      <g transform={`rotate(${-angleDeg} ${cx} ${cy})`}>
        <rect
          x={cx - half}
          y={cy - half}
          width={size}
          height={size}
          fill="none"
          stroke="#444"
          strokeWidth={4}
          rx={0}
        />
        {showSigmaX && (
          <>
            {sigmaXPrime > 0
              ? arrow(
                  cx + half + normalOffset,
                  cy,
                  cx + half + normalOffset + sigmaXLen,
                  cy,
                  sigmaColor,
                  sigmaXPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )
              : arrow(
                  cx + half + normalOffset + sigmaXLen,
                  cy,
                  cx + half + normalOffset,
                  cy,
                  sigmaColor,
                  sigmaXPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )}
            {sigmaXPrime > 0
              ? arrow(
                  cx - half - normalOffset,
                  cy,
                  cx - half - normalOffset - sigmaXLen,
                  cy,
                  sigmaColor,
                  sigmaXPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )
              : arrow(
                  cx - half - normalOffset - sigmaXLen,
                  cy,
                  cx - half - normalOffset,
                  cy,
                  sigmaColor,
                  sigmaXPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )}
            <text x={cx + half + normalOffset + 8} y={cy - 8} fontSize={16} fill="#333">
              σₓ
            </text>
            <text x={cx - half - normalOffset - 16} y={cy - 8} fontSize={16} fill="#333">
              σₓ
            </text>
          </>
        )}

        {showSigmaY && (
          <>
            {sigmaYPrime > 0
              ? arrow(
                  cx,
                  cy - half - normalOffset,
                  cx,
                  cy - half - normalOffset - sigmaYLen,
                  sigmaYColor,
                  sigmaYPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )
              : arrow(
                  cx,
                  cy - half - normalOffset - sigmaYLen,
                  cx,
                  cy - half - normalOffset,
                  sigmaYColor,
                  sigmaYPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )}
            {sigmaYPrime > 0
              ? arrow(
                  cx,
                  cy + half + normalOffset,
                  cx,
                  cy + half + normalOffset + sigmaYLen,
                  sigmaYColor,
                  sigmaYPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )
              : arrow(
                  cx,
                  cy + half + normalOffset + sigmaYLen,
                  cx,
                  cy + half + normalOffset,
                  sigmaYColor,
                  sigmaYPrime >= 0 ? "arrowhead-normal-positive" : "arrowhead-normal-negative"
                )}
            <text x={cx - 34} y={cy - half - normalOffset - 12} fontSize={16} fill="#333">
              σᵧ
            </text>
            <text x={cx - 34} y={cy + half + normalOffset + 26} fontSize={16} fill="#333">
              σᵧ
            </text>
          </>
        )}

        {showTau && (
          <>
            {tauXYPrime > 0
              ? arrow(
                  cx - shearHalf,
                  cy - half - shearOffset,
                  cx + shearHalf,
                  cy - half - shearOffset,
                  tauColor,
                  "arrowhead-shear"
                )
              : arrow(
                  cx + shearHalf,
                  cy - half - shearOffset,
                  cx - shearHalf,
                  cy - half - shearOffset,
                  tauColor,
                  "arrowhead-shear"
                )}
            {tauXYPrime > 0
              ? arrow(
                  cx + shearHalf,
                  cy + half + shearOffset,
                  cx - shearHalf,
                  cy + half + shearOffset,
                  tauColor,
                  "arrowhead-shear"
                )
              : arrow(
                  cx - shearHalf,
                  cy + half + shearOffset,
                  cx + shearHalf,
                  cy + half + shearOffset,
                  tauColor,
                  "arrowhead-shear"
                )}
            {tauXYPrime > 0
              ? arrow(
                  cx + half + shearOffset,
                  cy + shearHalf,
                  cx + half + shearOffset,
                  cy - shearHalf,
                  tauColor,
                  "arrowhead-shear"
                )
              : arrow(
                  cx + half + shearOffset,
                  cy - shearHalf,
                  cx + half + shearOffset,
                  cy + shearHalf,
                  tauColor,
                  "arrowhead-shear"
                )}
            {tauXYPrime > 0
              ? arrow(
                  cx - half - shearOffset,
                  cy - shearHalf,
                  cx - half - shearOffset,
                  cy + shearHalf,
                  tauColor,
                  "arrowhead-shear"
                )
              : arrow(
                  cx - half - shearOffset,
                  cy + shearHalf,
                  cx - half - shearOffset,
                  cy - shearHalf,
                  tauColor,
                  "arrowhead-shear"
                )}
            <text x={cx + 42} y={cy - half - shearOffset - 12} fontSize={16} fill="#333">
              τᵧₓ
            </text>
            <text
              x={cx + half + shearOffset + 18}
              y={cy - half + 8}
              fontSize={16}
              fill="#333"
            >
              τₓᵧ
            </text>
          </>
        )}

        <text x={cx} y={cy + 6} textAnchor="middle" fill="#333" fontSize={18}>
          α = {angleDeg.toFixed(2)}°
        </text>
      </g>
    </svg>
  );
}
