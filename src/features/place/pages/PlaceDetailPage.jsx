// // PlaceDetailPage.jsx
// // Trang hiển thị chi tiết place với images, info, reviews

// import { useState, useEffect } from "react"
// import { useParams, useNavigate, Link } from "react-router-dom"
// import { ArrowLeft, Star, MapPin, Clock, Share2, AlertCircle } from "lucide-react"
// import { getPlaceById } from "../../map/api/placesApi"
// import { getReviews } from "../../map/api/reviewsApi"
// import { BUSINESS_STATUSES } from "../../map/constants/mapConstants"
// import WriteReviewModal from "../components/WriteReviewModal"
// import PageLoader from "../../../shared/ui/PageLoader"

// function PlaceDetailPage() {
//   const { id } = useParams()
//   const navigate = useNavigate()

//   // Place data
//   const [place, setPlace] = useState(null)
//   const [reviews, setReviews] = useState([])
//   const [reviewsTotal, setReviewsTotal] = useState(0)
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(null)

//   // UI state
//   const [showWriteReview, setShowWriteReview] = useState(false)
//   const [currentImageIndex, setCurrentImageIndex] = useState(0)

//   // Fetch place detail khi component mount
//   useEffect(() => {
//     fetchPlaceDetail()
//     fetchReviews()
//   }, [id])

//   const fetchPlaceDetail = async () => {
//     setIsLoading(true)
//     setError(null)
//     try {
//       const response = await getPlaceById(id)
//       setPlace(response.data)
//     } catch (err) {
//       console.error('Failed to fetch place:', err)
//       setError('Failed to load place details')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const fetchReviews = async () => {
//     try {
//       const response = await getReviews(id, 1, 15)
//       setReviews(response.data || [])
//       setReviewsTotal(response.total || 0)
//     } catch (err) {
//       console.error('Failed to fetch reviews:', err)
//     }
//   }

//   // Handle review submitted
//   const handleReviewSubmitted = () => {
//     fetchPlaceDetail() // Refresh để update rating
//     fetchReviews() // Refresh reviews list
//   }

//   if (isLoading) {
//     return <PageLoader text="Loading place details..." />
//   }

//   if (error || !place) {
//     return (
//       <div className="flex min-h-screen items-center justify-center">
//         <div className="text-center">
//           <AlertCircle size={48} className="mx-auto text-red-500" />
//           <p className="mt-4 text-lg text-[#001910]">{error || 'Place not found'}</p>
//           <button
//             onClick={() => navigate('/map')}
//             className="mt-4 text-sm text-[#355e1d] hover:underline"
//           >
//             Back to map
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // Get business status
//   const businessStatus = BUSINESS_STATUSES.find(s => s.value === place.business_status) || BUSINESS_STATUSES[0]

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Back button */}
//       <div className="border-b border-[#D4E5C4] bg-white px-4 py-4">
//         <Link
//           to="/map"
//           className="inline-flex items-center gap-2 text-sm text-[#355e1d] hover:underline"
//         >
//           <ArrowLeft size={18} />
//           Back to map
//         </Link>
//       </div>

//       <div className="mx-auto max-w-4xl px-4 py-6">
//         {/* Image Gallery */}
//         {place.images && place.images.length > 0 && (
//           <div className="space-y-3">
//             {/* Main image */}
//             <div className="relative h-[400px] overflow-hidden rounded-xl bg-[#F0F5ED]">
//               <img
//                 src={place.images[currentImageIndex].url}
//                 alt={place.name}
//                 className="h-full w-full object-cover"
//               />
//             </div>

//             {/* Thumbnails */}
//             {place.images.length > 1 && (
//               <div className="flex gap-3 overflow-x-auto pb-2">
//                 {place.images.map((img, idx) => (
//                   <button
//                     key={img.id}
//                     onClick={() => setCurrentImageIndex(idx)}
//                     className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-lg ${
//                       idx === currentImageIndex ? 'ring-2 ring-[#355e1d]' : ''
//                     }`}
//                   >
//                     <img src={img.url} alt="" className="h-full w-full object-cover" />
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Place Info */}
//         <div className="mt-6">
//           <h1 className="text-2xl font-bold text-[#001910]">{place.name}</h1>

