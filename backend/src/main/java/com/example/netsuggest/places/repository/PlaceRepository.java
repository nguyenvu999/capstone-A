package com.example.netsuggest.places.repository;

import com.example.netsuggest.places.entity.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceRepository extends JpaRepository<Place, String> {

    @Query(value = "SELECT p.* FROM places p " +
            "WHERE (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.address) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:status IS NULL OR p.business_status = :status) " +
            "AND (:minRating IS NULL OR p.rating >= :minRating) " +
            "AND (:hasPrices = false OR p.price_level IN (:prices)) " +
            "AND (:hasCategories = false OR p.id IN (SELECT pc.place_id FROM place_categories pc WHERE pc.category_id IN (:categories))) " +
            "AND (:lat IS NULL OR :lng IS NULL OR (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radiusKm)",
            countQuery = "SELECT count(*) FROM places p " +
            "WHERE (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.address) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:status IS NULL OR p.business_status = :status) " +
            "AND (:minRating IS NULL OR p.rating >= :minRating) " +
            "AND (:hasPrices = false OR p.price_level IN (:prices)) " +
            "AND (:hasCategories = false OR p.id IN (SELECT pc.place_id FROM place_categories pc WHERE pc.category_id IN (:categories))) " +
            "AND (:lat IS NULL OR :lng IS NULL OR (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radiusKm)",
            nativeQuery = true)
    Page<Place> findPlacesWithFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("minRating") Double minRating,
            @Param("prices") List<Integer> prices,
            @Param("hasPrices") boolean hasPrices,
            @Param("categories") List<String> categories,
            @Param("hasCategories") boolean hasCategories,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusKm") Double radiusKm,
            Pageable pageable);

    // Đã sửa: Thay thế hàm similarity() của Postgres bằng câu lệnh so sánh LOWER chuỗi tiêu chuẩn để chạy được trên mọi database
    @Query(value = "SELECT * FROM places WHERE city = :city AND LOWER(name) = LOWER(:name) AND LOWER(address) = LOWER(:address) LIMIT 1", nativeQuery = true)
    List<Place> findDuplicatePlace(@Param("name") String name, @Param("address") String address, @Param("city") String city);
}