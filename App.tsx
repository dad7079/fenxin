import React, { useState, useCallback, useMemo } from 'react';
import { FractalState, Palette } from './types';
import { DEFAULT_FRACTAL_STATE, PALETTES } from './constants';
import { FractalCanvas } from './FractalCanvas';
import { ControlPanel } from './ControlPanel';
import { renderFractal } from './fractalRenderer';

export default function App() {
  const [fractalState, setFractalState] = useState<FractalState>(DEFAULT_FRACTAL_STATE);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activePalette = useMemo(() => 
    PALETTES.find(p => p.id === fractalState.paletteId) || PALETTES[0],
  [fractalState.paletteId]);

  const updateState = useCallback((updates: Partial<FractalState>) => {
    setFractalState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSaveImage = async () => {
    if (!canvasRef) return;
    setIsSaving(true);

    // Give the UI a moment to show the loading spinner before blocking main thread
    setTimeout(() => {
      try {
        // Create a temporary high-res canvas
        const exportWidth = canvasRef.width * 2; // 2x resolution
        const exportHeight = canvasRef.height * 2;
        
        const offlineCanvas = document.createElement('canvas');
        offlineCanvas.width = exportWidth;
        offlineCanvas.height = exportHeight;
        const ctx = offlineCanvas.getContext('2d');

        if (ctx) {
          // Render at high resolution with possibly higher iterations for crispness
          const highResState = {
            ...fractalState,
            zoom: fractalState.zoom * 2, // Adjust zoom for the larger canvas
          };

          renderFractal(ctx, exportWidth, exportHeight, highResState, activePalette);

          // Convert to blob and download
          offlineCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `分形图像_${Date.now()}.png`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
            setIsSaving(false);
          }, 'image/png');
        }
      } catch (e) {
        console.error("Save failed", e);
        setIsSaving(false);
      }
    }, 100);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <FractalCanvas 
        state={fractalState} 
        palette={activePalette} 
        onUpdateState={updateState}
        setCanvasRef={setCanvasRef}
      />
      
      <ControlPanel 
        state={fractalState} 
        updateState={updateState} 
        onSave={handleSaveImage}
        isSaving={isSaving}
      />
    </div>
  );
}