//           {/* Badges */}
//           <div className="mt-3 flex flex-wrap items-center gap-3">
//             {/* Categories */}
//             {place.categories && place.categories.map((cat) => (
//               <span
//                 key={cat.id}
//                 className="rounded-full px-3 py-1 text-sm"
//                 style={{
//                   backgroundColor: `${cat.color || '#355e1d'}20`,
//                   color: cat.color || '#355e1d',
//                 }}
//               >
//                 {cat.name}
//               </span>
//             ))}

//             {/* Price */}
//             {place.price_level && (
//               <span className="rounded-full bg-[#F0F5ED] px-3 py-1 text-sm text-[#64748B]">
//                 {'$'.repeat(place.price_level)}
//               </span>
//             )}

//             {/* Rating */}
//             {place.rating && (
//               <div className="flex items-center gap-1">
//                 <Star size={16} className="fill-yellow-400 text-yellow-400" />
//                 <span className="font-medium">{place.rating}</span>
//                 <span className="text-[#64748B]">({place.review_count} reviews)</span>
//               </div>
//             )}
//           </div>

//           {/* Address & Status */}
//           <div className="mt-4 space-y-2">
//             <div className="flex items-start gap-2 text-[#64748B]">
//               <MapPin size={16} className="mt-0.5 shrink-0" />
//               <span className="text-sm">{place.address}</span>
//             </div>

//             <div className="flex items-center gap-2">
//               <Clock size={16} className="text-[#64748B]" />
//               <span
//                 className="flex items-center gap-1 text-sm font-medium"
//                 style={{ color: businessStatus.textColor }}
//               >
//                 <span
//                   className="h-2 w-2 rounded-full"
//                   style={{ backgroundColor: businessStatus.dotColor }}
//                 />
//                 {businessStatus.label}
//               </span>
//             </div>
//           </div>

//           {/* Description */}
//           {place.description && (
//             <div className="mt-6">
//               <h2 className="text-lg font-bold text-[#001910]">About this place</h2>
//               <p className="mt-2 text-[#64748B] leading-relaxed">{place.description}</p>
//             </div>
//           )}

//           {/* Actions */}
//           <div className="mt-6 flex gap-3">
//             <button className="rounded-full border border-[#D4E5C4] px-4 py-2 text-sm font-medium text-[#001910] transition hover:bg-[#F0F5ED]">
//               <Share2 size={16} className="mr-2 inline" />
//               Share
//             </button>
//           </div>
//         </div>

//         {/* Reviews Section */}
//         <div className="mt-10 border-t border-[#D4E5C4] pt-8">
//           <div className="flex items-center justify-between">
//             <h2 className="text-lg font-bold text-[#001910]">
//               Reviews ({reviewsTotal})
//             </h2>
//             <button
//               onClick={() => setShowWriteReview(true)}
//               className="rounded-full bg-[#355e1d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
//             >
//               Write a review
//             </button>
//           </div>

