import React, { useEffect, useState } from 'react';
import { useQrScanner } from './qrScanner';
import { DeviceSelect } from './DeviceSelect';
import { playHitsterSongFromQr } from './hitsterUtils';
import { useDevice } from './DeviceContext';
import { useSpotifyContext } from './SongContext';
import { MdQrCode, MdClose } from 'react-icons/md';

interface QrModeProps {
  setMode: (mode: 'qr' | 'playlist' | null) => void;
}

export const QrMode: React.FC<QrModeProps> = ({ setMode }) => {
  const { scanning, qrResult, barcodeError, startQrScanner, cancelQrScanner } = useQrScanner();
  const { selectedDeviceId } = useDevice();
  const {spotifySdk,isPlaying,setPlaying} = useSpotifyContext();
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    playHitsterSongFromQr({
      qrResult,
      spotifySdk,
      selectedDeviceId,
      setPlaying,
      setPlayError,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrResult]);

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
      <button
        onClick={() => setMode(null)}
        className="mt-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white text-sm"
      >
        Back
      </button>
    </div>
  );
};
