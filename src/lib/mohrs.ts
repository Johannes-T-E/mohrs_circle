export type StressState = {
  sigmaX: number;
  sigmaY: number;
  tauXY: number;
};

export type MohrsCircle = {
  center: number;
  radius: number;
  sigma1: number;
  sigma2: number;
  tauMax: number;
};

export const degToRad = (deg: number) => (deg * Math.PI) / 180;
export const radToDeg = (rad: number) => (rad * 180) / Math.PI;

export const getMohrsCircle = ({ sigmaX, sigmaY, tauXY }: StressState): MohrsCircle => {
  const center = (sigmaX + sigmaY) / 2;
  const halfDiff = (sigmaX - sigmaY) / 2;
  const radius = Math.hypot(halfDiff, tauXY);
  return {
    center,
    radius,
    sigma1: center + radius,
    sigma2: center - radius,
    tauMax: radius,
  };
};

export const transformStress = (
  { sigmaX, sigmaY, tauXY }: StressState,
  angleDeg: number
) => {
  const angleRad = degToRad(angleDeg);
  const cos2 = Math.cos(2 * angleRad);
  const sin2 = Math.sin(2 * angleRad);
  const avg = (sigmaX + sigmaY) / 2;
  const halfDiff = (sigmaX - sigmaY) / 2;

  const sigmaXPrime = avg + halfDiff * cos2 + tauXY * sin2;
  const sigmaYPrime = avg - halfDiff * cos2 - tauXY * sin2;
  const tauXYPrime = -halfDiff * sin2 + tauXY * cos2;

  return { sigmaXPrime, sigmaYPrime, tauXYPrime };
};

export const getPrincipalAngleDeg = (stress: StressState) => {
  const { sigmaX, sigmaY, tauXY } = stress;
  const baseAngleRad = 0.5 * Math.atan2(2 * tauXY, sigmaX - sigmaY);
  const baseAngleDeg = radToDeg(baseAngleRad);
  const altAngleDeg = baseAngleDeg + 90;

  const base = transformStress(stress, baseAngleDeg).sigmaXPrime;
  const alt = transformStress(stress, altAngleDeg).sigmaXPrime;
  return alt > base ? altAngleDeg : baseAngleDeg;
};

export const getMaxShearAngleDeg = (stress: StressState) => {
  const principalAngle = getPrincipalAngleDeg(stress);
  const shear1 = principalAngle + 45;
  const shear2 = principalAngle - 45;
  const tau1 = transformStress(stress, shear1).tauXYPrime;
  const tau2 = transformStress(stress, shear2).tauXYPrime;

  if (Math.abs(tau1) > Math.abs(tau2)) return shear1;
  if (Math.abs(tau2) > Math.abs(tau1)) return shear2;
  return tau1 >= 0 ? shear1 : shear2;
};
