"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Music } from "lucide-react";

interface SongOverlayProps {
  song: any | null;
  onClose: () => void;
}

export function SongOverlay({ song, onClose }: SongOverlayProps) {
  if (!song) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-[50px] left-0 right-0 z-50 px-4 md:px-12 pointer-events-none"
      >
        <div className="max-w-[800px] mx-auto pointer-events-auto relative group">
          {/* Close Button - Floats above the player */}
          <button 
            onClick={onClose}
            className="absolute -top-4 -right-4 z-[60] p-2 bg-black/60 backdrop-blur-xl border border-white/10 text-white/40 hover:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-xl"
          >
            <X size={16} />
          </button>

          <iframe 
            title="Spotify Player"
            src={`https://open.spotify.com/embed/track/${song.id}?utm_source=generator&theme=0`}
            width="100%" 
            height="80" 
            frameBorder="0" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
            className="rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

