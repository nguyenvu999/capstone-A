import { supabase } from "../../auth/api/supabaseClient";

export async function fetchReviewsByPlace(placeId) {
  try {
    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("place_id", String(placeId))
      .order("created_at", { ascending: false });

    if (reviewError) throw reviewError;

    const reviewIds = (reviews || []).map((r) => r.id);

    if (reviewIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: images, error: imageError } = await supabase
      .from("review_images")
      .select("id, review_id, url, sort_order")
      .in("review_id", reviewIds)
      .order("sort_order", { ascending: true });

    if (imageError) throw imageError;

    const reviewsWithImages = reviews.map((review) => ({
      ...review,
      review_images: (images || []).filter(
        (img) => String(img.review_id) === String(review.id)
      ),
    }));

    return { data: reviewsWithImages, error: null };
  } catch (error) {
    console.error("fetchReviewsByPlace error:", error);
    return { data: null, error };
  }
}
// Insert or update a review
// Logic: 1 user can only have 1 review per place
 
export async function upsertReview({ placeId, userId, userName, rating, comment }) {
  try {
    // Check if review exists
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("place_id", String(placeId))
      .eq("user_id", String(userId))
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found (OK)
      throw checkError;
    }

    let result;
    if (existingReview) {
      // UPDATE existing review
      result = await supabase
        .from("reviews")
        .update({
          rating: Number(rating),
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .select()
        .single();
    } else {
      // INSERT new review
      result = await supabase
        .from("reviews")
        .insert([
          {
            place_id: String(placeId),
            user_id: String(userId),
            user_name: userName,
            rating: Number(rating),
            comment: comment || null,
            created_at: new Date().toISOString(), 
          },
        ])
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Update places.rating and review_count
    await updatePlaceRating(placeId);

    return { data: result.data, error: null };
  } catch (error) {
    console.error("upsertReview error:", error);
    return { data: null, error };
  }
}

// Delete a review
export async function deleteReview(reviewId, placeId) {
  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) throw error;

    // Update places.rating and review_count
    await updatePlaceRating(placeId);

    return { error: null };
  } catch (error) {
    console.error("deleteReview error:", error);
    return { error };
  }
}

// Update place's average rating and review count
// Called after insert/update/delete review

async function updatePlaceRating(placeId) {
  try {
    // Fetch all reviews for this place
    const { data: reviews, error: fetchError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("place_id", String(placeId));

    if (fetchError) throw fetchError;

    // Calculate average rating
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviewCount
      : 0;

    // Update places table
    const { error: updateError } = await supabase
      .from("places")
      .update({
        rating: Number(avgRating.toFixed(1)), // Round to 1 decimal
        review_count: reviewCount,
      })
      .eq("id", placeId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error("updatePlaceRating error:", error);
    return { error };
  }
}