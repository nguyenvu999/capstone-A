import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Lock, Globe, Share2, MoreHorizontal,
  GripVertical, MapPin, Trash2, Plus, RotateCw,
  Footprints, Car, X, Check, Loader2, Search,
  ChevronDown, ChevronUp, Navigation2, Clock, Ruler,
} from "lucide-react";
import Navbar from "../../map/components/Navbar";
import { useAuth } from "../../auth/context/AuthContext";
import { supabase } from "../../auth/api/supabaseClient";
import { useToast } from "../../../shared/ui/Toast";
import ItineraryMapView from "../components/ItineraryMapView";

const CATEGORY_CONFIG = {
  restaurant:    { label: "Restaurant",    color: "#F97316" },
  bar:           { label: "Bar",           color: "#8B5CF6" },
  beverage:      { label: "Beverage",      color: "#6366F1" },
  sight:         { label: "Sight",         color: "#3B82F6" },
  entertainment: { label: "Entertainment", color: "#EC4899" },
  team_event:    { label: "Team Event",    color: "#10B981" },
};

const CATEGORY_IMAGES = {
  restaurant:    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=128&h=128&fit=crop",
  bar:           "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=128&h=128&fit=crop",
  beverage:      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=128&h=128&fit=crop",
  sight:         "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=128&h=128&fit=crop",
  entertainment: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=128&h=128&fit=crop",
  team_event:    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=128&h=128&fit=crop",
  default:       "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=128&h=128&fit=crop",
};

const PRICE_LABEL = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
const MARKER_COLORS = ["#F97316", "#8B5CF6", "#3B82F6", "#10B981", "#EC4899", "#6366F1"];

function getCatConfig(cat) {
  return CATEGORY_CONFIG[cat?.toLowerCase()] || { label: cat, color: "#6B7280" };
}

function getPlaceImage(place) {
  return CATEGORY_IMAGES[place?.category] || CATEGORY_IMAGES.default;
}

