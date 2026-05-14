const SPOTIFY_ENDPOINT = "https://api.spotify.com/v1";

export async function getTopTracks(accessToken: string) {
  const response = await fetch(`${SPOTIFY_ENDPOINT}/me/top/tracks?limit=50&time_range=medium_term`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top tracks");
  }

  return response.json();
}

// Simple deterministic hash function to generate consistent numbers from a string
function stringToHash(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function getNebulaData(accessToken: string) {
  try {
    const tracks = await getTopTracks(accessToken);

    if (!tracks?.items) return [];

    return tracks.items.map((track: any) => {
      // Generate pseudo-random, consistent features based on the Track ID
      const hash = stringToHash(track.id);
      
      // Normalize values between 0.0 and 1.0 (or appropriate ranges)
      const energy = (hash % 100) / 100;
      const valence = ((hash >> 2) % 100) / 100;
      const danceability = ((hash >> 4) % 100) / 100;
      const tempo = 60 + (hash % 120); // Tempo between 60 and 180 BPM

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
    }).filter(Boolean); // Remove nulls
  } catch (error) {
    console.error("Error fetching nebula data:", error);
    return [];
  }
}

export async function getPlaylistTracks(accessToken: string, playlistId: string) {
  const response = await fetch(`${SPOTIFY_ENDPOINT}/playlists/${playlistId}/tracks?limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch playlist tracks: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

export async function getNebulaDataFromPlaylist(accessToken: string, playlistId: string) {
  try {
    const data = await getPlaylistTracks(accessToken, playlistId);
    
    if (!data?.items) return [];

    return data.items
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
  } catch (error) {
    console.error("Error fetching playlist nebula data:", error);
    return [];
  }
}
