
import { Palette, FractalType, FractalState } from './types';

export const DEFAULT_FRACTAL_STATE: FractalState = {
  type: FractalType.MANDELBROT,
  zoom: 150, // Higher means more zoomed in (pixels per unit)
  center: { re: -0.5, im: 0 },
  iterations: 64,
  juliaConstant: { re: -0.4, im: 0.6 },
  paletteId: 'electric',
  colorShift: 0,
  escapeThreshold: 4,
  rotation: 0,
  exponent: 3,
};

export const PALETTES: Palette[] = [
  {
    id: 'electric',
    name: '电子蓝',
    colors: [
      [0, 7, 100],
      [32, 107, 203],
      [237, 255, 255],
      [255, 170, 0],
      [0, 2, 0],
    ],
  },
  {
    id: 'fire',
    name: '地狱火',
    colors: [
      [0, 0, 0],
      [60, 10, 0],
      [200, 100, 0],
      [255, 200, 50],
      [255, 255, 200],
    ],
  },
  {
    id: 'psych',
    name: '迷幻紫',
    colors: [
      [50, 0, 100],
      [0, 200, 200],
      [200, 0, 200],
      [255, 255, 0],
      [20, 0, 50],
    ],
  },
  {
    id: 'greyscale',
    name: '深邃灰',
    colors: [
      [0, 0, 0],
      [50, 50, 50],
      [150, 150, 150],
      [255, 255, 255],
      [20, 20, 20],
    ],
  },
  {
    id: 'rainbow',
    name: '全光谱',
    colors: [
      [255, 0, 0],
      [255, 255, 0],
      [0, 255, 0],
      [0, 255, 255],
      [0, 0, 255],
      [255, 0, 255],
    ],
  },
];
