import { useState, useEffect, useRef } from "react";
import trackasiagl from "trackasia-gl";
import { Navigation, Compass } from "lucide-react";

const API_KEY = "39178044807001d0d52907a027ac689e61";

const MARKER_COLORS = ["#F97316", "#8B5CF6", "#3B82F6", "#10B981", "#EC4899", "#6366F1"];

/**
 * ItineraryMapView
 * A real TrackAsia map that renders numbered markers for each itinerary place
 * and draws a dashed route line connecting them in order.
 *
 * Props:
 *   places       – array of place objects with { latitude, longitude, name, ... }
 *   focusedIndex – optional index to fly to / highlight (null = fit all)
 */
export default function ItineraryMapView({ places, focusedIndex, directionsRoute }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // ===== DEVICE COMPASS / HEADING =====
  const headingConeRef = useRef(null); // points to the cone element inside the CURRENT user marker
  const compassListenerRef = useRef(null);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [compassSupported, setCompassSupported] = useState(true);

  // Builds the user-location marker element (blue dot + direction cone) and
  // keeps headingConeRef pointed at the cone that's currently in the DOM.
  const createUserMarkerEl = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "user-location-wrapper";
    wrapper.innerHTML = `
      <div class="user-heading-cone"></div>
      <div class="user-pulse-marker"></div>
    `;
    const cone = wrapper.querySelector(".user-heading-cone");
    headingConeRef.current = cone;
    if (compassEnabled && cone) cone.style.display = "block";
    return wrapper;
  };

  // Apply a heading (degrees, 0 = North, clockwise) to the cone DOM node directly.
  // Bypasses React state to avoid re-rendering on every orientation event (fires ~30-60x/sec).
  const applyHeadingToCone = (headingDeg) => {
    const cone = headingConeRef.current;
    if (!cone) return;
    cone.style.display = "block";
    cone.style.transform = `rotate(${headingDeg}deg)`;
  };

  const handleDeviceOrientation = (e) => {
    let heading = null;

    // iOS Safari exposes a ready-to-use compass heading (0 = North, clockwise)
    if (typeof e.webkitCompassHeading === "number" && !isNaN(e.webkitCompassHeading)) {
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
      // Android / other browsers: alpha is counter-clockwise from device's initial orientation.
      // 360 - alpha converts it to a clockwise compass-style heading (approximate, no full tilt compensation).
      heading = 360 - e.alpha;
    }

    if (heading === null || isNaN(heading)) return;
    heading = ((heading % 360) + 360) % 360;
    applyHeadingToCone(heading);
  };

  const stopCompass = () => {
    if (compassListenerRef.current) {
      window.removeEventListener(compassListenerRef.current.eventName, compassListenerRef.current.handler, true);
      compassListenerRef.current = null;
    }
    setCompassEnabled(false);
    if (headingConeRef.current) headingConeRef.current.style.display = "none";
  };

  const startCompass = () => {
    if (typeof window.DeviceOrientationEvent === "undefined") {
      setCompassSupported(false);
      return;
    }

    const eventName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";

    const attach = () => {
      window.addEventListener(eventName, handleDeviceOrientation, true);
      compassListenerRef.current = { eventName, handler: handleDeviceOrientation };
      setCompassEnabled(true);
    };

    // iOS 13+ requires an explicit user-gesture-triggered permission request
    if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
      window.DeviceOrientationEvent.requestPermission()
        .then((result) => {
          if (result === "granted") {
            attach();
          } else {
            setCompassSupported(false);
          }
        })
        .catch(() => setCompassSupported(false));
    } else {
      attach();
    }
  };

  const handleCompassToggle = () => {
    if (compassEnabled) {
      stopCompass();
    } else {
      startCompass();
    }
  };

  // Cleanup compass listener on unmount
  useEffect(() => {
    return () => {
      if (compassListenerRef.current) {
        window.removeEventListener(compassListenerRef.current.eventName, compassListenerRef.current.handler, true);
      }
    };
  }, []);

  // ── 1. Initialise map once ────────────────────────────────────────────────
  useEffect(() => {
    // Pulse-marker + heading-cone CSS (shared with MapContainer)
    if (!document.getElementById("pulse-marker-style")) {
      const style = document.createElement("style");
      style.id = "pulse-marker-style";
      style.innerHTML = `
        .user-pulse-marker { width:16px;height:16px;background:#2563eb;border:2px solid white;border-radius:50%;position:relative;box-shadow:0 0 8px rgba(0,0,0,.3); z-index:10; }
        .user-pulse-marker::after { content:'';width:40px;height:40px;background:rgba(37,99,235,.4);border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.5);animation:mapPulse 2s infinite ease-out;opacity:0; }
        @keyframes mapPulse { 0%{transform:translate(-50%,-50%) scale(.2);opacity:0} 50%{opacity:.8} 100%{transform:translate(-50%,-50%) scale(1.5);opacity:0} }

        .user-location-wrapper { position: relative; width: 16px; height: 16px; }
        .user-heading-cone {
          display: none;
          position: absolute;
          bottom: 8px;
          left: 50%;
          width: 0;
          height: 0;
          margin-left: -9px;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-bottom: 32px solid rgba(37, 99, 235, 0.45);
          transform-origin: 50% 100%;
          transform: rotate(0deg);
          pointer-events: none;
          z-index: 9;
          transition: transform 0.1s linear;
        }
      `;
      document.head.appendChild(style);
    }

    const defaultCenter = [106.694945, 10.769034];

    mapRef.current = new trackasiagl.Map({
      container: containerRef.current,
      style: `https://maps.track-asia.com/styles/v2/streets.json?key=${API_KEY}&detailLevel=none`,
      center: defaultCenter,
      zoom: 12,
    });

    mapRef.current.on("load", () => {
      // Try to get user location for context (no fly-to; we'll fit places)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (!mapRef.current) return;
            if (userMarkerRef.current) userMarkerRef.current.remove();
            const el = createUserMarkerEl();
            userMarkerRef.current = new trackasiagl.Marker({ element: el })
              .setLngLat([coords.longitude, coords.latitude])
              .setPopup(
                new trackasiagl.Popup({ offset: 10 }).setHTML(
                  "<p class='text-xs font-semibold px-1'>Your Location</p>"
                )
              )
              .addTo(mapRef.current);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── 2. Re-render markers + route whenever places change ───────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const ready = () => {
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Remove old route layer/source
      if (mapRef.current.getLayer("itinerary-route")) mapRef.current.removeLayer("itinerary-route");
      if (mapRef.current.getLayer("itinerary-route-arrows")) mapRef.current.removeLayer("itinerary-route-arrows");
      if (mapRef.current.getSource("itinerary-route")) mapRef.current.removeSource("itinerary-route");

      const validPlaces = places.filter(
        (p) => p && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
      );

      if (validPlaces.length === 0) return;

      // Draw numbered markers
      validPlaces.forEach((place, index) => {
        const lng = Number(place.longitude);
        const lat = Number(place.latitude);
        const color = MARKER_COLORS[index % MARKER_COLORS.length];

        const el = document.createElement("div");
        el.style.cssText = `
          width:36px;height:36px;border-radius:50%;background:${color};
          border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:13px;color:white;cursor:pointer;
          font-family:system-ui,sans-serif;
        `;
        el.textContent = String(index + 1);

        const popup = new trackasiagl.Popup({ offset: [0, -22], closeButton: false, closeOnClick: false })
          .setHTML(
            `<div style="padding:6px 8px;max-width:180px">
              <div style="font-weight:700;font-size:12px;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${place.name || "Place"}</div>
              ${place.address ? `<div style="font-size:11px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${place.address}</div>` : ""}
            </div>`
          );

        el.addEventListener("mouseenter", () => popup.setLngLat([lng, lat]).addTo(mapRef.current));
        el.addEventListener("mouseleave", () => popup.remove());

        const marker = new trackasiagl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });

      // Draw route line — real routed geometry if available, else straight dashed fallback
      if (validPlaces.length > 1) {
        const routeGeometry = directionsRoute || {
          type: "LineString",
          coordinates: validPlaces.map((p) => [Number(p.longitude), Number(p.latitude)]),
        };

        mapRef.current.addSource("itinerary-route", {
          type: "geojson",
          data: { type: "Feature", geometry: routeGeometry },
        });

        // Solid green line for real route, dashed for straight-line fallback
        const isRealRoute = !!directionsRoute;
        mapRef.current.addLayer({
          id: "itinerary-route",
          type: "line",
          source: "itinerary-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#2d5a1e",
            "line-width": isRealRoute ? 4 : 2.5,
            ...(isRealRoute ? { "line-opacity": 0.85 } : { "line-dasharray": [4, 3], "line-opacity": 0.7 }),
          },
        });
      }

      // Fit map to show all markers
      if (validPlaces.length === 1) {
        mapRef.current.flyTo({ center: [Number(validPlaces[0].longitude), Number(validPlaces[0].latitude)], zoom: 15 });
      } else if (validPlaces.length > 1) {
        const bounds = new trackasiagl.LngLatBounds();
        validPlaces.forEach((p) => bounds.extend([Number(p.longitude), Number(p.latitude)]));
        mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
      }
    };

    // Map may still be loading when places first arrive
    if (mapRef.current.isStyleLoaded()) {
      ready();
    } else {
      mapRef.current.once("load", ready);
    }
  }, [places]);

  // ── 4. Update route line when directionsRoute changes ────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const source = mapRef.current.getSource("itinerary-route");
    if (!source) return;

    const validPlaces = places.filter(
      (p) => p && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
    );
    if (validPlaces.length < 2) return;

    const geometry = directionsRoute || {
      type: "LineString",
      coordinates: validPlaces.map((p) => [Number(p.longitude), Number(p.latitude)]),
    };

    source.setData({ type: "Feature", geometry });

    const isRealRoute = !!directionsRoute;
    mapRef.current.setPaintProperty("itinerary-route", "line-width", isRealRoute ? 4 : 2.5);
    mapRef.current.setPaintProperty("itinerary-route", "line-opacity", isRealRoute ? 0.85 : 0.7);
    if (isRealRoute) {
      mapRef.current.setPaintProperty("itinerary-route", "line-dasharray", null);
    } else {
      mapRef.current.setPaintProperty("itinerary-route", "line-dasharray", [4, 3]);
    }

    // Fit map to the route bounds
    if (directionsRoute) {
      const bounds = new trackasiagl.LngLatBounds();
      directionsRoute.coordinates.forEach((c) => bounds.extend(c));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 600 });
    }
  }, [directionsRoute]);
  useEffect(() => {
    if (focusedIndex == null || !mapRef.current) return;
    const place = places[focusedIndex];
    if (!place) return;
    const lng = Number(place.longitude);
    const lat = Number(place.latitude);
    if (isNaN(lng) || isNaN(lat)) return;

    mapRef.current.flyTo({ center: [lng, lat], zoom: 16, essential: true });
  }, [focusedIndex, places]);

  // ── Recenter handler ──────────────────────────────────────────────────────
  const handleRecenter = () => {
    if (!mapRef.current) return;
    const validPlaces = places.filter(
      (p) => p && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
    );
    if (validPlaces.length === 0) return;
    if (validPlaces.length === 1) {
      mapRef.current.flyTo({ center: [Number(validPlaces[0].longitude), Number(validPlaces[0].latitude)], zoom: 15 });
    } else {
      const bounds = new trackasiagl.LngLatBounds();
      validPlaces.forEach((p) => bounds.extend([Number(p.longitude), Number(p.latitude)]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/*
        Sits at bottom-6 on desktop (no sheet to worry about).
        On mobile, offset above the bottom sheet's peeked height (132px)
        plus a bit of breathing room, so it's never covered by the sheet.
      */}
      <div className="absolute bottom-[152px] right-4 lg:bottom-6 lg:right-6 z-20 flex items-center gap-1.5 bg-white rounded-full shadow-xl border border-gray-100 px-1.5 py-1.5">
        <button
          onClick={handleRecenter}
          title="Fit all places"
          className="p-2.5 hover:bg-gray-50 text-blue-600 rounded-full transition-all active:scale-95 group"
        >
          <Navigation size={18} className="fill-blue-50 group-hover:rotate-45 transition-transform" />
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <button
          onClick={handleCompassToggle}
          title={compassEnabled ? "Hide direction" : "Show which way you're facing"}
          className={`p-2.5 rounded-full transition-all active:scale-95 ${
            compassEnabled ? "bg-blue-500 text-white" : "hover:bg-gray-50 text-blue-600"
          }`}
        >
          <Compass size={18} />
        </button>
      </div>
    </div>
  );
}
