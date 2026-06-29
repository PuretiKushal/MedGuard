import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onChange }) {
  const [position, setPosition] = useState(
    lat && lng ? [lat, lng] : [17.7231, 83.3012]
  );

  const handlePick = (newLat, newLng) => {
    setPosition([newLat, newLng]);
    onChange(newLat, newLng);
  };

  return (
    <div>
      <div className="rounded-[10px] overflow-hidden border border-line" style={{ height: 280 }}>
        <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <ClickHandler onPick={handlePick} />
        </MapContainer>
      </div>
      <div className="flex items-center gap-2 mt-2 font-mono text-xs text-ink-faded">
        <span>📍</span>
        <span>Click on the map to set exact location — {position[0].toFixed(4)}, {position[1].toFixed(4)}</span>
      </div>
    </div>
  );
}
