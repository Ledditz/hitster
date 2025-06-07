import React, { useEffect, useState } from 'react';
import { PlayControls } from './PlayControls';
import { useSpotifyContext } from './SongContext';
import { checkSpotifyAuth } from './spotifyUtils';
import type { Dispatch, SetStateAction } from 'react';

interface PlaylistModeProps {
  setMode: (mode: 'qr' | 'playlist' | null) => void;
  logOut: () => void;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

export const PlaylistMode: React.FC<PlaylistModeProps> = ({
  setMode,
  logOut
}) => {
  const { spotifySdk, selectedPlaylist, setSelectedPlaylist } = useSpotifyContext();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spotifySdk) return;
    setLoading(true);
    setError(null);
    checkSpotifyAuth((spotifySdk as any).accessToken, logOut);
    spotifySdk.currentUser.playlists.playlists()
      .then((data: any) => {
        setPlaylists(data.items);
        setLoading(false);
        if(data.items.length===0){
            logOut();
        }
      })
      .catch(() => {
        setPlaylists([]);
        setError('Failed to load playlists.');
        setLoading(false);
        logOut();
      });
  }, [spotifySdk]);

  return (
    <div className="flex flex-col items-center">
      {!selectedPlaylist ? (
        <>
          <div className="mb-2">Select a playlist:</div>
          {loading ? (
            <div className="mb-4">Loading playlists...</div>
          ) : error ? (
            <div className="mb-4 text-red-400">{error}</div>
          ) : playlists.length === 0 ? (
            <div className="mb-4">No playlists found.</div>
          ) : (
            <select className="mb-4 px-3 py-2 rounded text-black" onChange={e => {
              const pl = playlists.find(p => p.id === e.target.value);
              setSelectedPlaylist(pl || null);
            }} defaultValue="">
              <option value="" disabled>Select...</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>{pl.name}</option>
              ))}
            </select>
          )}
          <button onClick={() => setMode(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Back</button>
        </>
      ) : (
        <>
          <div className="mb-2">Selected playlist: <span className="font-bold">{selectedPlaylist.name}</span></div>
          <PlayControls
          />
          <button onClick={() => setSelectedPlaylist(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Change Playlist</button>
          <button onClick={() => setMode(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Back</button>
        </>
      )}
    </div>
  );
};
