import { useState, useEffect } from 'react'
import './App.css'
import { SpotifyApi } from '@spotify/web-api-ts-sdk'
import { handleSpotifyRedirect, getValidSpotifyToken, handleSpotifyLogin, logOut, SPOTIFY_CLIENT_ID } from './spotifyAuth';
import { PlayControls } from './PlayControls';
import { AnimatedLogo } from './AnimatedLogo';
import { QrMode } from './QrMode';

// Use import.meta.env for Vite env variables
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [spotifySdk, setSpotifySdk] = useState<SpotifyApi | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastPlayedTrack, setLastPlayedTrack] = useState<any | null>(null)
  const [replayEnabled, setReplayEnabled] = useState(false)
  const [mode, setMode] = useState<'qr' | 'playlist' | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);

  // Handle Spotify OAuth redirect
  useEffect(() => {
    handleSpotifyRedirect(setIsLoggedIn, setShowSuccess);
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getValidSpotifyToken(setIsLoggedIn, setSpotifySdk);
      if (token) {
        setSpotifySdk(SpotifyApi.withAccessToken(
          SPOTIFY_CLIENT_ID,
          {
            access_token: token,
            token_type: 'Bearer',
            expires_in: 3600,
            expires: 0, // dummy value, not used
            refresh_token: '' // not used for implicit flow
          }
        ))
        setIsLoggedIn(true)
      }
    })()
  }, [isLoggedIn])

  // Fetch available devices on login
  useEffect(() => {
    if (isLoggedIn && spotifySdk) {
      // fetchDevices(spotifySdk, setDevices, setSelectedDeviceId);
    }
  }, [isLoggedIn, spotifySdk])

  // Fetch user playlists when entering playlist mode
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (mode === 'playlist' && spotifySdk) {
        try {
          const data = await spotifySdk.currentUser.playlists.playlists();
          setPlaylists(data.items);
        } catch (e) {
          setPlaylists([]);
        }
      }
    };
    fetchPlaylists();
  }, [mode, spotifySdk])

  // Devices fetch logic
  // useEffect(() => {
  //   const fetchDevices = async () => {
  //     if (!spotifySdk) return;
  //     try {
  //       const devicesResponse = await spotifySdk.player.getAvailableDevices();
  //       setDevices(devicesResponse.devices);
  //     } catch (e) {
  //       setDevices([]);
  //     }
  //   };
  //   fetchDevices();
  // }, [spotifySdk]);

  // Add a handler to process the CSV and log the result
  // const handleProcessCsv = async () => {
  //   if (!spotifySdk) return;
  //   // Fetch the CSV file from public folder
  //   const response = await fetch('/hitster/hitster-de-aaaa0015.csv');
  //   const csvText = await response.text();
  //   const newCsv = await updateCsvWithSpotifyLinks(csvText, spotifySdk);
  //   console.log(newCsv);
  // };

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 px-4 flex flex-col items-center">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <AnimatedLogo isPlaying={isPlaying} />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-lg">Spotify QR Scanner</h1>
      <p className="text-lg text-gray-300 mb-2">Connect to your music, instantly.</p>
      {!isLoggedIn ? (
        <button onClick={handleSpotifyLogin} className="px-6 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition">Login with Spotify</button>
      ) : (
        <>
          {/* Add CSV process button for testing */}
          {/* <button onClick={handleProcessCsv} className="mb-4 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow transition">Process CSV & Log</button> */}
          {showSuccess && (
            <div className="text-green-400 mb-4 font-medium">Successfully logged in to Spotify!</div>
          )}
          {mode === null && (
            <div className="flex flex-col gap-4 mb-4">
              <button onClick={() => setMode('qr')} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow transition">QR Code Mode</button>
              <button onClick={() => setMode('playlist')} className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition">Spotify Playlist Mode</button>
            </div>
          )}
          {mode === 'qr' && (
            <QrMode
              setMode={setMode}
            />
          )}
          {mode === 'playlist' && (
            <div className="flex flex-col items-center">
              {!selectedPlaylist ? (
                <>
                  <div className="mb-2">Select a playlist:</div>
                  <select className="mb-4 px-3 py-2 rounded text-black" onChange={e => {
                    const idx = Number(e.target.value);
                    console.log("set playlist to",playlists[idx])
                    setSelectedPlaylist(playlists[idx]);
                  }} defaultValue="">
                    <option value="" disabled>Select...</option>
                    {playlists.map((pl, idx) => (
                      <option key={pl.id} value={idx}>{pl.name}</option>
                    ))}
                  </select>
                  <button onClick={() => setMode(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Back</button>
                </>
              ) : (
                <>
                  <div className="mb-2">Selected playlist: <span className="font-bold">{selectedPlaylist.name}</span></div>
                  <PlayControls
                    isLoggedIn={isLoggedIn}
                    replayEnabled={replayEnabled}
                    spotifySdk={spotifySdk}
                    selectedDeviceId={selectedDeviceId}
                    setSelectedDeviceId={setSelectedDeviceId}
                    setIsPlaying={setIsPlaying}
                    setLastPlayedTrack={setLastPlayedTrack}
                    setReplayEnabled={setReplayEnabled}
                    lastPlayedTrack={lastPlayedTrack}
                    logOut={logOut}
                    setIsLoggedIn={setIsLoggedIn}
                    setSpotifySdk={setSpotifySdk}
                    playlist={selectedPlaylist}
                  />
                  <button onClick={() => setSelectedPlaylist(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Change Playlist</button>
                  <button onClick={() => setMode(null)} className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm">Back</button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
