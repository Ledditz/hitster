import { MdClose, MdQrCode } from "react-icons/md"

interface ScannerProps {
  startScan: () => void
  cancleScan: () => void
  isScanning: boolean
}
export function Scanner({ startScan, cancleScan, isScanning }: ScannerProps) {
  return (
    <div className="flex flex-col items-center p-2">
      {!isScanning && (
        <button
          type="button"
          onClick={startScan}
          className="p-4 rounded-4xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold shadow transition mb-2 flex items-center gap-2"
        >
          <MdQrCode className="w-20 h-20" />
          {/* <span className="mt-1">Scan</span> */}
        </button>
      )}
      {/* Always render the video container, but only show it when scanning */}
      <div
        id="qr-video-container"
        className={`my-4 max-w-full ${isScanning ? "w-64 h-64" : "invisible"}`}
      >
        <video
          id="qr-video"
          className={`${isScanning ? "w-full h-full" : "w-0 h-0"} object-cover rounded-lg`}
          autoPlay
          playsInline
          muted
        />
      </div>
      {isScanning && (
        <button
          type="button"
          onClick={cancleScan}
          className="ml-2 px-4 py-2 rounded-4xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition mb-2 flex items-center justify-center"
        >
          {/* X icon */}
          <MdClose className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
