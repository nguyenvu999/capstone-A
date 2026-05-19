package com.example.netsuggest.places.repository;

import com.example.netsuggest.places.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {

    Page<Review> findByPlaceIdOrderByIdDesc(String placeId, Pageable pageable);

    List<Review> findByPlaceIdAndUserId(String placeId, String userId);

    @Query(value = "SELECT rating, COUNT(*) FROM reviews WHERE place_id = ?1 GROUP BY rating", nativeQuery = true)
    List<Object[]> getRatingDistribution(String placeId);
}