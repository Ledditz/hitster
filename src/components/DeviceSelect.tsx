import React from 'react';
import { useDevice } from '../contexts/DeviceContext';

export const DeviceSelect: React.FC = () => {
  const { selectedDeviceId, devices, setDevice } = useDevice();
  return (
    <div className="my-4 flex flex-col items-center">
      <label htmlFor="device-select" className="mb-1">Select Spotify Device:</label>
      <select
        id="device-select"
        value={selectedDeviceId || ''}
        onChange={e => setDevice(e.target.value)}
        className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        {devices.map((device: any) => (
          <option key={device.id} value={device.id}>
            {device.name} {device.is_active ? '(Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
