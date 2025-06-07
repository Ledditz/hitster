import { useState, useEffect } from 'react'
import './App.css'
import { SpotifyApi } from '@spotify/web-api-ts-sdk'
import { handleSpotifyRedirect, getValidSpotifyToken, handleSpotifyLogin, logOut, SPOTIFY_CLIENT_ID } from './spotifyAuth';
import { AnimatedLogo } from './AnimatedLogo';
import { QrMode } from './QrMode';
import { DeviceProvider } from './DeviceContext';
import { PlaylistMode } from './PlaylistMode';
import { SpotifyProvider, useSpotifyContext } from './SongContext';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [mode, setMode] = useState<'qr' | 'playlist' | null>(null);
  const { spotifySdk, setSpotifySdk } = useSpotifyContext();

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
  }, [isLoggedIn, setSpotifySdk])

  // Fetch available devices on login
  useEffect(() => {
    if (isLoggedIn && spotifySdk) {
      // fetchDevices(spotifySdk, setDevices, setSelectedDeviceId);
    }
  }, [isLoggedIn, spotifySdk])

  return (
    <DeviceProvider spotifySdk={spotifySdk}>
      <div className="min-h-screen bg-gray-900 text-white pt-20 px-4 flex flex-col items-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <AnimatedLogo />
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
                logOut={()=>logOut(setIsLoggedIn,setSpotifySdk)}
              />
            )}
            {mode === 'playlist' && (
              <PlaylistMode
                setMode={setMode}
                logOut={() => logOut(setIsLoggedIn, setSpotifySdk)}
                setIsLoggedIn={setIsLoggedIn}
              />
            )}
          </>
        )}
      </div>
    </DeviceProvider>
  )
}

function App() {
  return (
    <SpotifyProvider>
      <AppContent />
    </SpotifyProvider>
  )
}

export default App
