"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { StressState3D } from "@/lib/mohrs3d";

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

type StressElement3DProps = {
  stress: StressState3D;
  size?: number;
  projection?: "perspective" | "ortho";
};

export default function StressElement3D({
  stress,
  size = 360,
  projection = "perspective",
}: StressElement3DProps) {
  const normalized = useMemo(() => {
    const values = [
      stress.sigmaX,
      stress.sigmaY,
      stress.sigmaZ,
      stress.tauXY,
      stress.tauYZ,
      stress.tauZX,
    ];
    const maxAbs = Math.max(1, ...values.map((value) => Math.abs(value)));
    return { maxAbs };
  }, [stress]);

  const setup = (p5: any, canvasParentRef: Element) => {
    p5.createCanvas(size, size, p5.WEBGL).parent(canvasParentRef);
    p5.angleMode(p5.RADIANS);
  };

  const drawArrow = (
    p5: any,
    start: [number, number, number],
    end: [number, number, number],
    color: [number, number, number]
  ) => {
    p5.push();
    p5.stroke(...color);
    p5.strokeWeight(5);
    p5.line(start[0], start[1], start[2], end[0], end[1], end[2]);
    const dir = p5.createVector(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
    const length = dir.mag();
    if (length > 0) {
      dir.normalize();
      const up = p5.createVector(0, 1, 0);
      const axis = up.cross(dir);
      const dot = p5.constrain(up.dot(dir), -1, 1);
      const angle = Math.acos(dot);
      p5.translate(end[0], end[1], end[2]);
      if (axis.mag() < 1e-4) {
        if (dot < 0) {
          p5.rotateX(Math.PI);
        }
      } else {
        p5.rotate(angle, axis);
      }
      p5.noStroke();
      p5.fill(...color);
      p5.cone(6, 12);
    }
    p5.pop();
  };

  const drawLabel = (p5: any, position: [number, number, number], label: string) => {
    p5.push();
    p5.translate(position[0], position[1], position[2]);
    p5.fill(40);
    p5.noStroke();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(14);
    p5.text(label, 0, 0);
    p5.pop();
  };

  // Base orientation and "keep upright" behavior: yaw (Z) + pitch (X) only.
  let rotX = Math.PI/2.6;
  let rotZ = Math.PI/5;
  let velX = 0;
  let velZ = 0;
  let dragging = false;
  let draggingCanvas = false;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;

  const handleDrag = (p5: any) => {
    if (!dragging) return;
    const now = p5.millis();
    const dx = p5.mouseX - lastX;
    const dy = p5.mouseY - lastY;
    rotZ += dx * 0.005;
    rotX += dy * 0.005;
    const dt = Math.max(1, now - lastTime);
    velZ = dx / dt;
    velX = dy / dt;
    lastX = p5.mouseX;
    lastY = p5.mouseY;
    lastTime = now;
  };

  const draw = (p5: any) => {
    p5.clear();
    p5.background(0, 0, 0, 0);
    if (p5.mouseIsPressed && draggingCanvas) {
      if (!dragging) {
        dragging = true;
        lastX = p5.mouseX;
        lastY = p5.mouseY;
        lastTime = p5.millis();
      } else {
        handleDrag(p5);
      }
    } else {
      dragging = false;
      draggingCanvas = false;
      rotZ += velZ * 4;
      rotX += velX * 4;
      velX *= 0.9;
      velZ *= 0.9;
    }

    if (projection === "ortho") {
      p5.ortho(-size / 2, size / 2, -size / 2, size / 2, -1000, 1000);
    } else {
      p5.perspective();
    }

    p5.rotateX(rotX);
    p5.rotateZ(rotZ);
    p5.ambientLight(200);
    p5.directionalLight(255, 255, 255, 0.5, 1, 0.2);

    const cubeSize = 120;
    const half = cubeSize / 2;
    const normalOffset = 18;
    const shearOffset = 8;
    const maxLen = 90;
    const scale = maxLen / normalized.maxAbs;

    p5.push();
    p5.stroke(60);
    p5.strokeWeight(1.5);
    p5.fill(255, 255, 255, 120);
    p5.box(cubeSize);
    p5.pop();

    const faceOffset = 0.8;
    const face = (
      pos: [number, number, number],
      rot: [number, number, number],
      color: [number, number, number],
      label: string
    ) => {
      p5.push();
      p5.translate(...pos);
      p5.rotateX(rot[0]);
      p5.rotateY(rot[1]);
      p5.rotateZ(rot[2]);
      p5.noStroke();
      p5.fill(color[0], color[1], color[2], 50);
      p5.plane(cubeSize, cubeSize);
      p5.fill(40);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.textSize(18);
      p5.text(label, 0, 0);
      p5.pop();
    };

    // +X / -X faces (red)
    face([half + faceOffset, 0, 0], [0, Math.PI / 2, 0], [214, 39, 40], "X");
    face([-half - faceOffset, 0, 0], [0, -Math.PI / 2, 0], [214, 39, 40], "X");
    // +Y / -Y faces (green)
    face([0, half + faceOffset, 0], [-Math.PI / 2, 0, 0], [44, 160, 44], "Y");
    face([0, -half - faceOffset, 0], [Math.PI / 2, 0, 0], [44, 160, 44], "Y");
    // +Z / -Z faces (blue)
    face([0, 0, half + faceOffset], [0, 0, 0], [31, 119, 180], "Z");
    face([0, 0, -half - faceOffset], [Math.PI, 0, 0], [31, 119, 180], "Z");

    const blue = [31, 119, 180] as [number, number, number];
    const red = [214, 39, 40] as [number, number, number];
    const yellow = [241, 196, 15] as [number, number, number];

    const sigmaXLen = stress.sigmaX * scale;
    const sigmaYLen = stress.sigmaY * scale;
    const sigmaZLen = stress.sigmaZ * scale;

    const drawNormal = (
      base: [number, number, number],
      dir: [number, number, number],
      value: number
    ) => {
      const len = Math.abs(value);
      const color = value >= 0 ? blue : red;
      const end: [number, number, number] = [
        base[0] + dir[0] * len,
        base[1] + dir[1] * len,
        base[2] + dir[2] * len,
      ];
      if (value >= 0) {
        drawArrow(p5, base, end, color);
      } else {
        drawArrow(p5, end, base, color);
      }
    };

    drawNormal([half + normalOffset, 0, 0], [1, 0, 0], sigmaXLen);
    drawNormal([-half - normalOffset, 0, 0], [-1, 0, 0], sigmaXLen);
    drawNormal([0, half + normalOffset, 0], [0, 1, 0], sigmaYLen);
    drawNormal([0, -half - normalOffset, 0], [0, -1, 0], sigmaYLen);
    drawNormal([0, 0, half + normalOffset], [0, 0, 1], sigmaZLen);
    drawNormal([0, 0, -half - normalOffset], [0, 0, -1], sigmaZLen);

    const labelOffset = 10;
    drawLabel(p5, [half + normalOffset + labelOffset, 0, 0], "σx");
    drawLabel(p5, [-half - normalOffset - labelOffset, 0, 0], "σx");
    drawLabel(p5, [0, half + normalOffset + labelOffset, 0], "σy");
    drawLabel(p5, [0, -half - normalOffset - labelOffset, 0], "σy");
    drawLabel(p5, [0, 0, half + normalOffset + labelOffset], "σz");
    drawLabel(p5, [0, 0, -half - normalOffset - labelOffset], "σz");

    const tauXYLen = stress.tauXY * scale;
    const tauYZLen = stress.tauYZ * scale;
    const tauZXLen = stress.tauZX * scale;

    const drawShear = (
      base: [number, number, number],
      dir: [number, number, number],
      value: number
    ) => {
      const len = Math.abs(value);
      const halfLen = len / 2;
      const start: [number, number, number] = [
        base[0] - dir[0] * halfLen,
        base[1] - dir[1] * halfLen,
        base[2] - dir[2] * halfLen,
      ];
      const end: [number, number, number] = [
        base[0] + dir[0] * halfLen,
        base[1] + dir[1] * halfLen,
        base[2] + dir[2] * halfLen,
      ];
      if (value >= 0) {
        drawArrow(p5, start, end, yellow);
      } else {
        drawArrow(p5, end, start, yellow);
      }
    };

    drawShear([half + shearOffset, 0, 0], [0, 1, 0], tauXYLen);
    drawShear([-half - shearOffset, 0, 0], [0, -1, 0], tauXYLen);
    drawShear([0, half + shearOffset, 0], [0, 0, 1], tauYZLen);
    drawShear([0, -half - shearOffset, 0], [0, 0, -1], tauYZLen);
    drawShear([0, 0, half + shearOffset], [1, 0, 0], tauZXLen);
    drawShear([0, 0, -half - shearOffset], [-1, 0, 0], tauZXLen);

    drawLabel(p5, [half + shearOffset, labelOffset, 0], "τxy");
    drawLabel(p5, [-half - shearOffset, -labelOffset, 0], "τxy");
    drawLabel(p5, [0, half + shearOffset, labelOffset], "τyz");
    drawLabel(p5, [0, -half - shearOffset, -labelOffset], "τyz");
    drawLabel(p5, [labelOffset, 0, half + shearOffset], "τzx");
    drawLabel(p5, [-labelOffset, 0, -half - shearOffset], "τzx");
  };

  const mousePressed = (p5: any) => {
    draggingCanvas = true;
    lastX = p5.mouseX;
    lastY = p5.mouseY;
    lastTime = p5.millis();
  };

  const mouseReleased = () => {
    draggingCanvas = false;
  };

  return <Sketch setup={setup} draw={draw} mousePressed={mousePressed} mouseReleased={mouseReleased} />;
}
