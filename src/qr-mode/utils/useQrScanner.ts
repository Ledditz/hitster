// Handles QR scanner logic
import QrScanner from "qr-scanner"
import { useState } from "react"
import { toast } from "sonner"

export function useQrScanner() {
  const [scanning, setScanning] = useState(false)
  const [qrResult, setQrResult] = useState<string | null>(null)
  const [qrScannerInstance, setQrScannerInstance] = useState<QrScanner | null>(null)
  const [qrVideoRef, setQrVideoRef] = useState<HTMLVideoElement | null>(null)

  const startQrScanner = () => {
    setScanning(true)
    setQrResult(null)
    if (qrScannerInstance) {
      qrScannerInstance.destroy()
      setQrScannerInstance(null)
    }
    let videoElem = document.getElementById("qr-video") as HTMLVideoElement | null
    if (!videoElem) {
      toast.info("added video element")
      videoElem = document.createElement("video")
      videoElem.id = "qr-video"
      videoElem.style.width = "300px"
      videoElem.style.height = "300px"
      videoElem.style.margin = "20px auto"
      videoElem.style.display = "block"
      document.getElementById("qr-video-container")?.appendChild(videoElem)
    }
    setQrVideoRef(videoElem)
    const scanner = new QrScanner(
      videoElem,
      (result) => {
        setQrResult(result.data)
        setScanning(false)
        scanner.stop()
        setQrScannerInstance(null)
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    )
    setQrScannerInstance(scanner)
    scanner.start().catch((err) => {
      toast.error(`Failed to start qr-scanner: ${err}`)
      setScanning(false)
    })
  }

  const cancelQrScanner = () => {
    if (qrScannerInstance) {
      qrScannerInstance.stop()
      qrScannerInstance.destroy()
      setQrScannerInstance(null)
    }
    setScanning(false)
    if (qrVideoRef) {
      setQrVideoRef(null)
    }
  }

  return {
    scanning,
    qrResult,
    startQrScanner,
    cancelQrScanner,
  }
}
