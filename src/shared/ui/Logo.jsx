import { MapPin } from "lucide-react"

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dce8c8]">
        <MapPin className="h-6 w-6 text-[#355e1d]" />
      </div>
      <span className="text-2xl font-semibold text-black">NetSuggest</span>
    </div>
  )
}

export default Logo