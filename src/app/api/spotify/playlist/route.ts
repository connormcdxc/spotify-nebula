import { NextResponse } from "next/server";
import { getPlaylistTracks, stringToHash } from "@/lib/spotify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("playlistId");

    if (!playlistId) {
      return NextResponse.json({ error: "Missing playlistId" }, { status: 400 });
    }

    // 1. Get Client Credentials Token
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Missing Spotify credentials" }, { status: 500 });
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error || "Failed to get access token");
    }

    const token = tokenData.access_token;

    // 2. Fetch Playlist Tracks
    const data = await getPlaylistTracks(token, playlistId);
    
    if (!data?.items) {
      return NextResponse.json({ data: [] });
    }

    // 3. Format for Nebula
    const nebulaData = data.items
      .filter((item: any) => item.track)
      .map((item: any) => {
        const track = item.track;
        const hash = stringToHash(track.id);
        
        const energy = (hash % 100) / 100;
        const valence = ((hash >> 2) % 100) / 100;
        const danceability = ((hash >> 4) % 100) / 100;
        const tempo = 60 + (hash % 120);

        return {
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || "Unknown Artist",
          albumArt: track.album.images[0]?.url || "",
          previewUrl: track.preview_url,
          externalUrl: track.external_urls.spotify,
          energy,
          valence,
          tempo,
          danceability,
        };
      });

    return NextResponse.json({ data: nebulaData });
  } catch (error: any) {
    console.error("Playlist API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
