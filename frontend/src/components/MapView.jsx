import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const colorMap = { safe: "#1F6F50", warning: "#C98A2E", critical: "#B23A3A", expired: "#5B6B62" };

function customIcon(status) {
  const color = colorMap[status] || "#5B6B62";
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 2px ${color}40;"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });
}

function userIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#B23A3A;border:2px solid white;box-shadow:0 0 0 4px rgba(178,58,58,0.18);"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });
}

export default function MapView({ results, centre }) {
  return (
    <MapContainer center={centre} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={centre} icon={userIcon()}><Popup><div className="text-xs font-mono">Your location</div></Popup></Marker>
      <Circle center={centre} radius={10000} pathOptions={{ color: "#1F6F50", fillColor: "#1F6F50", fillOpacity: 0.04, weight: 1, dashArray: "4" }} />
      {results.map((r, i) => (
        <Marker key={i} position={[r.latitude, r.longitude]} icon={customIcon(r.expiry_status)}>
          <Popup>
            <div style={{ fontFamily: "monospace", fontSize: 11, minWidth: 180 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>{r.facility_name}</div>
              <div style={{ color: "#888", marginBottom: 6 }}>{r.address}</div>
              <div>Medicine: <strong>{r.medicine_name}</strong></div>
              <div>Quantity: {r.quantity} units</div>
              <div>Expiry: {r.expiry_date} ({r.days_remaining}d)</div>
              {r.is_free && <div style={{ color: "#1F6F50", marginTop: 4 }}>✓ Free medicines</div>}
              {r.mrp && <div>MRP: ₹{r.mrp}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