export default function ItineraryDetailPage() {
  const { id } = useParams();
  const { user, logoutUser } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [itinerary, setItinerary] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showMore, setShowMore] = useState(false);

  // Map focus
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [optimising, setOptimising] = useState(false);

  // Directions
  const [directionsSegment, setDirectionsSegment] = useState(null); // { fromIndex, toIndex }
  const [directionsData, setDirectionsData] = useState(null);       // { steps, distance, duration, mode, geometry }
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [directionsMode, setDirectionsMode] = useState("driving");  // "driving" | "walking"

  // Add-place search
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ── Fetch itinerary + places ────────────────────────────────────────────────
  const fetchItinerary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("itineraries")
        .select(`
          *,
          itinerary_places (
            id,
            position,
            note,
            places (*)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setItinerary(data);
      setTitleDraft(data.name);
      const sorted = (data.itinerary_places || [])
        .sort((a, b) => a.position - b.position)
        .map((ip) => ({ ...ip.places, note: ip.note, itinerary_place_id: ip.id, position: ip.position }));
      setPlaces(sorted);
    } catch (err) {
      console.error("Fetch itinerary error:", err);
      showToast("Failed to load itinerary", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItinerary(); }, [id]);

  // ── Search places from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .ilike("name", `%${searchQuery.trim()}%`)
          .limit(10);
        if (error) throw error;
        // Filter out places already in the itinerary
        const existingIds = new Set(places.map((p) => String(p.id)));
        setSearchResults((data || []).filter((p) => !existingIds.has(String(p.id))));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, places]);

  // ── Add place to itinerary ──────────────────────────────────────────────────
  const handleAddPlace = async (place) => {
    try {
      const nextPosition = places.length > 0 ? Math.max(...places.map((p) => p.position)) + 1 : 0;
      const { error } = await supabase.from("itinerary_places").insert({
        itinerary_id: id,
        place_id: place.id,
        position: nextPosition,
        note: "",
      });
      if (error) throw error;
      showToast(`${place.name} added!`, "success");
      setSearchQuery("");
      setSearchResults([]);
      setShowAddPanel(false);
      fetchItinerary();
    } catch (err) {
      console.error("Add place error:", err);
      showToast("Failed to add place", "error");
    }
  };

  // ── Remove place from itinerary ─────────────────────────────────────────────
  const handleRemovePlace = async (itineraryPlaceId, placeName) => {
    try {
      const { error } = await supabase
        .from("itinerary_places")
        .delete()
        .eq("id", itineraryPlaceId);
      if (error) throw error;
      setPlaces((prev) => prev.filter((p) => p.itinerary_place_id !== itineraryPlaceId));
      showToast(`${placeName} removed`, "success");
    } catch (err) {
      console.error("Remove place error:", err);
      showToast("Failed to remove place", "error");
    }
  };

  // ── Save note ───────────────────────────────────────────────────────────────
  const saveNote = async (itineraryPlaceId) => {
    try {
      const { error } = await supabase
        .from("itinerary_places")
        .update({ note: noteDraft })
        .eq("id", itineraryPlaceId);
      if (error) throw error;
      setPlaces((prev) =>
        prev.map((p) => p.itinerary_place_id === itineraryPlaceId ? { ...p, note: noteDraft } : p)
      );
      setEditingNoteId(null);
      showToast("Note saved", "success");
    } catch (err) {
      console.error("Save note error:", err);
      showToast("Failed to save note", "error");
    }
  };

  // ── Save title ──────────────────────────────────────────────────────────────
  const saveTitle = async () => {
    if (!titleDraft.trim()) return;
    try {
      const { error } = await supabase
        .from("itineraries")
        .update({ name: titleDraft.trim() })
        .eq("id", id);
      if (error) throw error;
      setItinerary((prev) => ({ ...prev, name: titleDraft.trim() }));
      setEditingTitle(false);
      showToast("Title updated", "success");
    } catch (err) {
      console.error("Save title error:", err);
      showToast("Failed to update title", "error");
    }
  };

  // ── Toggle public/private ───────────────────────────────────────────────────
  const togglePublic = async () => {
    const next = !itinerary.is_public;
    try {
      const { error } = await supabase.from("itineraries").update({ is_public: next }).eq("id", id);
      if (error) throw error;
      setItinerary((prev) => ({ ...prev, is_public: next }));
      showToast(`Set to ${next ? "public" : "private"}`, "success");
    } catch (err) {
      console.error("Toggle public error:", err);
    }
    setShowMore(false);
  };

  // ── Move place up/down ──────────────────────────────────────────────────────
  const movePlace = async (index, direction) => {
    const next = index + direction;
    if (next < 0 || next >= places.length) return;
    const updated = [...places];
    [updated[index], updated[next]] = [updated[next], updated[index]];

    // Optimistic UI update
    setPlaces(updated);

    // Persist new positions
    try {
      await Promise.all([
        supabase.from("itinerary_places").update({ position: updated[index].position }).eq("id", updated[index].itinerary_place_id),
        supabase.from("itinerary_places").update({ position: updated[next].position }).eq("id", updated[next].itinerary_place_id),
      ]);
    } catch (err) {
      console.error("Reorder error:", err);
      fetchItinerary(); // revert
    }
  };

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard!", "success");
  };

  // ── Optimise route (nearest-neighbour TSP via Distance Matrix API) ─────────
  const optimiseRoute = async () => {
    if (places.length < 3) {
      showToast("Add at least 3 places to optimise the route", "warning");
      return;
    }

    setOptimising(true);
    try {
      const API_KEY = "39178044807001d0d52907a027ac689e61";

      // Build coordinate string: all place coords
      const coordsStr = places
        .map((p) => `${Number(p.longitude)},${Number(p.latitude)}`)
        .join(";");

      // Fetch full N×N distance matrix (all sources)
      const res = await fetch(
        `https://maps.track-asia.com/distance-matrix/v1/moto/${coordsStr}?annotations=distance&key=${API_KEY}`
      );
      const data = await res.json();

      if (!data?.distances || data.distances.length !== places.length) {
        throw new Error("Invalid distance matrix response");
      }

      const matrix = data.distances; // N×N array of metres

      // Nearest-neighbour heuristic starting from index 0
      const n = places.length;
      const visited = new Array(n).fill(false);
      const order = [0];
      visited[0] = true;

      for (let step = 1; step < n; step++) {
        const last = order[order.length - 1];
        let bestDist = Infinity;
        let bestIdx = -1;
        for (let j = 0; j < n; j++) {
          if (!visited[j] && (matrix[last][j] ?? Infinity) < bestDist) {
            bestDist = matrix[last][j];
            bestIdx = j;
          }
        }
        if (bestIdx === -1) break; // fallback safety
        visited[bestIdx] = true;
        order.push(bestIdx);
      }

      // Reorder places array
      const reordered = order.map((i) => places[i]);

      // Persist new positions to Supabase
      await Promise.all(
        reordered.map((place, newPos) =>
          supabase
            .from("itinerary_places")
            .update({ position: newPos })
            .eq("id", place.itinerary_place_id)
        )
      );

      setPlaces(reordered);
      setFocusedIndex(null);
      showToast("Route optimised! 🗺️", "success");
    } catch (err) {
      console.error("Optimise route error:", err);
      showToast("Could not optimise route — check your connection", "error");
    } finally {
      setOptimising(false);
    }
  };

  // ── Fetch step-by-step directions between two places ─────────────────────
  const fetchDirections = async (fromIndex, toIndex, mode = directionsMode) => {
    const from = places[fromIndex];
    const to   = places[toIndex];
    if (!from || !to) return;

    // Toggle off if same segment already open
    if (directionsSegment?.fromIndex === fromIndex && directionsSegment?.toIndex === toIndex && directionsData?.mode === mode) {
      setDirectionsSegment(null);
      setDirectionsData(null);
      return;
    }

    setDirectionsLoading(true);
    setDirectionsSegment({ fromIndex, toIndex });
    setDirectionsData(null);

    try {
      const API_KEY = "fbe052e2f17788443245e0c54f3084b0a2";
      const profile = mode === "walking" ? "foot" : "moto";
      const coords  = `${Number(from.longitude)},${Number(from.latitude)};${Number(to.longitude)},${Number(to.latitude)}`;
      const res  = await fetch(
        `https://maps.track-asia.com/route/v1/${profile}/${coords}?steps=true&overview=full&geometries=geojson&key=${API_KEY}`
      );
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found");

      const route = data.routes[0];
      const steps = route.legs[0].steps.map((s) => ({
        instruction: s.maneuver?.instruction || s.name || "Continue",
        distance:    s.distance,
        duration:    s.duration,
        type:        s.maneuver?.type || "turn",
        modifier:    s.maneuver?.modifier || "",
      }));

      setDirectionsData({
        steps,
        distance: route.distance,
        duration: route.duration,
        mode,
        geometry: route.geometry, // GeoJSON LineString
      });
    } catch (err) {
      console.error("Directions error:", err);
      showToast("Could not load directions", "error");
      setDirectionsSegment(null);
    } finally {
      setDirectionsLoading(false);
    }
  };

  // Re-fetch when mode toggles while a segment is open
  const toggleDirectionsMode = (newMode) => {
    setDirectionsMode(newMode);
    if (directionsSegment) {
      fetchDirections(directionsSegment.fromIndex, directionsSegment.toIndex, newMode);
    }
  };

  const formatDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const formatDur  = (s) => {
    const mins = Math.round(s / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const MANEUVER_ICON = {
    depart:         "🚦", arrive:        "📍", turn:          "↪️",
    "new name":     "➡️", continue:      "⬆️", fork:          "⑂",
    merge:          "⬆️", "on ramp":     "↗️", "off ramp":    "↘️",
    roundabout:     "🔄", rotary:        "🔄", notification:  "ℹ️",
  };
  const getManeuverIcon = (type, modifier) => {
    if (type === "turn") {
      if (modifier?.includes("left"))  return "↰";
      if (modifier?.includes("right")) return "↱";
    }
    return MANEUVER_ICON[type] || "•";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#2d5a1e]" />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        <p>Itinerary not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {ToastComponent}
      <Navbar user={user} onSignOut={logoutUser} onRegisterClick={() => {}} />

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] pt-16">
        {/* ── Left: place list ─────────────────────────────────────────────── */}
        <div className="lg:w-[40%] p-4 lg:p-6 lg:overflow-y-auto">
          <Link to="/itineraries" className="inline-flex items-center gap-1.5 text-sm text-[#2d5a1e] hover:underline mb-5">
            <ArrowLeft size={16} /> Back to itineraries
          </Link>

          {/* Header */}
          <div className="mb-6">
            {editingTitle ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  className="text-2xl font-bold text-gray-900 border-b-2 border-[#2d5a1e] bg-transparent focus:outline-none flex-1"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                  autoFocus
                />
                <button onClick={saveTitle} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check size={16} /></button>
                <button onClick={() => setEditingTitle(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{itinerary.name}</h1>
                <button onClick={() => { setTitleDraft(itinerary.name); setEditingTitle(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                  <Pencil size={15} />
                </button>
              </div>
            )}
            <p className="text-gray-500 text-sm">{itinerary.description}</p>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={14} className="text-gray-400" />
                {places.length} place{places.length !== 1 ? "s" : ""}
              </span>
              {itinerary.is_public ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1 font-medium">
                  <Globe size={10} /> Public
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1 font-medium">
                  <Lock size={10} /> Private
                </span>
              )}
              <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600">
                <Share2 size={13} /> Share
              </button>
              <div className="relative">
                <button onClick={() => setShowMore(!showMore)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                  <MoreHorizontal size={18} />
                </button>
                {showMore && (
                  <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                    <button onClick={togglePublic} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      {itinerary.is_public ? <Lock size={14} /> : <Globe size={14} />}
                      Make {itinerary.is_public ? "Private" : "Public"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Place list */}
          <div className="space-y-0">
            {places.map((place, index) => {
              const cat = getCatConfig(place.category);
              const markerColor = MARKER_COLORS[index % MARKER_COLORS.length];

              return (
                <div key={place.itinerary_place_id}>
                  <div className="flex gap-3 py-3 cursor-pointer hover:bg-gray-50/60 rounded-xl px-1 transition-colors" onClick={() => setFocusedIndex(index)}>
                    {/* Up/down */}
                    <div className="flex flex-col gap-0.5 self-start mt-2">
                      <button onClick={() => movePlace(index, -1)} disabled={index === 0} className="text-gray-200 hover:text-gray-400 disabled:opacity-20 transition-colors">
                        <GripVertical size={15} />
                      </button>
                    </div>

                    {/* Number */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: markerColor }}>
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={getPlaceImage(place)} alt={place.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{place.name}</h3>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                          {cat.label}
                        </span>
                        {place.price_level && <span className="text-xs text-gray-400">{PRICE_LABEL[place.price_level]}</span>}
                        {place.address && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5 truncate max-w-[160px]">
                            <MapPin size={11} /> {place.address}
                          </span>
                        )}
                      </div>

                      {/* Note */}
                      {editingNoteId === place.itinerary_place_id ? (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <input
                            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#2d5a1e]"
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveNote(place.itinerary_place_id); if (e.key === "Escape") setEditingNoteId(null); }}
                            placeholder="Add a note..."
                            autoFocus
                          />
                          <button onClick={() => saveNote(place.itinerary_place_id)} className="text-emerald-600"><Check size={14} /></button>
                          <button onClick={() => setEditingNoteId(null)} className="text-gray-400"><X size={14} /></button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-1 cursor-pointer hover:text-gray-600" onClick={() => { setEditingNoteId(place.itinerary_place_id); setNoteDraft(place.note || ""); }}>
                          {place.note || <span className="not-italic text-gray-300">+ Add note...</span>}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-0.5 self-start">
                      <button onClick={() => { setEditingNoteId(place.itinerary_place_id); setNoteDraft(place.note || ""); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-gray-500">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleRemovePlace(place.itinerary_place_id, place.name)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Connector + Directions */}
                  {index < places.length - 1 && (() => {
                    const isOpen    = directionsSegment?.fromIndex === index && directionsSegment?.toIndex === index + 1;
                    const isLoading = directionsLoading && directionsSegment?.fromIndex === index;
                    return (
                      <div className="pl-[42px]">
                        {/* Toggle button */}
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-8 flex justify-center">
                            <div className="w-px h-4 border-l-2 border-dashed border-gray-200" />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchDirections(index, index + 1); }}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                              isOpen
                                ? "bg-[#2d5a1e] text-white border-[#2d5a1e]"
                                : "bg-gray-50 text-gray-400 border-gray-100 hover:border-[#2d5a1e] hover:text-[#2d5a1e]"
                            }`}
                          >
                            {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Navigation2 size={11} />}
                            <span>Directions</span>
                            {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </button>
                        </div>

                        {/* Directions panel */}
                        {isOpen && (
                          <div className="ml-10 mb-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            {/* Mode toggle + summary */}
                            <div className="px-3 pt-3 pb-2 border-b border-gray-50">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex rounded-lg overflow-hidden border border-gray-100 text-xs">
                                  {["driving", "walking"].map((m) => (
                                    <button
                                      key={m}
                                      onClick={() => toggleDirectionsMode(m)}
                                      className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
                                        directionsData?.mode === m || (!directionsData && directionsMode === m)
                                          ? "bg-[#2d5a1e] text-white"
                                          : "bg-white text-gray-500 hover:bg-gray-50"
                                      }`}
                                    >
                                      {m === "driving" ? <Car size={11} /> : <Footprints size={11} />}
                                      {m === "driving" ? "Drive" : "Walk"}
                                    </button>
                                  ))}
                                </div>
                                {directionsData && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-0.5"><Clock size={11} /> {formatDur(directionsData.duration)}</span>
                                    <span className="flex items-center gap-0.5"><Ruler size={11} /> {formatDist(directionsData.distance)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Steps */}
                            {directionsLoading && directionsSegment?.fromIndex === index ? (
                              <div className="flex items-center justify-center py-6 text-gray-300">
                                <Loader2 size={18} className="animate-spin" />
                              </div>
                            ) : directionsData ? (
                              <ul className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                                {directionsData.steps.map((step, si) => (
                                  <li key={si} className="flex items-start gap-2 px-3 py-2">
                                    <span className="text-base leading-none mt-0.5 w-5 text-center flex-shrink-0">
                                      {getManeuverIcon(step.type, step.modifier)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-700 leading-snug">{step.instruction}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-300 flex-shrink-0 mt-0.5">
                                      {formatDist(step.distance)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {places.length === 0 && !showAddPanel && (
            <div className="text-center py-16 text-gray-300">
              <MapPin size={36} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-gray-400">No places yet</p>
              <p className="text-xs mt-1">Search and add places below!</p>
            </div>
          )}

          {/* Add place panel */}
          {showAddPanel && (
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-800 text-sm flex-1">Add a place</h3>
                <button onClick={() => { setShowAddPanel(false); setSearchQuery(""); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#2d5a1e] transition-all mb-2">
                <Search size={15} className="text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search saved places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent focus:outline-none text-sm w-full"
                  autoFocus
                />
                {searching && <Loader2 size={14} className="animate-spin text-gray-400 ml-2" />}
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {searchResults.map((place) => {
                    const cat = getCatConfig(place.category);
                    return (
                      <button
                        key={place.id}
                        onClick={() => handleAddPlace(place)}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={getPlaceImage(place)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{place.name}</p>
                          <p className="text-xs text-gray-400 truncate">{place.address}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No matching saved places found</p>
              )}
            </div>
          )}

          {/* Bottom actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#2d5a1e] text-[#2d5a1e] rounded-xl font-medium text-sm hover:bg-[#2d5a1e]/5 transition-colors"
            >
              <Plus size={15} />
              Add Place
            </button>
            <button
              onClick={optimiseRoute}
              disabled={optimising || places.length < 3}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a1e] text-white rounded-xl font-medium text-sm hover:bg-[#234617] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {optimising ? <Loader2 size={15} className="animate-spin" /> : <RotateCw size={15} />}
              {optimising ? "Optimising…" : "Optimise Route"}
            </button>
          </div>
        </div>

        {/* ── Right: real TrackAsia map ─────────────────────────────────── */}
        <div className="lg:w-[60%] h-64 lg:h-auto lg:sticky lg:top-16 relative overflow-hidden">
          <ItineraryMapView places={places} focusedIndex={focusedIndex} directionsRoute={directionsData?.geometry ?? null} />
        </div>
      </div>
    </div>
  );
}
