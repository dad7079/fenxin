import React, { useRef, useEffect, useState } from 'react';
import { FractalState, Palette } from './types';
import { renderFractal } from './fractalRenderer';

interface FractalCanvasProps {
  state: FractalState;
  palette: Palette;
  onUpdateState: (updates: Partial<FractalState>) => void;
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
}

export const FractalCanvas: React.FC<FractalCanvasProps> = ({ state, palette, onUpdateState, setCanvasRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Refs to hold latest props for the animation loop
  const stateRef = useRef(state);
  const paletteRef = useRef(palette);
  const dimensionsRef = useRef(dimensions);
  
  // Refs for throttle logic
  const lastRenderTimeRef = useRef(0);
  const lastRenderedConfigRef = useRef<{state?: FractalState, palette?: Palette, width?: number}>({});

  // Sync refs with props
  useEffect(() => {
    stateRef.current = state;
    paletteRef.current = palette;
  }, [state, palette]);

  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  // Touch state
  const touchState = useRef<{
    lastX: number;
    lastY: number;
    lastDist: number;
    isDragging: boolean;
    isPinching: boolean;
  }>({
    lastX: 0,
    lastY: 0,
    lastDist: 0,
    isDragging: false,
    isPinching: false,
  });

  // Initialize Canvas Ref for parent
  useEffect(() => {
    setCanvasRef(canvasRef.current);
  }, [setCanvasRef]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Limit DPR to 1.5 for performance on high-res mobile screens
        const dpr = Math.min(window.devicePixelRatio, 1.5); 
        setDimensions({
          width: containerRef.current.clientWidth * dpr,
          height: containerRef.current.clientHeight * dpr,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Optimized Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId: number;
    const TARGET_FPS = 30;
    const INTERVAL = 1000 / TARGET_FPS;

    const renderLoop = (timestamp: number) => {
      const elapsed = timestamp - lastRenderTimeRef.current;

      if (elapsed > INTERVAL) {
        const currentState = stateRef.current;
        const currentPalette = paletteRef.current;
        const currentDims = dimensionsRef.current;

        // Check if anything meaningful changed to avoid re-rendering static scenes unnecessarily
        const configChanged = 
            currentState !== lastRenderedConfigRef.current.state ||
            currentPalette !== lastRenderedConfigRef.current.palette ||
            currentDims.width !== lastRenderedConfigRef.current.width;

        if (configChanged && currentDims.width > 0) {
            renderFractal(ctx, currentDims.width, currentDims.height, currentState, currentPalette);
            
            lastRenderedConfigRef.current = {
                state: currentState,
                palette: currentPalette,
                width: currentDims.width
            };
            lastRenderTimeRef.current = timestamp - (elapsed % INTERVAL);
        }
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(animationId);
  }, []); 


  // --- Touch Event Handlers ---

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchState.current.isDragging = true;
      touchState.current.isPinching = false;
      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      touchState.current.isDragging = false;
      touchState.current.isPinching = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchState.current.lastDist = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchState.current.isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchState.current.lastX;
      const deltaY = e.touches[0].clientY - touchState.current.lastY;

      const shiftRe = deltaX / state.zoom;
      const shiftIm = deltaY / state.zoom;

      // Apply rotation to drag direction so it feels natural
      const rad = (state.rotation * Math.PI) / 180;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      
      // Inverse rotation for control
      const rotShiftRe = shiftRe * cosR + shiftIm * sinR;
      const rotShiftIm = -shiftRe * sinR + shiftIm * cosR;

      onUpdateState({
        center: {
          re: state.center.re - rotShiftRe, 
          im: state.center.im - rotShiftIm,
        }
      });

      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
    } 
    
    else if (touchState.current.isPinching && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);

      const zoomFactor = dist / touchState.current.lastDist;
      
      const newZoom = state.zoom * zoomFactor;

      onUpdateState({ zoom: newZoom });
      touchState.current.lastDist = dist;
    }
  };

  const handleTouchEnd = () => {
    touchState.current.isDragging = false;
    touchState.current.isPinching = false;
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 bg-black touch-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={(e) => {
        touchState.current.isDragging = true;
        touchState.current.lastX = e.clientX;
        touchState.current.lastY = e.clientY;
      }}
      onMouseMove={(e) => {
        if (e.buttons === 1 && touchState.current.isDragging) {
           const deltaX = e.clientX - touchState.current.lastX;
           const deltaY = e.clientY - touchState.current.lastY;
           
           const shiftRe = deltaX / state.zoom;
           const shiftIm = deltaY / state.zoom;

           const rad = (state.rotation * Math.PI) / 180;
           const cosR = Math.cos(rad);
           const sinR = Math.sin(rad);
           const rotShiftRe = shiftRe * cosR + shiftIm * sinR;
           const rotShiftIm = -shiftRe * sinR + shiftIm * cosR;

           onUpdateState({
             center: { re: state.center.re - rotShiftRe, im: state.center.im - rotShiftIm }
           });
           touchState.current.lastX = e.clientX;
           touchState.current.lastY = e.clientY;
        }
      }}
      onMouseUp={() => { touchState.current.isDragging = false; }}
      onWheel={(e) => {
         const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
         onUpdateState({ zoom: state.zoom * zoomFactor });
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block w-full h-full object-cover"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* HUD Info */}
      <div className="absolute top-4 left-4 pointer-events-none text-[10px] text-white/50 font-mono z-10">
        <div>缩放: {state.zoom.toExponential(2)}</div>
        <div>坐标: {state.center.re.toFixed(6)} + {state.center.im.toFixed(6)}i</div>
      </div>
    </div>
  );
};