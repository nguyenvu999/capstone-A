import { useState, useEffect } from "react";
import { X, Plus, Check, Loader2 } from "lucide-react";
import { supabase } from "../../auth/api/supabaseClient";
import { useAuth } from "../../auth/context/AuthContext";

// Popup that lets a user add a place to one of their existing itineraries,
// or create a brand new itinerary and add the place to it in one step.
export default function AddToItineraryModal({ place, onClose, showToast }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [itineraries, setItineraries] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());
  const [addingId, setAddingId] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Load the user's itineraries and figure out which ones already contain this place
  useEffect(() => {
    let mounted = true;

    const loadItineraries = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("itineraries")
          .select(`id, name, itinerary_places ( place_id, position )`)
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        setItineraries(data || []);

        const already = new Set(
          (data || [])
            .filter((it) =>
              (it.itinerary_places || []).some(
                (ip) => String(ip.place_id) === String(place.id)
              )
            )
            .map((it) => it.id)
        );
        setAddedIds(already);
      } catch (err) {
        console.error("Load itineraries error:", err);
        showToast("Failed to load your itineraries", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadItineraries();
    return () => {
      mounted = false;
    };
  }, [user?.id, place?.id]);

  const handleAddToExisting = async (itinerary) => {
    if (addedIds.has(itinerary.id) || addingId) return;
    setAddingId(itinerary.id);
    try {
      const existing = itinerary.itinerary_places || [];
      const nextPosition =
        existing.length > 0
          ? Math.max(...existing.map((ip) => ip.position ?? 0)) + 1
          : 0;

      const { error } = await supabase.from("itinerary_places").insert({
        itinerary_id: itinerary.id,
        place_id: place.id,
        position: nextPosition,
        note: "",
      });
      if (error) throw error;

      setAddedIds((prev) => new Set(prev).add(itinerary.id));
      showToast(`Added to "${itinerary.name}"`, "success");
    } catch (err) {
      console.error("Add to itinerary error:", err);
      showToast("Failed to add place to itinerary", "error");
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const { data: newItinerary, error: createError } = await supabase
        .from("itineraries")
        .insert({
          name: newName.trim(),
          created_by: user.id,
          is_public: false,
        })
        .select()
        .single();
      if (createError) throw createError;

      const { error: addError } = await supabase.from("itinerary_places").insert({
        itinerary_id: newItinerary.id,
        place_id: place.id,
        position: 0,
        note: "",
      });
      if (addError) throw addError;

      showToast(`Created "${newItinerary.name}" and added ${place.name}!`, "success");
      setNewName("");
      setShowCreateForm(false);
      onClose();
    } catch (err) {
      console.error("Create itinerary error:", err);
      showToast("Failed to create itinerary", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10010] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">Add to Itinerary</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{place?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of existing itineraries */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">Loading itineraries...</span>
            </div>
          ) : itineraries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No itineraries yet. Create your first one below!
            </p>
          ) : (
            itineraries.map((it) => {
              const added = addedIds.has(it.id);
              const isAdding = addingId === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleAddToExisting(it)}
                  disabled={added || isAdding}
                  className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border transition-all text-left ${
                    added
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  } disabled:cursor-default`}
                >
                  <span className="text-sm font-medium text-gray-800 truncate">{it.name}</span>
                  {added ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 shrink-0">
                      <Check size={14} /> Added
                    </span>
                  ) : isAdding ? (
                    <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />
                  ) : (
                    <Plus size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create new itinerary */}
        <div className="p-3 border-t border-gray-100 shrink-0">
          {showCreateForm ? (
            <div className="space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="e.g. HCMC Weekend"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewName("");
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndAdd}
                  disabled={!newName.trim() || creating}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Creating..." : "Create & Add"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} />
              Create New Itinerary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
