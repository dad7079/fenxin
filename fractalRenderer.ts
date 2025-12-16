import { FractalState, FractalType, Palette } from './types';

/**
 * Maps an iteration count to an RGB color based on the selected palette and shift.
 */
const getColor = (n: number, maxIter: number, palette: Palette, shift: number): [number, number, number] => {
  if (n === maxIter) return [0, 0, 0]; // Inside the set/roots usually black or defined color

  // Normalized iteration count 0..1
  let t = n / maxIter;
  
  // Apply Color Shift
  t = (t + shift) % 1.0;

  const len = palette.colors.length;
  // Cycle through palette based on t
  // Use a cycle factor to make gradients repeat for more detail
  const cycleFactor = 2; 
  const scaledT = t * (len - 1) * cycleFactor; 
  
  // Wrap index logic to ensure smooth cycling
  let index = Math.floor(scaledT);
  const fraction = scaledT - index;
  
  index = index % len;
  const nextIndex = (index + 1) % len;

  const c1 = palette.colors[index];
  const c2 = palette.colors[nextIndex];

  // Linear interpolation
  const r = c1[0] + (c2[0] - c1[0]) * fraction;
  const g = c1[1] + (c2[1] - c1[1]) * fraction;
  const b = c1[2] + (c2[2] - c1[2]) * fraction;

  return [r, g, b];
};

/**
 * Renders the fractal to an ImageData object.
 * This runs on the main thread but is optimized for speed.
 */
