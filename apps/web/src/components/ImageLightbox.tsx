import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { X, Download, Share, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface MediaViewerProps {
  url?: string;
  images?: { url: string; type?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageLightbox({ url, images, initialIndex = 0, onClose }: MediaViewerProps) {
  const gallery = images && images.length > 0;
  const [index, setIndex] = useState(initialIndex);
  
  const currentMedia = gallery ? images![index] : { url: url!, type: url!.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image' };
  const total = gallery ? images!.length : 1;

  // Controls overlay visibility
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [index, resetControlsTimeout]);

  const goPrev = useCallback(() => {
    if (gallery) setIndex((i) => (i > 0 ? i - 1 : total - 1));
  }, [gallery, total]);

  const goNext = useCallback(() => {
    if (gallery) setIndex((i) => (i < total - 1 ? i + 1 : 0));
  }, [gallery, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, goPrev, goNext]);

  // Framer Motion Drag handling for swipe-to-dismiss and swipe-to-navigate
  const controls = useAnimation();
  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    
    // Swipe down to close
    if (info.offset.y > swipeThreshold || info.offset.y < -swipeThreshold) {
      await controls.start({ y: info.offset.y > 0 ? window.innerHeight : -window.innerHeight, opacity: 0 });
      onClose();
    } 
    // Swipe left/right
    else if (info.offset.x > swipeThreshold) {
      goPrev();
      controls.start({ x: 0, y: 0 });
    } else if (info.offset.x < -swipeThreshold) {
      goNext();
      controls.start({ x: 0, y: 0 });
    } else {
      controls.start({ x: 0, y: 0 });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: currentMedia.url });
      } catch (e) {
        console.error('Error sharing', e);
      }
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overscroll-none touch-none select-none"
      onClick={resetControlsTimeout}
    >
      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent"
          >
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors">
                <X size={24} />
              </button>
              {gallery && total > 1 && (
                <span className="text-sm font-medium text-white shadow-sm">{index + 1} из {total}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {typeof navigator.share === 'function' && (
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                  <Share size={20} />
                </button>
              )}
              <a href={currentMedia.url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                <Download size={20} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={index} // Force re-render on index change
        className="w-full h-full flex items-center justify-center"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ opacity: 0, scale: 0.95 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {currentMedia.type === 'video' ? (
          <VideoPlayer url={currentMedia.url} showControls={showControls} onToggleControls={resetControlsTimeout} />
        ) : (
          <img
            src={currentMedia.url}
            alt="media"
            className="max-w-full max-h-full object-contain pointer-events-none"
          />
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

// Custom built video player to mimic Instagram/TikTok aesthetics
function VideoPlayer({ url, showControls, onToggleControls }: { url: string; showControls: boolean; onToggleControls: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      onToggleControls();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      onToggleControls();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
      setProgress(val);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={url}
        autoPlay
        playsInline
        loop
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        className="max-w-full max-h-full object-contain"
      />
      
      <AnimatePresence>
        {!isPlaying && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <Play size={36} fill="currentColor" className="ml-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-4"
          >
            <div className="flex items-center gap-4 w-full">
              <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              
              {/* Custom Timeline */}
              <div className="flex-1 relative group h-2 cursor-pointer flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress || 0}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                </div>
                {/* Thumb */}
                <div className="absolute h-3 w-3 bg-white rounded-full shadow transition-all duration-100 ease-linear -ml-1.5 opacity-0 group-hover:opacity-100" style={{ left: `${progress}%` }} />
              </div>

              <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
