import React, { useEffect, useState } from 'react';
import { useQrScanner } from './qrScanner';
import { DeviceSelect } from './DeviceSelect';
import { playHitsterSongFromQr } from './hitsterUtils';
import { useDevice } from './DeviceContext';
import { useSpotifyContext } from './SongContext';
import { MdQrCode, MdClose } from 'react-icons/md';
import { PlayButtons } from './PlayButtons';
import { checkSpotifyAuth } from './spotifyUtils';

interface QrModeProps {
  setMode: (mode: 'qr' | 'playlist' | null) => void;
  logOut:()=>void
}

export const QrMode: React.FC<QrModeProps> = ({ setMode,logOut }) => {
  const { scanning, qrResult, barcodeError, startQrScanner, cancelQrScanner } = useQrScanner();
  const { selectedDeviceId } = useDevice();
  const {spotifySdk,isPlaying,setPlaying} = useSpotifyContext();
  const [playError, setPlayError] = useState<string | null>(null);
  // Add replayEnabled state for replay button
  const [replayEnabled, setReplayEnabled] = useState(false);
  // Store last played track for replay
  const [lastPlayedTrack, setLastPlayedTrack] = useState<any | null>(null);

  useEffect(() => {
    playHitsterSongFromQr({
      qrResult,
      spotifySdk,
      selectedDeviceId,
      setPlaying,
      setPlayError,
      logOut
    });
    // If a song was played, enable replay and store track info
    if (qrResult && spotifySdk && selectedDeviceId) {
      // This is a simplification: in a real app, you would get the track info from the QR/csv
      setReplayEnabled(true);
      setLastPlayedTrack({ uri: qrResult }); // Replace with real track object if available
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrResult]);

  // Check Spotify auth when spotifySdk changes
  useEffect(() => {
    if (!spotifySdk) return;
    // You may need to adjust how you get the access token:
    // Replace 'spotifySdk.accessToken' with your actual access token source
    checkSpotifyAuth((spotifySdk as any).accessToken, logOut);
  }, [spotifySdk, logOut]);

  // Handler for replaying the last played song
  const handleReplaySong = async () => {
    if (!spotifySdk || !lastPlayedTrack) return;
    try {
      setPlaying(true);
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${selectedDeviceId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [lastPlayedTrack.uri],
            position_ms: 30000
          })
        }
      );
      setTimeout(async () => {
        try {
          if (selectedDeviceId) {
            await spotifySdk.player.pausePlayback(selectedDeviceId);
          }
        } catch (e) {}
        setPlaying(false);
      }, 10000);
    } catch (err: any) {
      setPlayError('Failed to replay song: ' + (err?.message || err));
      setPlaying(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!scanning&&<button
        onClick={startQrScanner}
        className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold shadow transition mb-2 flex items-center gap-2"
      >
        {/* QR code icon */}
        <MdQrCode className="w-5 h-5" />
        Scan
      </button>}
      {scanning && (
        <button
          onClick={cancelQrScanner}
          className="ml-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition mb-2 flex items-center justify-center"
        >
          {/* X icon */}
          <MdClose className="w-5 h-5" />
        </button>
      )}
      <div id="qr-video-container" className="my-4 aspect-square w-64 max-w-full" />
      <DeviceSelect />
      {barcodeError && <div className="text-red-400 mb-2">{barcodeError}</div>}
      {qrResult && (
        <p className="mb-2">
          Last scanned QR: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{qrResult}</span>
        </p>
      )}
      {isPlaying && <div className="text-green-400 mb-2">Playing song...</div>}
      {playError && <div className="text-red-400 mb-2">{playError}</div>}
      <PlayButtons
        replayEnabled={replayEnabled}
        replaySong={handleReplaySong}
        showDeviceSelect={false}
      />
      <button
        onClick={() => setMode(null)}
        className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm"
      >
        Back
      </button>
    </div>
  );
};
