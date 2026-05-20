import { useMemo, useState } from "react"
import { ChevronDown, LogOut, MapPin, Search, Plus } from "lucide-react"
import { useAuth } from "../../auth/context/AuthContext"

function MapNavbar({ onRegisterPlaceClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logoutUser } = useAuth()

  // 1. Lấy tên hiển thị từ data (Vu Vu Pham Nguyen)
  const displayName = user?.name || user?.preferred_username || "User"
  const userEmail = user?.email || user?.preferred_username || ""

  // 2. Logic lấy 2 chữ cái đầu tiên (Ví dụ: Vu Vu... -> VV)
  const initials = useMemo(() => {
    // Loại bỏ khoảng trắng thừa và tách các từ
    const words = displayName.trim().split(/\s+/)
    if (words.length >= 2) {
      // Lấy chữ cái đầu của từ thứ 1 và từ thứ 2
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    // Nếu chỉ có 1 từ, lấy 2 chữ cái đầu của từ đó
    return displayName.slice(0, 2).toUpperCase()
  }, [displayName])

  return (
    <header className="sticky top-0 z-40 border-b border-[#D4E5C4] bg-white">
      <div className="mx-auto flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* ... (Các phần Logo và Search giữ nguyên) ... */}
        
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dce8c8]">
            <MapPin className="h-5 w-5 text-[#355e1d]" />
          </div>
          <span className="text-xl font-semibold text-black">NetSuggest</span>
        </div>

        <div className="mx-auto hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
            <input
              placeholder="Search places..."
              className="h-10 w-full rounded-full border-0 bg-[#F0F5ED] pl-11 pr-4 text-sm outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onRegisterPlaceClick}
          className="hidden items-center gap-2 rounded-full bg-[#355e1d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d4f18] sm:flex"
        >
          <Plus size={18} />
          Register Place
        </button>

        {/* Dropdown User */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-[#F0F5ED]"
          >
            {/* FIX AVATAR Ở ĐÂY: Loại bỏ user.picture nếu nó gây lỗi icon vỡ */}
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#dce8c8] text-sm font-bold text-[#355e1d] border-2 border-white shadow-sm">
              {/* Vì URL picture từ Microsoft thường bị lỗi 403/Access Denied khi gọi trực tiếp,
                tốt nhất là ưu tiên hiển thị Initials (VV) để giao diện sạch sẽ.
              */}
              {initials}
            </div>
            <ChevronDown className="h-4 w-4 text-[#64748B]" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#D4E5C4] bg-white shadow-xl">
                <div className="border-b border-[#D4E5C4] px-4 py-3 bg-[#FBFDF9]">
                  <p className="truncate text-sm font-bold text-[#001910]">{displayName}</p>
                  <p className="truncate text-xs text-[#64748B]">{userEmail}</p>
                </div>
                <div className="py-1">
                  <button className="block w-full px-4 py-2.5 text-left text-sm text-[#001910] hover:bg-[#F0F5ED]">
                    Map
                  </button>
                  <button className="block w-full px-4 py-2.5 text-left text-sm text-[#64748B] hover:bg-[#F0F5ED]">
                    My Places (coming soon)
                  </button>
                  <button className="block w-full px-4 py-2.5 text-left text-sm text-[#64748B] hover:bg-[#F0F5ED]">
                    Itineraries (coming soon)
                  </button>
                </div>
                <div className="border-t border-[#D4E5C4]" />
                <button
                  onClick={logoutUser}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
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