//           {/* Rating Summary */}
//           {place.rating && (
//             <div className="mt-6 flex gap-8">
//               <div className="text-center">
//                 <div className="text-5xl font-bold text-[#001910]">{place.rating}</div>
//                 <div className="mt-2 flex justify-center">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <Star
//                       key={star}
//                       size={18}
//                       className={
//                         star <= Math.round(place.rating)
//                           ? "fill-yellow-400 text-yellow-400"
//                           : "text-[#D4E5C4]"
//                       }
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Rating Distribution */}
//               {place.rating_distribution && (
//                 <div className="flex-1 space-y-2">
//                   {[5, 4, 3, 2, 1].map((stars) => {
//                     const count = place.rating_distribution[stars] || 0
//                     const maxCount = Math.max(...Object.values(place.rating_distribution))
//                     const width = maxCount > 0 ? (count / maxCount) * 100 : 0
//                     return (
//                       <div key={stars} className="flex items-center gap-2">
//                         <span className="w-4 text-sm text-[#64748B]">{stars}</span>
//                         <Star size={14} className="fill-yellow-400 text-yellow-400" />
//                         <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0F5ED]">
//                           <div
//                             className="h-full rounded-full bg-yellow-400"
//                             style={{ width: `${width}%` }}
//                           />
//                         </div>
//                         <span className="w-4 text-sm text-[#64748B]">{count}</span>
//                       </div>
//                     )
//                   })}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Reviews List */}
//           <div className="mt-8 space-y-6">
//             {reviews.length === 0 ? (
//               <p className="text-center text-sm text-[#64748B] py-8">
//                 No reviews yet. Be the first to review!
//               </p>
//             ) : (
//               reviews.map((review) => (
//                 <div key={review.id} className="border-b border-[#D4E5C4] pb-6 last:border-0">
//                   <div className="flex items-center gap-3">
//                     {/* User avatar */}
//                     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce8c8] text-sm font-bold text-[#355e1d]">
//                       {review.user?.name?.charAt(0) || 'U'}
//                     </div>
//                     <div>
//                       <div className="font-medium text-[#001910]">{review.user?.name || 'Anonymous'}</div>
//                       <div className="text-xs text-[#64748B]">
//                         {new Date(review.created_at).toLocaleDateString()}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Rating stars */}
//                   <div className="mt-2 flex">
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <Star
//                         key={star}
//                         size={14}
//                         className={
//                           star <= review.rating
//                             ? "fill-yellow-400 text-yellow-400"
//                             : "text-[#D4E5C4]"
//                         }
//                       />
//                     ))}
//                   </div>

//                   {/* Comment */}
//                   {review.comment && (
//                     <p className="mt-2 text-[#001910]">{review.comment}</p>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Load more reviews (future feature) */}
//           {reviewsTotal > reviews.length && (
//             <button className="mt-6 text-sm text-[#355e1d] hover:underline">
//               Show all {reviewsTotal} reviews
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Write Review Modal */}
//       <WriteReviewModal
//         isOpen={showWriteReview}
//         onClose={() => setShowWriteReview(false)}
//         placeId={id}
//         placeName={place.name}
//         onReviewSubmitted={handleReviewSubmitted}
//       />
//     </div>
//   )
// }

// export default PlaceDetailPage

// PlaceDetailPage.jsx
// Chi tiết place - VERSION ĐƠN GIẢN (không gọi API)

// PlaceDetailPage.jsx
// Chi tiết place - PLACEHOLDER chờ backend

import { useParams, Link } from "react-router-dom"
import { ArrowLeft, MapPin } from "lucide-react"

function PlaceDetailPage() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-white">
      {/* Back button */}
      <div className="border-b border-[#D4E5C4] bg-white px-4 py-4">
        <Link
          to="/map"
          className="inline-flex items-center gap-2 text-sm text-[#355e1d] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to map
        </Link>
      </div>

      {/* Placeholder content */}
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <MapPin size={64} className="mx-auto text-[#8ea183]" />
        <h1 className="mt-6 text-2xl font-bold text-[#001910]">
          Place Detail Page
        </h1>
        <p className="mt-2 text-[#64748B]">
          Place ID: {id}
        </p>
        <p className="mt-4 text-sm text-[#94A3B8]">
          This page will display:
        </p>
        <ul className="mt-4 text-left inline-block text-sm text-[#64748B]">
          <li>• Place images gallery</li>
          <li>• Name, categories, price, rating</li>
          <li>• Address and business status</li>
          <li>• Description</li>
          <li>• Reviews with rating distribution</li>
          <li>• Write review button</li>
        </ul>
        <p className="mt-6 text-xs text-[#94A3B8]">
          Waiting for backend API endpoint: GET /api/places/:id
        </p>
      </div>
    </div>
  )
}

export default PlaceDetailPage