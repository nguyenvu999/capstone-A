import { useMemo, useState } from "react"
import { ChevronDown, LogOut, MapPin, Search, Plus } from "lucide-react"
import { useAuth } from "../../auth/context/AuthContext"

function MapNavbar({ onRegisterPlaceClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logoutUser } = useAuth()

  const displayName = user?.name || user?.displayName || user?.email || "User"

  const initials = useMemo(() => {
    const parts = displayName.trim().split(" ")
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
  }, [displayName])

  return (
    <header className="sticky top-0 z-40 border-b border-[#D4E5C4] bg-white">
      <div className="mx-auto flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dce8c8]">
            <MapPin className="h-5 w-5 text-[#355e1d]" />
          </div>
          <span className="text-xl font-semibold text-black">NetSuggest</span>
        </div>

        {/* Search */}
        <div className="mx-auto hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
            <input
              placeholder="Search places..."
              className="h-10 w-full rounded-full border-0 bg-[#F0F5ED] pl-11 pr-4 text-sm outline-none"
            />
          </div>
        </div>

        {/* Register Place button */}
        <button
          type="button"
          onClick={onRegisterPlaceClick}
          className="hidden items-center gap-2 rounded-full bg-[#355e1d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d4f18] sm:flex"
        >
          <Plus size={18} />
          Register Place
        </button>

        {/* Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-[#F0F5ED]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce8c8] text-xs font-bold text-[#355e1d]">
              {initials}
            </div>
            <ChevronDown className="h-4 w-4 text-[#64748B]" />
          </button>

          {isMenuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#D4E5C4] bg-white shadow-xl">
                <div className="border-b border-[#D4E5C4] px-4 py-3">
                  <p className="text-sm font-semibold text-[#001910]">{displayName}</p>
                  <p className="text-xs text-[#64748B]">{user?.email || ""}</p>
                </div>
                <button className="block w-full px-4 py-2.5 text-left text-sm text-[#001910] hover:bg-[#F0F5ED]">
                  Map
                </button>
                <button className="block w-full px-4 py-2.5 text-left text-sm text-[#64748B] hover:bg-[#F0F5ED]">
                  My Places (coming soon)
                </button>
                <button className="block w-full px-4 py-2.5 text-left text-sm text-[#64748B] hover:bg-[#F0F5ED]">
                  Itineraries (coming soon)
                </button>
                <div className="border-t border-[#D4E5C4]" />
                <button
                  onClick={logoutUser}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default MapNavbar