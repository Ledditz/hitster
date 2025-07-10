import type React from "react"
import { useSpotifyContext } from "../contexts/SongContext"
import { toast } from "sonner"

export const DeviceSelect: React.FC = () => {
  const { currentDeviceId, availableDevices, setCurrentDevice, loadDevices } = useSpotifyContext()

  const handleDeviceRefresh = async () => {
    try {
      await loadDevices()
      toast.success("Devices refreshed successfully!")
    } catch (error) {
      console.error("Failed to load devices:", error)
    }
  }

  return (
    <div className="my-4 flex flex-col items-center">
      <label htmlFor="device-select" className="mb-1">
        Select Spotify Device:
      </label>
      <div className="flex gap-2 items-center">
        <select
          id="device-select"
          value={currentDeviceId || ""}
          onChange={(e) => setCurrentDevice(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {availableDevices.map((device) => (
            <option key={device.id} value={device.id ?? ""}>
              {device.name} {device.is_active ? "(Active)" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleDeviceRefresh}
          className="p-2 rounded bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          title="Refresh devices"
          aria-label="Refresh devices list"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
            role="img"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
