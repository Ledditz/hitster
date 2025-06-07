import { useState, useEffect } from 'react'
import './App.css'
import { SpotifyApi } from '@spotify/web-api-ts-sdk'
import { handleSpotifyRedirect, getValidSpotifyToken, handleSpotifyLogin, logOut, SPOTIFY_CLIENT_ID } from './spotifyAuth';
import { useQrScanner } from './qrScanner';
import {PlayControls} from './PlayControls';

// Use import.meta.env for Vite env variables
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [spotifySdk, setSpotifySdk] = useState<SpotifyApi | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastPlayedTrack, setLastPlayedTrack] = useState<any | null>(null)
  const [replayEnabled, setReplayEnabled] = useState(false)

  // Use QR scanner hook
  const { scanning, qrResult, barcodeError, startQrScanner, cancelQrScanner } = useQrScanner();

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

  // Removed device selection and play logic from App.tsx

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white font-sans">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4 flex flex-col items-center">
          {/* Animated Logo: Music note SVG with bounce only when playing */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={`mb-2 drop-shadow-lg${isPlaying ? ' bounce-spotify-logo' : ''}`}>
            <circle cx="28" cy="28" r="28" fill="#1DB954"/>
            <path d="M38 16v18.5a6.5 6.5 0 1 1-2-4.6V22h-10v10.5a6.5 6.5 0 1 1-2-4.6V16h14z" fill="#fff"/>
          </svg>
          {/* Modern animated sound wave (SVG) */}
          <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
            <rect x="5" y={isPlaying ? '8' : '8'} width="6" height={isPlaying ? undefined : '16'} rx="3" fill="#34d399">
              {isPlaying && <animate attributeName="height" values="8;24;8" dur="1s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="12;0;12" dur="1s" repeatCount="indefinite"/>}
            </rect>
            <rect x="19" y={isPlaying ? '4' : '4'} width="6" height={isPlaying ? undefined : '24'} rx="3" fill="#10b981">
              {isPlaying && <animate attributeName="height" values="24;8;24" dur="1.2s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="0;12;0" dur="1.2s" repeatCount="indefinite"/>}
            </rect>
            <rect x="33" y={isPlaying ? '10' : '14'} width="6" height={isPlaying ? undefined : '8'} rx="3" fill="#6ee7b7">
              {isPlaying && <animate attributeName="height" values="12;28;12" dur="0.9s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="10;0;10" dur="0.9s" repeatCount="indefinite"/>}
            </rect>
            <rect x="47" y={isPlaying ? '6' : '4'} width="6" height={isPlaying ? undefined : '24'} rx="3" fill="#059669">
              {isPlaying && <animate attributeName="height" values="20;8;20" dur="1.1s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="6;16;6" dur="1.1s" repeatCount="indefinite"/>}
            </rect>
            <rect x="61" y={isPlaying ? '12' : '8'} width="6" height={isPlaying ? undefined : '16'} rx="3" fill="#34d399">
              {isPlaying && <animate attributeName="height" values="8;24;8" dur="1.3s" repeatCount="indefinite"/>}
              {isPlaying && <animate attributeName="y" values="12;0;12" dur="1.3s" repeatCount="indefinite"/>}
            </rect>
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-lg">Spotify QR Scanner</h1>
        <p className="text-lg text-gray-300 mb-2">Connect to your music, instantly.</p>
      </div>
      {!isLoggedIn ? (
        <button onClick={handleSpotifyLogin} className="px-6 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition">Login with Spotify</button>
      ) : (
        <>
          {showSuccess && (
            <div className="text-green-400 mb-4 font-medium">Successfully logged in to Spotify!</div>
          )}
          <button onClick={startQrScanner} disabled={scanning} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold shadow transition mb-2">
            {scanning ? 'Scanning...' : 'Scan QR Code'}
          </button>
          {scanning && (
            <button onClick={cancelQrScanner} className="ml-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition mb-2">Cancel Scan</button>
          )}
          <div id="qr-video-container" className="my-4" />
          {barcodeError && <div className="text-red-400 mb-2">{barcodeError}</div>}
          {qrResult && <p className="mb-2">Last scanned QR: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{qrResult}</span></p>}
          {/* Play Random Song Icon Button */}
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
          />
        </>
      )}
    </div>
  )
}

export default App
