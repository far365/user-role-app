import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle } from "lucide-react";

interface SlideReleaseButtonProps {
  onRelease: () => void;
  disabled?: boolean;
  studentName?: string;
}

export function SlideReleaseButton({ onRelease, disabled = false, studentName }: SlideReleaseButtonProps) {
  const [isSliding, setIsSliding] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReleased, setIsReleased] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const SLIDE_THRESHOLD = 0.8; // 80% of the way across

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || !buttonRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonWidth = buttonRef.current.offsetWidth;
      const maxSlide = containerRect.width - buttonWidth;
      
      const deltaX = e.clientX - startXRef.current;
      const newPosition = Math.max(0, Math.min(maxSlide, currentXRef.current + deltaX));
      
      setSlidePosition(newPosition);
      
      // Check if we've reached the threshold
      const progress = newPosition / maxSlide;
      if (progress >= SLIDE_THRESHOLD && !isReleased) {
        setIsReleased(true);
        setIsDragging(false);
        onRelease();
        
        // Reset after a short delay
        setTimeout(() => {
          setSlidePosition(0);
          setIsReleased(false);
          setIsSliding(false);
        }, 1000);
      }
    };

    const handleMouseUp = () => {
      if (isDragging && !isReleased) {
        // Snap back to start if not released
        setSlidePosition(0);
        setIsDragging(false);
        setIsSliding(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isReleased, onRelease]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isReleased) return;
    
    setIsDragging(true);
    setIsSliding(true);
    startXRef.current = e.clientX;
    currentXRef.current = slidePosition;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isReleased) return;
    
    setIsDragging(true);
    setIsSliding(true);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = slidePosition;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || !buttonRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const buttonWidth = buttonRef.current.offsetWidth;
    const maxSlide = containerRect.width - buttonWidth;
    
    const deltaX = e.touches[0].clientX - startXRef.current;
    const newPosition = Math.max(0, Math.min(maxSlide, currentXRef.current + deltaX));
    
    setSlidePosition(newPosition);
    
    // Check if we've reached the threshold
    const progress = newPosition / maxSlide;
    if (progress >= SLIDE_THRESHOLD && !isReleased) {
      setIsReleased(true);
      setIsDragging(false);
      onRelease();
      
      // Reset after a short delay
      setTimeout(() => {
        setSlidePosition(0);
        setIsReleased(false);
        setIsSliding(false);
      }, 1000);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && !isReleased) {
      // Snap back to start if not released
      setSlidePosition(0);
      setIsDragging(false);
      setIsSliding(false);
    }
  };

  const getBackgroundGradient = () => {
    if (isReleased) {
      return "bg-green-500";
    }
    
    if (!containerRef.current || !buttonRef.current) {
      return "bg-green-100";
    }
    
    const containerWidth = containerRef.current.offsetWidth;
    const buttonWidth = buttonRef.current.offsetWidth;
    const maxSlide = containerWidth - buttonWidth;
    const progress = slidePosition / maxSlide;
    
    if (progress >= SLIDE_THRESHOLD) {
      return "bg-green-400";
    } else if (progress > 0.5) {
      return "bg-green-300";
    } else if (progress > 0.2) {
      return "bg-green-200";
    } else {
      return "bg-green-100";
    }
  };

  return (
    <div className="w-full max-w-48">
      <div
        ref={containerRef}
        className={`relative h-8 rounded-full border-2 border-green-300 overflow-hidden transition-all duration-200 ${getBackgroundGradient()}`}
      >
        {/* Background text */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-green-700 select-none">
          {isReleased ? "Released!" : "Slide to Release"}
        </div>
        
        {/* Sliding button */}
        <Button
          ref={buttonRef}
          className={`absolute top-0 left-0 h-full w-12 rounded-full bg-white border-2 border-green-400 shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 ${
            isDragging ? 'scale-105' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            transform: `translateX(${slidePosition}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          disabled={disabled}
        >
          {isReleased ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-green-600" />
          )}
        </Button>
      </div>
    </div>
  );
}
