"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MohrsCircle from "@/components/MohrsCircle";
import StressElement from "@/components/StressElement";
import StressElement3D from "@/components/StressElement3D";
import MohrsCircle3D from "@/components/MohrsCircle3D";
import {
  getMaxShearAngleDeg,
  getMohrsCircle,
  getPrincipalAngleDeg,
  StressState,
  transformStress,
} from "@/lib/mohrs";
import { getPrincipalStresses3D, StressState3D } from "@/lib/mohrs3d";

const parseNumber = (value: string) => {
  const next = Number.parseFloat(value);
  return Number.isFinite(next) ? next : 0;
};

const wrapAngle = (angle: number) => {
  let normalized = ((angle + 180) % 360) - 180;
  if (normalized < -180) normalized += 360;
  return normalized;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"2d" | "3d">("2d");
  const [sigmaX, setSigmaX] = useState(200);
  const [sigmaY, setSigmaY] = useState(-200);
  const [tauXY, setTauXY] = useState(200);
  const [angleDeg, setAngleDeg] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sigmaX3, setSigmaX3] = useState(120);
  const [sigmaY3, setSigmaY3] = useState(-80);
  const [sigmaZ3, setSigmaZ3] = useState(40);
  const [tauXY3, setTauXY3] = useState(60);
  const [tauYZ3, setTauYZ3] = useState(-40);
  const [tauZX3, setTauZX3] = useState(20);
  const [projection3d, setProjection3d] = useState<"perspective" | "ortho">("perspective");

  const stress = useMemo<StressState>(
    () => ({ sigmaX, sigmaY, tauXY }),
    [sigmaX, sigmaY, tauXY]
  );
  const circle = useMemo(() => getMohrsCircle(stress), [stress]);
  const rotated = useMemo(() => transformStress(stress, angleDeg), [stress, angleDeg]);
  const stress3d = useMemo<StressState3D>(
    () => ({
      sigmaX: sigmaX3,
      sigmaY: sigmaY3,
      sigmaZ: sigmaZ3,
      tauXY: tauXY3,
      tauYZ: tauYZ3,
      tauZX: tauZX3,
    }),
    [sigmaX3, sigmaY3, sigmaZ3, tauXY3, tauYZ3, tauZX3]
  );
  const principal3d = useMemo(() => getPrincipalStresses3D(stress3d), [stress3d]);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, []);

  const startPlay = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setAngleDeg((prev) => wrapAngle(prev + 0.2));
    }, 20);
  };

  const stopPlay = () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlay();
    } else {
      startPlay();
    }
  };

  return (
    <div className="app">
      <div className="tabBar">
        <button
          type="button"
          className={`tabButton ${activeTab === "2d" ? "active" : ""}`}
          onClick={() => setActiveTab("2d")}
        >
          2D
        </button>
        <button
          type="button"
          className={`tabButton ${activeTab === "3d" ? "active" : ""}`}
          onClick={() => setActiveTab("3d")}
        >
          3D
        </button>
      </div>
      {activeTab === "2d" ? (
        <main className="grid">
          <section className="column">
            <h2>Inputs</h2>
            <div className="inputs">
              <label className="inputRow">
                <span>σx</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={sigmaX}
                    onChange={(event) => setSigmaX(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={sigmaX}
                    onChange={(event) => setSigmaX(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
              <label className="inputRow">
                <span>σy</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={sigmaY}
                    onChange={(event) => setSigmaY(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={sigmaY}
                    onChange={(event) => setSigmaY(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
              <label className="inputRow">
                <span>τxy</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={tauXY}
                    onChange={(event) => setTauXY(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={tauXY}
                    onChange={(event) => setTauXY(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
            </div>
            <div className="resultsSection">
              <div className="resultsHeader">Results</div>
              <div className="resultsChips">
                <span className="valueChip valueChipNeutral">
                  σ1{" "}
                  <strong>
                    {circle.sigma1.toFixed(1)} <span className="unit">MPa</span>
                  </strong>
                </span>
                <span className="valueChip valueChipNeutral">
                  σ2{" "}
                  <strong>
                    {circle.sigma2.toFixed(1)} <span className="unit">MPa</span>
                  </strong>
                </span>
                <span className="valueChip valueChipNeutral">
                  τmax{" "}
                  <strong>
                    {circle.tauMax.toFixed(1)} <span className="unit">MPa</span>
                  </strong>
                </span>
              </div>
            </div>
          </section>

          <section className="column centerPanel">
            <h2>Stress Element</h2>
            <StressElement stress={stress} angleDeg={angleDeg} onAngleChange={setAngleDeg} />
            <div className="rotatedValues">
              <span className="valueChip valueChipX">
                σx′{" "}
                <strong>
                  {rotated.sigmaXPrime.toFixed(1)} <span className="unit">MPa</span>
                </strong>
              </span>
              <span className="valueChip valueChipY">
                σy′{" "}
                <strong>
                  {rotated.sigmaYPrime.toFixed(1)} <span className="unit">MPa</span>
                </strong>
              </span>
              <span className="valueChip valueChipTau">
                τx′y′{" "}
                <strong>
                  {rotated.tauXYPrime.toFixed(1)} <span className="unit">MPa</span>
                </strong>
              </span>
            </div>
            <div className="buttonRow">
              <button type="button" onClick={() => setAngleDeg(getPrincipalAngleDeg(stress))}>
                Max Principal
              </button>
              <button type="button" onClick={() => setAngleDeg(getMaxShearAngleDeg(stress))}>
                Max Shear
              </button>
              <button type="button" onClick={() => setAngleDeg(0)}>
                Reset
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className={`playButton ${isPlaying ? "isPlaying" : ""}`}
              >
                <span className="playIcon">{isPlaying ? "⏸" : "▶"}</span>
              </button>
            </div>
          </section>

          <section className="column">
            <h2>Mohr’s Circle</h2>
            <MohrsCircle stress={stress} angleDeg={angleDeg} />
            <div className="legend">
              <span className="legendItem">
                <span className="dot dotRed" /> (σx, τxy)
              </span>
              <span className="legendItem">
                <span className="dot dotGreen" /> (σy, −τxy)
              </span>
            </div>
          </section>
        </main>
      ) : (
        <main className="grid">
          <section className="column">
            <h2>Inputs (3D)</h2>
            <div className="inputs">
              <label className="inputRow">
                <span>σx</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={sigmaX3}
                    onChange={(event) => setSigmaX3(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={sigmaX3}
                    onChange={(event) => setSigmaX3(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
              <label className="inputRow">
                <span>σy</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={sigmaY3}
                    onChange={(event) => setSigmaY3(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={sigmaY3}
                    onChange={(event) => setSigmaY3(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
              <label className="inputRow">
                <span>σz</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={sigmaZ3}
                    onChange={(event) => setSigmaZ3(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={sigmaZ3}
                    onChange={(event) => setSigmaZ3(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
              <label className="inputRow">
                <span>τxy</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={tauXY3}
                    onChange={(event) => setTauXY3(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={tauXY3}
                    onChange={(event) => setTauXY3(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
              <label className="inputRow">
                <span>τyz</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={tauYZ3}
                    onChange={(event) => setTauYZ3(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={tauYZ3}
                    onChange={(event) => setTauYZ3(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
              <label className="inputRow">
                <span>τzx</span>
                <div className="inputControls">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={tauZX3}
                    onChange={(event) => setTauZX3(parseNumber(event.target.value))}
                  />
                  <input
                    type="number"
                    value={tauZX3}
                    onChange={(event) => setTauZX3(parseNumber(event.target.value))}
                    step="1"
                  />
                  <span className="unit">MPa</span>
                </div>
              </label>
            </div>
          </section>

          <section className="column centerPanel">
            <h2>Stress Element (3D)</h2>
            <div className="projectionRow">
              <button
                type="button"
                className={`tabButton ${projection3d === "perspective" ? "active" : ""}`}
                onClick={() => setProjection3d("perspective")}
              >
                Perspective
              </button>
              <button
                type="button"
                className={`tabButton ${projection3d === "ortho" ? "active" : ""}`}
                onClick={() => setProjection3d("ortho")}
              >
                Orthographic
              </button>
            </div>
            <StressElement3D stress={stress3d} projection={projection3d} />
          </section>

          <section className="column">
            <h2>Mohr’s Circle (3D)</h2>
            <MohrsCircle3D stresses={principal3d} />
            <div className="resultsSection">
              <div className="resultsHeader">Principal Stresses</div>
              <div className="resultsChips">
                <span className="valueChip valueChipNeutral">
                  σ1{" "}
                  <strong>
                    {principal3d.sigma1.toFixed(1)} <span className="unit">MPa</span>
                  </strong>
                </span>
                <span className="valueChip valueChipNeutral">
                  σ2{" "}
                  <strong>
                    {principal3d.sigma2.toFixed(1)} <span className="unit">MPa</span>
                  </strong>
                </span>
                <span className="valueChip valueChipNeutral">
                  σ3{" "}
                  <strong>
                    {principal3d.sigma3.toFixed(1)} <span className="unit">MPa</span>
                  </strong>
                </span>
                <span className="valueChip valueChipNeutral">
                  τmax{" "}
                  <strong>
                    {principal3d.tauMax.toFixed(1)} <span className="unit">MPa</span>
                  </strong>
                </span>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
