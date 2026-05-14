import { useState } from "react"
import { Search, X, MapPin, AlertCircle, Plus } from "lucide-react"

// Mock Google search results
const mockGoogleResults = [
  {
    id: "g1",
    name: "Pho King Good",
    address: "123 Nguyen Hue, District 1, HCMC",
    rating: 4.6,
    reviewCount: 234,
  },
  {
    id: "g2",
    name: "Hanoi Rocks Bar",
    address: "45 Le Loi, District 1, HCMC",
    rating: 4.3,
    reviewCount: 156,
  },
  {
    id: "g3",
    name: "Ben Thanh Market",
    address: "78 Le Loi, District 1, HCMC",
    rating: 4.4,
    reviewCount: 892,
  },
]

function RegisterPlaceDrawer({ isOpen, onClose }) {
  const [step, setStep] = useState("search") // search | found | manual
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim()) {
      const filtered = mockGoogleResults.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(filtered)
      setHasSearched(true)
    } else {
      setSearchResults([])
      setHasSearched(false)
    }
  }

  const handleSelectResult = (result) => {
    setSelectedResult(result)
    setStep("found")
  }

  const handleNotFound = () => {
    setStep("manual")
    setSelectedResult(null)
  }

  const handleSubmitPlace = () => {
    console.log("Submitting place:", selectedResult)
    onClose()
  }

  const handleClose = () => {
    setStep("search")
    setSearchQuery("")
    setSearchResults([])
    setSelectedResult(null)
    setHasSearched(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#D4E5C4] bg-white p-4">
          <h2 className="text-lg font-bold text-[#001910]">Register Place</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 transition hover:bg-[#F0F5ED]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* STEP: Search */}
          {step === "search" && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B]">
                Search for an existing place from Google Maps. If not found, you can add it manually.
              </p>

              {/* Search input */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search restaurant, bar, sight..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-[#D4E5C4] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#355e1d]"
                />
              </div>

              {/* Search results */}
              {hasSearched && searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-[#64748B]">
                    Found Places
                  </p>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className="w-full rounded-lg border border-[#D4E5C4] p-3 text-left transition hover:border-[#355e1d] hover:bg-[#355e1d]/5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#001910]">
                            {result.name}
                          </h4>
                          <p className="mt-1 flex items-center gap-1 text-sm text-[#64748B]">
                            <MapPin size={14} />
                            {result.address}
                          </p>
                          {result.rating && (
                            <p className="mt-1 text-xs text-[#64748B]">
                              ⭐ {result.rating} ({result.reviewCount} reviews)
                            </p>
                          )}
                        </div>
                        <Plus
                          size={18}
                          className="ml-2 mt-1 shrink-0 text-[#355e1d]"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {hasSearched && searchResults.length === 0 && (
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Place not found
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      We couldn't find this place in Google Maps.
                    </p>
                    <button
                      onClick={handleNotFound}
                      className="mt-2 text-sm font-medium text-amber-600 underline hover:text-amber-700"
                    >
                      Add it manually instead
                    </button>
                  </div>
                </div>
              )}

              {/* Manual add CTA */}
              {!hasSearched && (
                <button
                  onClick={handleNotFound}
                  className="w-full rounded-lg border-2 border-dashed border-[#D4E5C4] p-3 text-center transition hover:border-[#355e1d] hover:bg-[#355e1d]/5"
                >
                  <p className="text-sm font-medium text-[#64748B]">
                    Can't find the place?
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#355e1d]">
                    Add it manually
                  </p>
                </button>
              )}
            </div>
          )}

          {/* STEP: Found — auto-filled */}
          {step === "found" && selectedResult && (
            <div className="space-y-4">
              <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                <span className="font-medium text-green-600">✓ Place found!</span>
                <p className="text-sm text-green-700">
                  Details auto-filled from Google Maps.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Place Name
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedResult.name}
                    disabled
                    className="mt-1 h-[44px] w-full rounded-xl border border-[#D4E5C4] bg-[#F0F5ED] px-4 text-sm text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedResult.address}
                    disabled
                    className="mt-1 h-[44px] w-full rounded-xl border border-[#D4E5C4] bg-[#F0F5ED] px-4 text-sm text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Category
                  </label>
                  <select className="mt-1 w-full rounded-xl border border-[#D4E5C4] bg-white px-3 py-2 text-sm">
                    <option>Restaurant</option>
                    <option>Bar</option>
                    <option>Sight</option>
                    <option>Entertainment</option>
                    <option>Team Event</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Price Level
                  </label>
                  <select className="mt-1 w-full rounded-xl border border-[#D4E5C4] bg-white px-3 py-2 text-sm">
                    <option>$</option>
                    <option>$$</option>
                    <option>$$$</option>
                    <option>$$$$</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Why do you recommend this?
                  </label>
                  <textarea
                    className="mt-1 w-full resize-none rounded-xl border border-[#D4E5C4] px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Share your experience..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Manual add */}
          {step === "manual" && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B]">
                Add the place details manually. Only the address is required.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Place Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My Favorite Cafe"
                    className="mt-1 h-[44px] w-full rounded-xl border border-[#D4E5C4] px-4 text-sm outline-none transition focus:border-[#355e1d]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Address *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full address..."
                    className="mt-1 h-[44px] w-full rounded-xl border border-[#D4E5C4] px-4 text-sm outline-none transition focus:border-[#355e1d]"
                  />
                  <p className="mt-1 text-xs text-[#64748B]">
                    Enter the full address of the place
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Category
                  </label>
                  <select className="mt-1 w-full rounded-xl border border-[#D4E5C4] bg-white px-3 py-2 text-sm">
                    <option>Restaurant</option>
                    <option>Bar</option>
                    <option>Sight</option>
                    <option>Entertainment</option>
                    <option>Team Event</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Price Level
                  </label>
                  <select className="mt-1 w-full rounded-xl border border-[#D4E5C4] bg-white px-3 py-2 text-sm">
                    <option>$</option>
                    <option>$$</option>
                    <option>$$$</option>
                    <option>$$$$</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Business Status
                  </label>
                  <select className="mt-1 w-full rounded-xl border border-[#D4E5C4] bg-white px-3 py-2 text-sm">
                    <option value="open">Open</option>
                    <option value="temporarily_closed">Temporarily closed</option>
                    <option value="permanently_closed">Permanently closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#001910]">
                    Why do you recommend this?
                  </label>
                  <textarea
                    className="mt-1 w-full resize-none rounded-xl border border-[#D4E5C4] px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Share your experience..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 gap-2 border-t border-[#D4E5C4] bg-white p-4">
          {step === "search" && (
            <button
              onClick={handleClose}
              className="flex-1 rounded-full border border-[#D4E5C4] px-4 py-2.5 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]"
            >
              Cancel
            </button>
          )}

          {step === "found" && (
            <>
              <button
                onClick={() => setStep("search")}
                className="flex-1 rounded-full border border-[#D4E5C4] px-4 py-2.5 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]"
              >
                Back
              </button>
              <button
                onClick={handleSubmitPlace}
                className="flex-1 rounded-full bg-[#355e1d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
              >
                Submit Place
              </button>
            </>
          )}

          {step === "manual" && (
            <>
              <button
                onClick={() => setStep("search")}
                className="flex-1 rounded-full border border-[#D4E5C4] px-4 py-2.5 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]"
              >
                Back
              </button>
              <button className="flex-1 rounded-full bg-[#355e1d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d4f18]">
                Add Manually
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterPlaceDrawer