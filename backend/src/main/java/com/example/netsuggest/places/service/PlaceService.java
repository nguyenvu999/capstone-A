package com.example.netsuggest.places.service;

import com.example.netsuggest.places.entity.*;
import com.example.netsuggest.places.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

@Service
public class PlaceService {

    @Autowired private PlaceRepository placeRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private PlaceImageRepository placeImageRepository;

    public Map<String, Object> getPlaces(List<String> categories, List<Integer> prices, String status, 
                                         Double minRating, Double lat, Double lng, Double radius, 
                                         String search, int page, int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit);
        
        // Nếu truyền radius mét từ Postman (ví dụ: 5000), chia 1000 thành km. Nếu null mặc định là 5km
        Double radiusKm = (radius != null) ? radius / 1000.0 : 5.0;

        boolean hasPrices = (prices != null && !prices.isEmpty());
        boolean hasCategories = (categories != null && !categories.isEmpty());

        Page<Place> resultPage = placeRepository.findPlacesWithFilters(
                search, status, minRating, prices, hasPrices, categories, hasCategories, lat, lng, radiusKm, pageable);

        List<Map<String, Object>> outList = new ArrayList<>();
        for (Place p : resultPage.getContent()) {
            Double distance = null;
            if (lat != null && lng != null && p.getLatitude() != null && p.getLongitude() != null) {
                // Tính khoảng cách Haversine trực tiếp bằng Java để đảm bảo chính xác và hiệu năng
                distance = calculateHaversine(lat, lng, p.getLatitude(), p.getLongitude());
            }
            outList.add(mapToPlaceJson(p, distance));
        }

        // Sắp xếp danh sách kết quả theo khoảng cách từ gần đến xa nếu có tọa độ đầu vào
        if (lat != null && lng != null) {
            outList.sort((m1, m2) -> {
                Double d1 = (Double) m1.get("distance");
                Double d2 = (Double) m2.get("distance");
                if (d1 == null) return 1;
                if (d2 == null) return -1;
                return d1.compareTo(d2);
            });
        }

        return Map.of("data", outList, "total", resultPage.getTotalElements(), "page", page, "limit", limit);
    }

    private Double calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        double EarthRadius = 6371.0; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((EarthRadius * c) * 10.0) / 10.0; // Làm tròn 1 chữ số thập phân giống code cũ của bạn
    }

    public Map<String, Object> getPlaceDetail(Long id) {
        Place p = placeRepository.findById(id).orElse(null);
        if (p == null) return null;

        Map<String, Object> baseData = mapToPlaceJson(p, null);

        List<Map<String, Object>> hours = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            Map<String, Object> hourMap = new HashMap<>();
            hourMap.put("day_of_week", i);
            hourMap.put("open_time", "10:00");
            hourMap.put("close_time", "22:00");
            hourMap.put("is_closed", false);
            hours.add(hourMap);
        }

        List<Object[]> distRows = reviewRepository.getRatingDistribution(id);
        Map<String, Long> dist = new HashMap<>(Map.of("1", 0L, "2", 0L, "3", 0L, "4", 0L, "5", 0L));
        for (Object[] r : distRows) {
            if (r[0] != null) {
                dist.put(String.valueOf(r[0]), ((Number) r[1]).longValue());
            }
        }

        return Map.of(
            "data", baseData,
            "opening_hours", hours,
            "rating_distribution", dist
        );
    }

    @Transactional
    public Map<String, Object> createPlace(Map<String, Object> body) {
        String name = (String) body.get("name");
        String address = (String) body.get("address");
        String city = (String) body.get("city");

        List<Place> duplicates = placeRepository.findDuplicatePlace(name, address, city);
        if (!duplicates.isEmpty()) {
            throw new IllegalStateException("duplicate");
        }

        Place p = new Place();
        p.setName(name);
        p.setAddress(address);
        p.setCity(city);
        p.setDescription((String) body.get("description"));
        p.setLatitude(Double.parseDouble(body.get("latitude").toString()));
        p.setLongitude(Double.parseDouble(body.get("longitude").toString()));
        p.setPriceLevel(Integer.parseInt(body.get("price_level").toString()));

        List<String> catIds = (List<String>) body.get("category_ids");
        if (catIds != null) {
            p.setCategories(categoryRepository.findAllById(catIds));
        }

        Place saved = placeRepository.save(p);
        return mapToPlaceJson(saved, null);
    }

    public Map<String, Object> getExistingDuplicateInfo(Map<String, Object> body) {
        List<Place> duplicates = placeRepository.findDuplicatePlace(
            (String) body.get("name"), (String) body.get("address"), (String) body.get("city"));
        if (duplicates.isEmpty()) return Map.of();
        Place ep = duplicates.get(0);
        return Map.of("id", ep.getId(), "name", ep.getName(), "address", ep.getAddress());
    }

    @Transactional
    public List<Map<String, Object>> uploadImages(Long placeId, MultipartFile[] files) {
        Place p = placeRepository.findById(placeId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        List<Map<String, Object>> savedList = new ArrayList<>();
        try {
            String uploadDir = "uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            for (int i = 0; i < Math.min(files.length, 5); i++) {
                String filename = "place_" + placeId + "_" + System.currentTimeMillis() + "_" + files[i].getOriginalFilename();
                Files.write(Paths.get(uploadDir + filename), files[i].getBytes());

                String url = "http://localhost:8080/api/places/uploads/" + filename;
                PlaceImage img = new PlaceImage();
                img.setPlace(p);
                img.setUrl(url);
                img.setSortOrder(i);
                PlaceImage savedImg = placeImageRepository.save(img);

                savedList.add(Map.of("id", savedImg.getId(), "url", savedImg.getUrl(), "sort_order", savedImg.getSortOrder()));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return savedList;
    }

    public Map<String, Object> getReviews(Long placeId, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Review> reviewPage = reviewRepository.findByPlaceIdOrderByIdDesc(placeId, pageable);

        List<Map<String, Object>> list = new ArrayList<>();
        for (Review r : reviewPage.getContent()) {
            list.add(Map.of(
                "id", r.getId(),
                "user", Map.of("id", r.getUserId(), "name", r.getUserName(), "avatar_url", Optional.ofNullable(null)),
                "rating", r.getRating(),
                "comment", r.getComment(),
                "helpful_count", r.getHelpfulCount(),
                "created_at", r.getCreatedAt().toString()
            ));
        }
        return Map.of("data", list, "total", reviewPage.getTotalElements(), "page", page, "limit", limit);
    }

    @Transactional
    public Map<String, Object> addReview(Long placeId, Map<String, Object> body) {
        Long mockUserId = 5L;
        List<Review> existing = reviewRepository.findByPlaceIdAndUserId(placeId, mockUserId);
        if (!existing.isEmpty()) {
            throw new IllegalArgumentException("You have already reviewed this place");
        }

        Review r = new Review();
        r.setPlaceId(placeId);
        r.setRating(Integer.parseInt(body.get("rating").toString()));
        r.setComment((String) body.get("comment"));
        Review saved = reviewRepository.save(r);

        Place p = placeRepository.findById(placeId).orElseThrow();
        
        Page<Review> allReviewsPage = reviewRepository.findByPlaceIdOrderByIdDesc(placeId, Pageable.unpaged());
        List<Review> allReviews = allReviewsPage.getContent();
        
        double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        p.setReviewCount(allReviews.size());
        p.setRating(Math.round(avg * 10.0) / 10.0);
        placeRepository.save(p);

        return Map.of("id", saved.getId(), "rating", saved.getRating(), "comment", saved.getComment(), "created_at", saved.getCreatedAt().toString());
    }

    private Map<String, Object> mapToPlaceJson(Place p, Double distance) {
        Map<String, Object> json = new HashMap<>();
        json.put("id", p.getId());
        json.put("name", p.getName());
        json.put("description", p.getDescription() != null ? p.getDescription() : "");
        json.put("address", p.getAddress());
        json.put("city", p.getCity());
        json.put("latitude", p.getLatitude());
        json.put("longitude", p.getLongitude());
        json.put("price_level", p.getPriceLevel());
        json.put("business_status", p.getBusinessStatus());
        json.put("source", p.getSource());
        json.put("rating", p.getRating());
        json.put("review_count", p.getReviewCount());
        json.put("distance", distance != null ? distance : 0.0);
        json.put("created_at", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");

        Map<String, Object> createdBy = new HashMap<>();
        createdBy.put("id", p.getCreatedById());
        createdBy.put("name", p.getCreatedByName());
        json.put("created_by", createdBy);

        List<Map<String, Object>> cats = new ArrayList<>();
        if (p.getCategories() != null) {
            for (Category c : p.getCategories()) {
                Map<String, Object> catMap = new HashMap<>();
                catMap.put("id", c.getId());
                catMap.put("name", c.getName());
                catMap.put("icon", c.getIcon());
                catMap.put("color", c.getColor());
                cats.add(catMap);
            }
        }
        json.put("categories", cats);

        List<Map<String, Object>> imgs = new ArrayList<>();
        if (p.getImages() != null) {
            for (PlaceImage i : p.getImages()) {
                Map<String, Object> imgMap = new HashMap<>();
                imgMap.put("id", i.getId());
                imgMap.put("url", i.getUrl());
                imgMap.put("sort_order", i.getSortOrder());
                imgs.add(imgMap);
            }
        }
        json.put("images", imgs);

        return json;
    }
}