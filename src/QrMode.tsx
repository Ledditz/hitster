import React, { useEffect, useState } from 'react';
import { useQrScanner } from './qrScanner';
import { DeviceSelect } from './DeviceSelect';
import { playHitsterSongFromQr } from './hitsterUtils';
import { useDevice } from './DeviceContext';
import { useSpotifySdk } from './App';

interface QrModeProps {
  setMode: (mode: 'qr' | 'playlist' | null) => void;
}

export const QrMode: React.FC<QrModeProps> = ({ setMode }) => {
  const { scanning, qrResult, barcodeError, startQrScanner, cancelQrScanner } = useQrScanner();
  const { selectedDeviceId } = useDevice();
  const spotifySdk = useSpotifySdk();
  const [playing, setPlaying] = useState(false);
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
      <button
        onClick={startQrScanner}
        disabled={scanning}
        className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold shadow transition mb-2"
      >
        {scanning ? 'Scanning...' : 'Scan QR Code'}
      </button>
      {scanning && (
        <button
          onClick={cancelQrScanner}
          className="ml-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition mb-2"
        >
          Cancel Scan
        </button>
      )}
      <div id="qr-video-container" className="my-4" />
      <DeviceSelect />
      {barcodeError && <div className="text-red-400 mb-2">{barcodeError}</div>}
      {qrResult && (
        <p className="mb-2">
          Last scanned QR: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{qrResult}</span>
        </p>
      )}
      {playing && <div className="text-green-400 mb-2">Playing song...</div>}
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
