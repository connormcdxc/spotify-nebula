"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { getNebulaData } from "@/lib/spotify";
import { SongOverlay } from "@/components/SongOverlay";
import { Loader2, Music, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const NebulaScene = dynamic(() => import("@/components/NebulaScene").then((mod) => mod.NebulaScene), {
  ssr: false,
});

export default function Home() {
  const { data: session, status } = useSession();
  const [nebulaData, setNebulaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStar, setSelectedStar] = useState<any>(null);

  useEffect(() => {
    if (session?.accessToken) {
      setLoading(true);
      getNebulaData(session.accessToken)
        .then((data) => {
          setNebulaData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={48} className="text-purple-500" />
        </motion.div>
        <p className="mt-4 text-white/60 font-medium tracking-widest uppercase text-xs">Initializing Nebula...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden font-[family-name:var(--font-outfit)]">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,50,1),rgba(0,0,0,1))]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center px-6"
        >
          <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
            <Music size={40} className="text-blue-400" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            SPOTIFY<br />NEBULA
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-md mb-12 leading-relaxed">
            Visualize your musical identity as a generative 3D star system based on audio analysis.
          </p>

          <button
            onClick={() => signIn("spotify")}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-2">
              Connect with Spotify
            </span>
          </button>
        </motion.div>

        <footer className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-xs uppercase tracking-widest flex items-center gap-4">
          <span>Powered by Three.js & Spotify API</span>
        </footer>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black overflow-hidden font-[family-name:var(--font-outfit)]">
      <NebulaScene
        data={nebulaData}
        onSelect={setSelectedStar}
        selectedStar={selectedStar}
      />

      <SongOverlay
        song={selectedStar}
        onClose={() => setSelectedStar(null)}
      />

      <div className="fixed bottom-8 left-8 z-50 pointer-events-none">
        <div className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Spatial Mapping</p>
            <div className="text-[11px] text-white/70 flex gap-4">
              <span><span className="text-white font-bold">X:</span> Mood</span>
              <span><span className="text-white font-bold">Y:</span> Energy</span>
              <span><span className="text-white font-bold">Z:</span> Dance</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Visual Signatures</p>
            <div className="flex flex-col gap-1 text-[11px] text-white/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-pink-500" />
                <span>Color = Valence (Mood)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white scale-75" />
                <div className="w-2 h-2 rounded-full bg-white scale-125" />
                <span>Size = Energy (Intensity)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed top-8 left-8 z-50">
        <div className="flex items-center gap-3 p-2 pr-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
          {session.user?.image ? (
            <img 
              src={session.user.image}
              className="w-10 h-10 rounded-full border border-white/20"
              alt="Profile"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
              <Music size={16} className="text-white/40" />
            </div>
          )}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Commander</p>
            <p className="text-sm font-bold text-white">{session.user?.name}</p>
          </div>
        </div>
      </div>

      <div className="fixed top-8 right-8 z-50">
        <button
          onClick={() => signOut()}
          className="p-3 bg-black/40 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-full transition-all backdrop-blur-xl group"
          title="Disconnect"
        >
          <LogOut size={20} />
        </button>
      </div>

      <AnimatePresence>
        {!selectedStar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none"
          >
            <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-2">Navigation</p>
            <p className="text-white/80 font-medium">Click a star to analyze frequency data</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
