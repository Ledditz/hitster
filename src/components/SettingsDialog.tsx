import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DeviceSelect } from "@/components/DeviceSelect"

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
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
      >
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="text-white">Settings</SheetTitle>
        </SheetHeader>
        {/* Add your settings form/controls here */}
        <div className="text-gray-300 p-6 pt-2">
          <DeviceSelect />
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Add to your CSS (e.g. App.css or index.css):
// .animate-slide-down { animation: slideDown 0.25s cubic-bezier(0.4,0,0.2,1); }
// .animate-slide-up { animation: slideUp 0.2s cubic-bezier(0.4,0,0.2,1); }
// @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
// @keyframes slideUp { from { transform: translateY(0); } to { transform: translateY(-100%); } }
// .animate-slide-down-from-header { animation: slideDownFromHeader 0.25s cubic-bezier(0.4,0,0.2,1); }
// @keyframes slideDownFromHeader { from { transform: translateY(-50%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
