import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import type { SpotifyApi, Device } from "@spotify/web-api-ts-sdk"

interface DeviceContextProps {
  selectedDeviceId: string | null
  devices: Device[]
  setDevice: (deviceId: string) => void
}

const DeviceContext = createContext<DeviceContextProps | undefined>(undefined)

export const useDevice = () => {
  const context = useContext(DeviceContext)
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider")
  }
  return context
}

interface DeviceProviderProps {
  spotifySdk: SpotifyApi | null
  children: ReactNode
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ spotifySdk, children }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [devices, setDevices] = useState<Device[]>([])

  // Fetch devices and set default device
  useEffect(() => {
    if (!spotifySdk) return
    const fetchDevices = async () => {
      try {
        const devicesResponse = await spotifySdk.player.getAvailableDevices()
        setDevices(devicesResponse.devices)
        const active = devicesResponse.devices.find((d) => d.is_active)
        setSelectedDeviceId(active ? active.id : devicesResponse.devices[0]?.id || null)
      } catch (e) {
        setDevices([])
      }
    }
    fetchDevices()
  }, [spotifySdk])

  // Set device and update Spotify API
  const setDevice = useCallback(
    async (deviceId: string) => {
      if (!spotifySdk) return
      try {
        await spotifySdk.player.transferPlayback([deviceId], false)
        setSelectedDeviceId(deviceId)
        const devicesResponse = await spotifySdk.player.getAvailableDevices()
        setDevices(devicesResponse.devices)
      } catch (e) {
        alert("Failed to transfer playback to selected device.")
      }
    },
    [spotifySdk],
  )

  return (
    <DeviceContext.Provider value={{ selectedDeviceId, devices, setDevice }}>
      {children}
    </DeviceContext.Provider>
  )
}