export const renderFractal = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: FractalState,
  palette: Palette
) => {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  const { type, zoom, center, iterations, juliaConstant, colorShift, escapeThreshold, rotation, exponent } = state;
  const maxIter = iterations;
  
  // For Phoenix and Julia
  const paramRe = juliaConstant.re;
  const paramIm = juliaConstant.im;

  const w2 = width / 2;
  const h2 = height / 2;
  const scale = 1 / zoom; 
  
  // Pre-calculate squared threshold for standard escape time
  const thresholdSq = escapeThreshold * escapeThreshold;

  // Pre-calculate rotation params
  const rad = (rotation * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  // Newton constants (Roots of z^3 - 1)
  const rootTolerance = 0.001;

  for (let y = 0; y < height; y++) {
    // Standard coordinates relative to screen center
    const yOff = (y - h2) * scale;
    
    for (let x = 0; x < width; x++) {
      const xOff = (x - w2) * scale;

      // Apply rotation
      const rotX = xOff * cosR - yOff * sinR;
      const rotY = xOff * sinR + yOff * cosR;

      // Map to complex plane with center offset
      const cRe0 = rotX + center.re;
      const cIm0 = rotY + center.im;

      let zRe = 0;
      let zIm = 0;
      let cRe = 0;
      let cIm = 0;
      
      // Variables for Phoenix (requires z_prev)
      let zPrevRe = 0;
      let zPrevIm = 0;

      // Initialization
      if (type === FractalType.JULIA) {
        zRe = cRe0;
        zIm = cIm0;
        cRe = paramRe;
        cIm = paramIm;
      } else if (type === FractalType.PHOENIX) {
        // Phoenix: z_n+1 = z_n^2 + Re(c) + Im(c)*z_n-1
        zRe = cIm0; 
        zIm = cRe0;
        zPrevRe = 0;
        zPrevIm = 0;
      } else if (type === FractalType.NEWTON) {
        zRe = cRe0;
        zIm = cIm0;
      } else if (type === FractalType.BURNING_SHIP) {
        zRe = 0;
        zIm = 0;
        cRe = cRe0;
        cIm = -cIm0; // Flip Y for standard burning ship view
      } else if (type === FractalType.LAMBDA) {
        // Logistic map: z = c * z * (1 - z)
        // Critical point starts at 0.5
        zRe = 0.5;
        zIm = 0;
        cRe = cRe0;
        cIm = cIm0;
      } else {
        // Mandelbrot, Tricorn, Multibrots
        zRe = 0;
        zIm = 0;
        cRe = cRe0;
        cIm = cIm0;
      }

      let n = 0;
      let zRe2 = zRe * zRe;
      let zIm2 = zIm * zIm;

      // --- Iteration Loops ---

      if (type === FractalType.NEWTON) {
         // Newton method for z^3 - 1 = 0
         while (n < maxIter) {
            // Check convergence to any of 3 roots approx
            const d1 = (zRe - 1)*(zRe - 1) + zIm*zIm;
            if (d1 < rootTolerance) break;
            const d2 = (zRe + 0.5)*(zRe + 0.5) + (zIm - 0.866025)*(zIm - 0.866025);
            if (d2 < rootTolerance) break;
            const d3 = (zRe + 0.5)*(zRe + 0.5) + (zIm + 0.866025)*(zIm + 0.866025);
            if (d3 < rootTolerance) break;

            const dRe = 3 * (zRe2 - zIm2);
            const dIm = 6 * zRe * zIm;
            const denomNorm = dRe*dRe + dIm*dIm;
            
            if (denomNorm === 0) break;

            const z3Re = zRe * (zRe2 - 3 * zIm2);
            const z3Im = zIm * (3 * zRe2 - zIm2);
            
            const numRe = 2 * z3Re + 1;
            const numIm = 2 * z3Im;

            const nextRe = (numRe * dRe + numIm * dIm) / denomNorm;
            const nextIm = (numIm * dRe - numRe * dIm) / denomNorm;

            zRe = nextRe;
            zIm = nextIm;
            zRe2 = zRe * zRe;
            zIm2 = zIm * zIm;
            n++;
         }

      } else if (type === FractalType.PHOENIX) {
         while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
            const zNextRe = zRe2 - zIm2 + paramRe + paramIm * zPrevRe;
            const zNextIm = 2 * zRe * zIm + paramIm * zPrevIm;
            
            zPrevRe = zRe;
            zPrevIm = zIm;
            zRe = zNextRe;
            zIm = zNextIm;
            
            zRe2 = zRe * zRe;
            zIm2 = zIm * zIm;
            n++;
         }
      } else if (type === FractalType.BURNING_SHIP) {
          while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
            zIm = Math.abs(2 * zRe * zIm) + cIm;
            zRe = Math.abs(zRe2 - zIm2 + cRe);
            zRe2 = zRe * zRe;
            zIm2 = zIm * zIm;
            n++;
          }
      } else if (type === FractalType.TRICORN) {
          while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
            zIm = -2 * zRe * zIm + cIm;
            zRe = zRe2 - zIm2 + cRe;
            zRe2 = zRe * zRe;
            zIm2 = zIm * zIm;
            n++;
          }
      } else if (type === FractalType.LAMBDA) {
          // Z = C * Z * (1 - Z)
          // 1 - Z = (1 - x) - iy
          // Z * (1 - Z) = (x + iy) * ((1-x) - iy)
          // = x(1-x) - x(iy) + iy(1-x) - i^2 y^2
          // = x - x^2 - ixy + iy - ixy + y^2
          // = (x - x^2 + y^2) + i(y - 2xy)
          while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
            const termRe = zRe - zRe2 + zIm2;
            const termIm = zIm - 2 * zRe * zIm;
            
            // Multiply by C
            const newRe = cRe * termRe - cIm * termIm;
            const newIm = cRe * termIm + cIm * termRe;
            
            zRe = newRe;
            zIm = newIm;
            zRe2 = zRe * zRe;
            zIm2 = zIm * zIm;
            n++;
          }
      } else if (type === FractalType.MULTIBROT) {
          // Generic Multibrot: Z = Z^exponent + C
          // Optimized for integer powers 3 and 4, generic for others
          const isInt = Math.floor(exponent) === exponent;
          
          if (isInt && exponent === 3) {
             while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
                const newRe = zRe * (zRe2 - 3 * zIm2) + cRe;
                const newIm = zIm * (3 * zRe2 - zIm2) + cIm;
                zRe = newRe;
                zIm = newIm;
                zRe2 = zRe * zRe;
                zIm2 = zIm * zIm;
                n++;
             }
          } else if (isInt && exponent === 4) {
             while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
                const newRe = zRe2 * zRe2 - 6 * zRe2 * zIm2 + zIm2 * zIm2 + cRe;
                const newIm = 4 * zRe * zIm * (zRe2 - zIm2) + cIm;
                zRe = newRe;
                zIm = newIm;
                zRe2 = zRe * zRe;
                zIm2 = zIm * zIm;
                n++;
             }
          } else {
             // Generic power using polar coordinates: r^d * e^(i*d*phi)
             while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
                const r = Math.sqrt(zRe2 + zIm2);
                const phi = Math.atan2(zIm, zRe);
                const rPow = Math.pow(r, exponent);
                const phiMul = phi * exponent;
                
                zRe = rPow * Math.cos(phiMul) + cRe;
                zIm = rPow * Math.sin(phiMul) + cIm;
                zRe2 = zRe * zRe;
                zIm2 = zIm * zIm;
                n++;
             }
          }
      } else {
          // Default Mandelbrot / Julia (Power 2)
          while (zRe2 + zIm2 <= thresholdSq && n < maxIter) {
            zIm = 2 * zRe * zIm + cIm;
            zRe = zRe2 - zIm2 + cRe;
            zRe2 = zRe * zRe;
            zIm2 = zIm * zIm;
            n++;
          }
      }

      const [r, g, b] = getColor(n, maxIter, palette, colorShift);
      
      const pixelIndex = (y * width + x) * 4;
      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255; 
    }
  }

  ctx.putImageData(imageData, 0, 0);
};