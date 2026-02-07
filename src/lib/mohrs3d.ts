export type StressState3D = {
  sigmaX: number;
  sigmaY: number;
  sigmaZ: number;
  tauXY: number;
  tauYZ: number;
  tauZX: number;
};

export type PrincipalStresses3D = {
  sigma1: number;
  sigma2: number;
  sigma3: number;
  tauMax: number;
};

const jacobiEigenvalues = (matrix: number[][]) => {
  const a = matrix.map((row) => row.slice());
  const maxIter = 50;
  const eps = 1e-10;

  for (let iter = 0; iter < maxIter; iter += 1) {
    let p = 0;
    let q = 1;
    let max = Math.abs(a[0][1]);
    for (let i = 0; i < 3; i += 1) {
      for (let j = i + 1; j < 3; j += 1) {
        const value = Math.abs(a[i][j]);
        if (value > max) {
          max = value;
          p = i;
          q = j;
        }
      }
    }

    if (max < eps) break;

    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    const theta = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let k = 0; k < 3; k += 1) {
      if (k === p || k === q) continue;
      const aik = a[p][k];
      const akq = a[q][k];
      a[p][k] = c * aik - s * akq;
      a[k][p] = a[p][k];
      a[q][k] = s * aik + c * akq;
      a[k][q] = a[q][k];
    }
  }

  return [a[0][0], a[1][1], a[2][2]];
};

export const getPrincipalStresses3D = ({
  sigmaX,
  sigmaY,
  sigmaZ,
  tauXY,
  tauYZ,
  tauZX,
}: StressState3D): PrincipalStresses3D => {
  const eigenvalues = jacobiEigenvalues([
    [sigmaX, tauXY, tauZX],
    [tauXY, sigmaY, tauYZ],
    [tauZX, tauYZ, sigmaZ],
  ]).sort((a, b) => b - a);

  const [sigma1, sigma2, sigma3] = eigenvalues;
  const tauMax = (sigma1 - sigma3) / 2;

  return { sigma1, sigma2, sigma3, tauMax };
};
