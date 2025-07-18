import type React from "react"
import { MdArrowBack, MdSettings } from "react-icons/md"

interface HeaderProps {
  mode: "qr" | "playlist"
  onBack: () => void
  onOpenSettings: () => void // add prop
}

const modeLabels: Record<string, string> = {
  qr: "QR/Hitster-Mode",
  playlist: "Playlist-Mode",
}

export const Header: React.FC<HeaderProps> = ({ mode, onBack, onOpenSettings }) => (
  <header
    className={`fixed top-0 left-0 w-full flex items-center justify-center h-15 z-20 shadow-md ${
      mode === "qr" ? "bg-blue-900/95" : "bg-emerald-800/95"
    }`}
  >
    <button
      type="button"
      onClick={onBack}
      className="absolute left-2 p-2 rounded-full bg-gray-700 hover:bg-gray-800 text-white text-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Back"
    >
      <MdArrowBack size={20} />
    </button>
    <span className="text-lg font-bold text-white drop-shadow-sm">{modeLabels[mode]}</span>
    <button
      type="button"
      onClick={onOpenSettings}
      className="absolute right-2 p-2 rounded-full bg-gray-700 hover:bg-gray-800 text-white text-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Settings"
    >
      <MdSettings size={20} />
    </button>
  </header>
)
