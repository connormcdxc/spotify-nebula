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
  const [playlistUrl, setPlaylistUrl] = useState("");

  const fetchData = async (url?: string) => {
    setLoading(true);
    try {
      let data;
      
      if (url) {
        // Robust ID extraction
        let playlistId = "";
        if (url.includes("playlist/")) {
          playlistId = url.split("playlist/")[1]?.split("?")[0];
        } else if (url.includes("spotify:playlist:")) {
          playlistId = url.split("spotify:playlist:")[1];
        } else if (!url.includes("/") && url.length > 10) {
          playlistId = url;
        }

        if (playlistId) {
          // Use our new server-side proxy
          const res = await fetch(`/api/spotify/playlist?playlistId=${playlistId}`);
          const result = await res.json();
          if (result.error) throw new Error(result.error);
          data = result.data;
        } else {
          alert("Invalid Spotify Playlist URL. Please copy it from the 'Share' menu in Spotify.");
          setLoading(false);
          return;
        }
      } else if (session?.accessToken) {
        // Only fetch top tracks if we have a session
        const { getNebulaData } = await import("@/lib/spotify");
        data = await getNebulaData(session.accessToken);
      }
      
      if (data && data.length > 0) {
        setNebulaData(data);
      } else {
        alert("No tracks found in this playlist. Make sure it's a public playlist with tracks.");
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      if (error.message?.includes("403")) {
        alert("🔒 Access Denied (403): This playlist appears to be private. The anonymous viewer can only see Public playlists.");
      } else {
        alert(`Error: ${error.message || "Failed to fetch galaxy data"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only auto-fetch top tracks if we are authenticated and haven't fetched anything yet
    if (status === "authenticated" && session?.accessToken && nebulaData.length === 0) {
      fetchData();
    }
  }, [status, session]);

  const handlePlaylistSubmit = (e: React.FormEvent) => {
    console.log("Form submitted, preventing default...");
    e.preventDefault();
    e.stopPropagation();
    if (playlistUrl) {
      fetchData(playlistUrl);
    }
  };

  // If loading or we have data to show, render the scene view
  if (status === "loading" || loading || nebulaData.length > 0) {
    return (
      <main className="relative min-h-screen bg-black overflow-hidden font-[family-name:var(--font-outfit)]">
        {loading && nebulaData.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={48} className="text-purple-500" />
            </motion.div>
            <p className="mt-4 text-white-60 font-medium tracking-widest uppercase text-xs">Initializing Nebula...</p>
          </div>
        ) : (
          <>
            <NebulaScene
              data={nebulaData}
              onSelect={setSelectedStar}
              selectedStar={selectedStar}
            />

            <SongOverlay
              song={selectedStar}
              onClose={() => setSelectedStar(null)}
            />

            {/* UI Overlays */}
            <div className="fixed bottom-8 left-8 z-50 pointer-events-none">
              <div className="p-4 bg-black-40 backdrop-blur-xl border border-white-10 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <p className="text-tiny uppercase tracking-loose text-white-40 font-bold">Spatial Mapping</p>
                  <div className="text-small text-white-70 flex gap-4">
                    <span><span className="text-white font-bold">X:</span> Mood</span>
                    <span><span className="text-white font-bold">Y:</span> Energy</span>
                    <span><span className="text-white font-bold">Z:</span> Dance</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-tiny uppercase tracking-loose text-white-40 font-bold">Visual Signatures</p>
                  <div className="flex flex-col gap-1 text-small text-white-70">
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

            <div className="fixed top-8 left-50 -translate-x-50 z-50 w-full max-w-md px-4 pointer-events-auto">
              <form 
                onSubmit={handlePlaylistSubmit}
                className="flex items-center gap-2 p-1.5 bg-black-40 backdrop-blur-xl border border-white-10 rounded-full focus-within:border-white-20 transition-colors"
              >
                <input
                  type="text"
                  placeholder="Paste Spotify Playlist URL..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (playlistUrl) fetchData(playlistUrl);
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm text-white placeholder:text-white-20"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (playlistUrl) fetchData(playlistUrl);
                  }}
                  className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-white-80 transition-colors uppercase tracking-widest"
                >
                  Analyze
                </button>
              </form>
            </div>

            {session && (
              <div className="fixed top-8 left-8 z-50">
                <div className="flex items-center gap-3 p-2 pr-6 bg-black-40 backdrop-blur-xl border border-white-10 rounded-full">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image}
                      className="w-10 h-10 rounded-full border border-white-20"
                      alt="Profile"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-white-20 bg-white-5 flex items-center justify-center">
                      <Music size={16} className="text-white-40" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-white-40 uppercase tracking-widest font-bold">Commander</p>
                    <p className="text-sm font-bold text-white">{session.user?.name}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="fixed top-8 right-8 z-50">
              {session ? (
                <button
                  onClick={() => signOut()}
                  className="p-3 bg-black-40 hover:bg-red-500-20 hover:text-red-400 border border-white-10 rounded-full transition-all backdrop-blur-xl group"
                  title="Disconnect"
                >
                  <LogOut size={20} />
                </button>
              ) : (
                <button
                  onClick={() => signIn("spotify")}
                  className="px-6 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-white-80 transition-all uppercase tracking-widest"
                >
                  Connect
                </button>
              )}
            </div>

            <AnimatePresence>
              {!selectedStar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-12 left-50 -translate-x-50 z-50 text-center pointer-events-none"
                >
                  <p className="text-white-40 text-xs uppercase tracking-[0.3em] mb-2">Navigation</p>
                  <p className="text-white-80 font-medium">Click a star to analyze frequency data</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Back to Home button for anonymous users */}
            {nebulaData.length > 0 && !session && (
               <button
                 onClick={() => {
                   setNebulaData([]);
                   setPlaylistUrl("");
                 }}
                 className="fixed bottom-8 right-8 z-50 px-4 py-2 bg-black-40 backdrop-blur-xl border border-white-10 text-white-40 hover:text-white text-[10px] uppercase tracking-widest rounded-full transition-all"
               >
                 Back to Core
               </button>
            )}
          </>
        )}
      </main>
    );
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden font-[family-name:var(--font-outfit)]">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,50,1),rgba(0,0,0,1))]" />
        <div className="absolute top-1/2 left-50 -translate-x-50 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500-10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-2xl"
      >
        <div className="mb-8 p-4 bg-white-5 border border-white-10 rounded-full backdrop-blur-xl">
          <Music size={40} className="text-blue-400" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter bg-gradient-to-b from-white to-white-40 bg-clip-text text-transparent leading-tight">
          SPOTIFY<br />NEBULA
        </h1>

        <p className="text-lg md:text-xl text-white-50 max-w-md mb-12 leading-relaxed">
          Visualize any Spotify playlist or your own musical identity as a generative 3D star system.
        </p>

        {/* Home Screen Actions */}
        <div className="flex flex-col gap-8 w-full items-center">
          {/* Playlist Input Bar */}
          <form 
            onSubmit={handlePlaylistSubmit}
            className="w-full flex items-center gap-2 p-1.5 bg-white-5 backdrop-blur-xl border border-white-10 rounded-full focus-within:border-white-20 transition-all shadow-2xl"
          >
            <input
              type="text"
              placeholder="Paste Spotify Playlist URL to begin..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (playlistUrl) fetchData(playlistUrl);
                }
              }}
              className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-white placeholder:text-white-20"
            />
            <button
              type="button"
              onClick={() => {
                if (playlistUrl) fetchData(playlistUrl);
              }}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white-80 transition-colors uppercase tracking-widest text-xs"
            >
              Visualize
            </button>
          </form>

          <div className="flex items-center gap-4 w-full max-w-sm">
            <div className="h-px flex-1 bg-white-10" />
            <span className="text-white-20 text-[10px] uppercase tracking-[0.3em] font-bold">OR</span>
            <div className="h-px flex-1 bg-white-10" />
          </div>

          <button
            onClick={() => signIn("spotify")}
            className="group relative px-8 py-4 bg-transparent border border-white-20 text-white font-bold rounded-full overflow-hidden transition-all hover:bg-white hover:text-black"
          >
            <span className="relative z-10 flex items-center gap-2">
              Connect Your Identity
            </span>
          </button>
        </div>
      </motion.div>

      <footer className="absolute bottom-8 left-50 -translate-x-50 text-white-20 text-xs uppercase tracking-widest flex items-center gap-4">
        <span>Powered by Three.js & Spotify API</span>
      </footer>
    </main>
  );
}
