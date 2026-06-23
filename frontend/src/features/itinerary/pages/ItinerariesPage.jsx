import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, MapPin, Tag, Globe, Share2, Pencil, Trash2, Lock, Loader2 } from "lucide-react";
import Navbar from "../../map/components/Navbar";
import { useAuth } from "../../auth/context/AuthContext";
import { supabase } from "../../auth/api/supabaseClient";
import { useToast } from "../../../shared/ui/Toast";

const CATEGORY_CONFIG = {
  restaurant:    { label: "Restaurant",    color: "#F97316" },
  bar:           { label: "Bar",           color: "#8B5CF6" },
  beverage:      { label: "Beverage",      color: "#6366F1" },
  sight:         { label: "Sight",         color: "#3B82F6" },
  entertainment: { label: "Entertainment", color: "#EC4899" },
  team_event:    { label: "Team Event",    color: "#10B981" },
};

// Unsplash fallback images per category
const CATEGORY_IMAGES = {
  restaurant:    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
  bar:           "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=400&h=300&fit=crop",
  beverage:      "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&h=300&fit=crop",
  sight:         "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
  entertainment: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
  team_event:    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=300&fit=crop",
  default:       "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop",
};

function getPlaceImage(place) {
  return CATEGORY_IMAGES[place?.category] || CATEGORY_IMAGES.default;
}

function ItineraryCard({ itinerary, onDelete }) {
  const categories = [...new Set(itinerary.places.map((p) => {
    return CATEGORY_CONFIG[p.category]?.label || p.category;
  }))];

  const preview = itinerary.places.map((p) => p.name).join(" · ") || "No places yet";

  // Build a simple 3-image mosaic from the first 3 places
  const images = itinerary.places.slice(0, 3).map(getPlaceImage);
  while (images.length < 3) images.push(CATEGORY_IMAGES.default);

  return (
    <Link to={`/itineraries/${itinerary.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-100">
        {/* Image mosaic */}
        <div className="h-36 flex gap-0.5 bg-gray-100">
          <div className="flex-1 overflow-hidden">
            <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="flex flex-col gap-0.5 w-1/3">
            <div className="flex-1 overflow-hidden">
              <img src={images[1]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="flex-1 overflow-hidden">
              <img src={images[2]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base">{itinerary.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{itinerary.description || "No description"}</p>

          <hr className="my-3 border-gray-100" />

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={13} className="text-gray-400" />
              {itinerary.places.length} place{itinerary.places.length !== 1 ? "s" : ""}
            </span>
            {categories.length > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Tag size={13} className="text-gray-400" />
                {categories.slice(0, 3).join(", ")}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2 truncate">{preview}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {new Date(itinerary.created_at).toLocaleDateString()}
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
            </div>
            <div className="flex gap-0.5">
              <button
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                title="Share"
              >
                <Share2 size={14} />
              </button>
              <button
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(itinerary.id); }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ItinerariesPage() {
  const { user, logoutUser } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const navigate = useNavigate();

  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  //  Fetch itineraries + their places from Supabase 
  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("itineraries")
        .select(`
          *,
          itinerary_places (
            position,
            note,
            places (*)
          )
        `)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Flatten the nested structure so each itinerary has a plain `places` array
      const normalized = (data || []).map((it) => ({
        ...it,
        places: (it.itinerary_places || [])
          .sort((a, b) => a.position - b.position)
          .map((ip) => ({ ...ip.places, note: ip.note, position: ip.position })),
      }));

      setItineraries(normalized);
    } catch (err) {
      console.error("Fetch itineraries error:", err);
      showToast("Failed to load itineraries", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchItineraries();
  }, [user]);

  //  Create new itinerary 
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("itineraries")
        .insert({
          name: newName.trim(),
          description: newDescription.trim() || null,
          created_by: user.id,
          is_public: false,
        })
        .select()
        .single();
      if (error) throw error;
      showToast("Itinerary created!", "success");
      setNewName("");
      setNewDescription("");
      setShowNewModal(false);
      navigate(`/itineraries/${data.id}`);
    } catch (err) {
      console.error("Create itinerary error:", err);
      showToast("Failed to create itinerary", "error");
    } finally {
      setCreating(false);
    }
  };

  //  Delete itinerary 
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this itinerary?")) return;
    try {
      const { error } = await supabase.from("itineraries").delete().eq("id", id);
      if (error) throw error;
      setItineraries((prev) => prev.filter((it) => it.id !== id));
      showToast("Itinerary deleted", "success");
    } catch (err) {
      console.error("Delete itinerary error:", err);
      showToast("Failed to delete itinerary", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {ToastComponent}
      <Navbar user={user} onSignOut={logoutUser} onRegisterClick={() => {}} />

      <main className="max-w-5xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Itineraries</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? "Loading..." : `${itineraries.length} trip${itineraries.length !== 1 ? "s" : ""} planned`}
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d5a1e] hover:bg-[#234617] text-white font-medium text-sm rounded-full shadow-sm transition-all active:scale-95"
          >
            <Plus size={16} />
            New Itinerary
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 size={28} className="animate-spin mr-2" />
            <span className="text-sm">Loading itineraries...</span>
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <MapPin size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No itineraries yet</p>
            <p className="text-sm mt-1">Create your first trip plan!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {itineraries.map((itinerary) => (
              <ItineraryCard key={itinerary.id} itinerary={itinerary} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* New Itinerary Modal */}
      {showNewModal && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowNewModal(false)}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">New Itinerary</h2>
                <button onClick={() => setShowNewModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HCMC Weekend"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d5a1e] focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    placeholder="What's this trip about?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d5a1e] focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="flex-1 px-4 py-2.5 bg-[#2d5a1e] text-white rounded-xl font-medium text-sm hover:bg-[#234617] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
