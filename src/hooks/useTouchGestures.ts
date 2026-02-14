/**
 * useTouchGestures Hook
 * Custom hook for handling touch gestures (pan, pinch zoom, tap, double tap)
 */

import { useCallback, useRef, useState } from 'react';

export interface TouchGestureState {
  isPanning: boolean;
  isPinching: boolean;
  scale: number;
  translateX: number;
  translateY: number;
}

export interface TouchGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
}

export function useTouchGestures(options?: {
  onPan?: (deltaX: number, deltaY: number) => void;
  onPinch?: (scale: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  minScale?: number;
  maxScale?: number;
  /** Current zoom/scale from store - used as base for pinch so gestures stay in sync */
  initialScale?: number;
}) {
  const {
    onPan,
    onPinch,
    onTap,
    onDoubleTap,
    minScale = 0.5,
    maxScale = 3,
    initialScale = 1,
  } = options || {};

  const [gestureState, setGestureState] = useState<TouchGestureState>({
    isPanning: false,
    isPinching: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(1);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const touches = e.touches;

    if (touches.length === 1) {
      // Single touch - potential tap or pan
      const touch = touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
      };

      // Check for double tap
      if (lastTapRef.current) {
        const timeDiff = now - lastTapRef.current.time;
        const distX = Math.abs(touch.clientX - lastTapRef.current.x);
        const distY = Math.abs(touch.clientY - lastTapRef.current.y);
        
        if (timeDiff < 300 && distX < 20 && distY < 20) {
          // Double tap detected
          onDoubleTap?.(touch.clientX, touch.clientY);
          lastTapRef.current = null;
          touchStartRef.current = null;
          return;
        }
      }

      setGestureState(prev => ({
        ...prev,
        isPanning: true,
      }));
    } else if (touches.length === 2) {
      // Two touches - pinch zoom (use initialScale from store so pinch stays in sync)
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      lastTouchDistanceRef.current = distance;
      initialPinchScaleRef.current = initialScale;
      
      setGestureState(prev => ({
        ...prev,
        isPinching: true,
        isPanning: false,
      }));
    }
  }, [onDoubleTap, initialScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    
    const touches = e.touches;

    if (touches.length === 1 && gestureState.isPanning && touchStartRef.current) {
      // Panning
      const touch = touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      onPan?.(deltaX, deltaY);
      
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: touchStartRef.current.time,
      };
    } else if (touches.length === 2 && gestureState.isPinching && lastTouchDistanceRef.current !== null) {
      // Pinch zoom
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scaleChange = distance / lastTouchDistanceRef.current;
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, initialPinchScaleRef.current * scaleChange)
      );
      
      onPinch?.(newScale);
      
      setGestureState(prev => ({
        ...prev,
        scale: newScale,
      }));
    }
  }, [gestureState.isPanning, gestureState.isPinching, onPan, onPinch, minScale, maxScale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    
    if (touchStartRef.current && e.touches.length === 0) {
      const timeDiff = now - touchStartRef.current.time;
      
      // If touch was very short and didn't move much, treat as tap
      if (timeDiff < 200) {
        onTap?.(touchStartRef.current.x, touchStartRef.current.y);
        lastTapRef.current = {
          x: touchStartRef.current.x,
          y: touchStartRef.current.y,
          time: now,
        };
      }
    }

    setGestureState(prev => ({
      ...prev,
      isPanning: false,
      isPinching: false,
    }));
    
    touchStartRef.current = null;
    lastTouchDistanceRef.current = null;
  }, [onTap]);

  const handleTouchCancel = useCallback(() => {
    setGestureState(prev => ({
      ...prev,
      isPanning: false,
      isPinching: false,
    }));
    
    touchStartRef.current = null;
    lastTouchDistanceRef.current = null;
  }, []);

  const handlers: TouchGestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };

  return {
    gestureState,
    handlers,
  };
}
