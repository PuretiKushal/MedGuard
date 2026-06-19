import { useState, useEffect } from "react";

const VSKP_DEFAULT = { lat: 17.7231, lng: 83.3012 };

export function useGeolocation() {
  const [location, setLocation] = useState(VSKP_DEFAULT);
  const [isPrecise, setIsPrecise] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | requesting | granted | denied

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsPrecise(true);
        setStatus("granted");
      },
      () => {
        setStatus("denied");
      },
      { timeout: 8000 }
    );
  };

  return { location, isPrecise, status, requestLocation };
}

export function getDirectionsUrl(fromLat, fromLng, toLat, toLng, isPrecise) {
  if (isPrecise) {
    return `https://www.openstreetmap.org/directions?from=${fromLat},${fromLng}&to=${toLat},${toLng}`;
  }
  return `https://www.openstreetmap.org/directions?to=${toLat},${toLng}`;
}
