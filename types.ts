
export enum FractalType {
  MANDELBROT = '曼德博集合',
  JULIA = '朱利亚集合',
  BURNING_SHIP = '燃烧船分形',
  TRICORN = '三角分形',
  MULTIBROT = '多阶曼德博',
  NEWTON = '牛顿分形',
  PHOENIX = '凤凰分形',
  LAMBDA = 'Lambda分形'
}

export interface Complex {
  re: number;
  im: number;
}

export interface FractalState {
  type: FractalType;
  zoom: number;
  center: Complex;
  iterations: number;
  juliaConstant: Complex; // Used for Julia and Phoenix
  paletteId: string;
  colorShift: number; // 0 to 1, cycles through palette
  escapeThreshold: number; // Typically 4, but adjustable
  rotation: number; // Degrees 0-360
  exponent: number; // Power for Multibrot (e.g. 2, 3, 4, 5.5)
}

export interface Palette {
  id: string;
  name: string;
  colors: [number, number, number][]; // Array of RGB tuples
}

export interface Viewport {
  width: number;
  height: number;
}
