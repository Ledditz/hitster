import React, { useEffect, useState } from 'react';
import { PlayControls } from './PlayControls';
import { useSpotifyContext } from '../contexts/SongContext';
import { checkSpotifyAuth } from '../utils/spotifyUtils';
import type { Dispatch, SetStateAction } from 'react';
import { PlaylistSelect } from './PlaylistSelect';
import CollapsibleSongInfo from '../components/CollapsibleSongInfo';

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
          <PlaylistSelect
            playlists={playlists}
            loading={loading}
            error={error}
            setSelectedPlaylist={setSelectedPlaylist}
          />
          <button onClick={() => setMode(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Back</button>
        </>
      ) : (
        <>
          <div className="mb-2">Selected playlist: <span className="font-bold">{selectedPlaylist.name}</span></div>
          <PlayControls />
          <CollapsibleSongInfo />
          <button onClick={() => setSelectedPlaylist(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Change Playlist</button>
          <button onClick={() => setMode(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Back</button>
        </>
      )}
    </div>
  );
};
