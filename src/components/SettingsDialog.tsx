import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DeviceSelect } from "@/components/DeviceSelect"
import { useSpotifyContext } from "../contexts/SongContext"

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  playbackMode: "beginning" | "custom" | "random"
  setPlaybackMode: (mode: "beginning" | "custom" | "random") => void
  customStartTime: number
  setCustomStartTime: (n: number) => void
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  playbackMode,
  setPlaybackMode,
  customStartTime,
  setCustomStartTime,
}) => {
  const { playbackTime, setPlaybackTime } = useSpotifyContext()
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="bg-gray-900 text-white shadow-2xl fixed right-0 top-0 h-full w-full max-w-sm rounded-none p-0 border-l border-gray-800 z-40"
        aria-describedby="settings-desc"
      >
        <span id="settings-desc" className="sr-only">
          Settings dialog. Configure playback and device options.
        </span>
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="text-white">Settings</SheetTitle>
        </SheetHeader>
        <div className="text-gray-300 p-6 pt-2 flex flex-col gap-6">
          <DeviceSelect />
          {/* Playback Settings */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Playback Start</span>
            <div className="flex flex-col gap-2 w-full bg-gray-800 rounded-xl p-4 border border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-700 transition">
                <input
                  type="radio"
                  name="playbackMode"
                  value="beginning"
                  checked={playbackMode === "beginning"}
                  onChange={() => setPlaybackMode("beginning")}
                  className="accent-green-500 w-4 h-4"
                />
                <span className="text-sm">From beginning</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-700 transition">
                <input
                  type="radio"
                  name="playbackMode"
                  value="custom"
                  checked={playbackMode === "custom"}
                  onChange={() => setPlaybackMode("custom")}
                  className="accent-green-500 w-4 h-4"
                />
                <span className="text-sm">From second:</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={customStartTime}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setCustomStartTime(val > 120 ? 120 : val)
                  }}
                  className="w-16 px-2 py-1 rounded border border-gray-600 bg-gray-900 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-60"
                  disabled={playbackMode !== "custom"}
                />
              </label>
              <label className="flex items-center gap-3 cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-700 transition">
                <input
                  type="radio"
                  name="playbackMode"
                  value="random"
                  checked={playbackMode === "random"}
                  onChange={() => setPlaybackMode("random")}
                  className="accent-green-500 w-4 h-4"
                />
                <span className="text-sm">Random (0–90s)</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Playback Duration</span>
            <div className="flex flex-col gap-2 w-full bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm">Duration:</span>
                <span className="text-sm font-medium">{playbackTime / 1000}s</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={playbackTime / 1000}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setPlaybackTime(val * 1000)
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:appearance-none"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
