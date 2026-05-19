package com.example.netsuggest.places.service;

import com.example.netsuggest.places.entity.*;
import com.example.netsuggest.places.repository.*;
import com.example.netsuggest.auth.entity.User;
import com.example.netsuggest.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PlaceService {

    @Autowired private PlaceRepository placeRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private PlaceImageRepository placeImageRepository;
    @Autowired private UserRepository userRepository;

    /**
     * Lấy thông tin User thực tế từ Database thông qua Email trong Session
     */
    private Map<String, String> getCurrentUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, String> userInfo = new HashMap<>();

        if (authentication != null && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getName())) {
            
            Object principal = authentication.getPrincipal();
            
            if (principal instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) principal;
                Map<String, Object> attributes = oauth2User.getAttributes();

                // Lấy email từ token của Microsoft đăng nhập
                String email = null;
                if (attributes.containsKey("email") && attributes.get("email") != null) {
                    email = attributes.get("email").toString();
                } else if (attributes.containsKey("preferred_username") && attributes.get("preferred_username") != null) {
                    email = attributes.get("preferred_username").toString();
                }

                // Truy vấn thẳng xuống bảng users dựa trên email để lấy ID thật của ứng dụng
                if (email != null && !email.isEmpty()) {
                    Optional<User> appUserOpt = userRepository.findByEmail(email);
                    if (appUserOpt.isPresent()) {
                        User appUser = appUserOpt.get();
                        userInfo.put("id", appUser.getId()); 
                        userInfo.put("name", appUser.getFullName());
                        return userInfo;
                    }
                }
            }
        }

        // Nếu không tìm thấy session hoặc user chưa đồng bộ, trả về rỗng/null để hệ thống tự biết xử lý
        userInfo.put("id", null);
        userInfo.put("name", null);
        return userInfo;
    }

    public Map<String, Object> getPlaces(List<String> categories, List<Integer> prices, String status, 
                                         Double minRating, Double lat, Double lng, Double radius, 
                                         String search, int page, int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit);
        Double radiusKm = (radius != null) ? radius / 1000.0 : 5.0;
        boolean hasPrices = (prices != null && !prices.isEmpty());
        boolean hasCategories = (categories != null && !categories.isEmpty());

        Page<Place> resultPage = placeRepository.findPlacesWithFilters(
                search, status, minRating, prices, hasPrices, categories, hasCategories, lat, lng, radiusKm, pageable);

        List<Map<String, Object>> outList = new ArrayList<>();
        for (Place p : resultPage.getContent()) {
            Double distance = null;
            if (lat != null && lng != null && p.getLatitude() != null && p.getLongitude() != null) {
                distance = calculateHaversine(lat, lng, p.getLatitude(), p.getLongitude());
            }
            outList.add(mapToPlaceJson(p, distance));
        }

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
        double EarthRadius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((EarthRadius * c) * 10.0) / 10.0;
    }

    public Map<String, Object> getPlaceDetail(String placeId) {
        Place p = placeRepository.findById(placeId).orElse(null);
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

        List<Object[]> distRows = reviewRepository.getRatingDistribution(placeId);
        Map<String, Long> dist = new HashMap<>(Map.of("1", 0L, "2", 0L, "3", 0L, "4", 0L, "5", 0L));
        for (Object[] r : distRows) {
            if (r[0] != null) {
                dist.put(String.valueOf(r[0]), ((Number) r[1]).longValue());
            }
        }

        return Map.of("data", baseData, "opening_hours", hours, "rating_distribution", dist);
    }

    @Transactional
    public Map<String, Object> createPlace(Map<String, Object> body) {
        try {
            String name = body.get("name") != null ? body.get("name").toString().trim() : null;
            String address = body.get("address") != null ? body.get("address").toString().trim() : null;
            String city = body.get("city") != null ? body.get("city").toString().trim() : null;

            if (name == null || address == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and Address are required!");
            }

            List<Place> duplicates = placeRepository.findDuplicatePlace(name, address, city);
            if (!duplicates.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "duplicate");
            }

            Place p = new Place();
            p.setName(name);
            p.setAddress(address);
            p.setCity(city);
            p.setDescription(body.get("description") != null ? body.get("description").toString() : "");
            
            p.setBusinessStatus(body.get("business_status") != null ? body.get("business_status").toString() : "open");
            p.setSource("manual");
            p.setRating(0.0);
            p.setReviewCount(0);
            p.setCreatedAt(LocalDateTime.now());
            p.setUpdatedAt(LocalDateTime.now());

            // Thực hiện gán dữ liệu User sạch từ DB
            Map<String, String> currentUser = getCurrentUserInfo();
            if (currentUser.get("id") == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập trước khi tạo địa điểm!");
            }
            p.setCreatedById(currentUser.get("id")); 
            p.setCreatedByName(currentUser.get("name"));

            if (body.get("latitude") != null) p.setLatitude(Double.parseDouble(body.get("latitude").toString()));
            if (body.get("longitude") != null) p.setLongitude(Double.parseDouble(body.get("longitude").toString()));
            p.setPriceLevel(body.get("price_level") != null ? Integer.parseInt(body.get("price_level").toString()) : 0);

            Object catIdsObj = body.get("category_ids");
            if (catIdsObj instanceof List<?>) {
                List<?> rawList = (List<?>) catIdsObj;
                List<String> catIds = new ArrayList<>();
                for (Object obj : rawList) {
                    if (obj != null) catIds.add(obj.toString());
                }
                if (!catIds.isEmpty()) {
                    p.setCategories(categoryRepository.findAllById(catIds));
                }
            }

            Place saved = placeRepository.save(p);
            return mapToPlaceJson(saved, null);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("--- ERROR DURING PLACE CREATION ---");
            e.printStackTrace(); 
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Database operational error: " + e.getMessage());
        }
    }

    public Map<String, Object> getExistingDuplicateInfo(Map<String, Object> body) {
        String name = body.get("name") != null ? body.get("name").toString() : null;
        String address = body.get("address") != null ? body.get("address").toString().trim() : null;
        String city = body.get("city") != null ? body.get("city").toString().trim() : null;

        List<Place> duplicates = placeRepository.findDuplicatePlace(name, address, city);
        if (duplicates.isEmpty()) return Map.of();
        Place ep = duplicates.get(0);
        return Map.of("id", ep.getId(), "name", ep.getName(), "address", ep.getAddress());
    }

    @Transactional
    public List<Map<String, Object>> uploadImages(String placeId, MultipartFile[] files) {
        Place p = placeRepository.findById(placeId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
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

    public Map<String, Object> getReviews(String placeId, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Review> reviewPage = reviewRepository.findByPlaceIdOrderByIdDesc(placeId, pageable);

        List<Map<String, Object>> list = new ArrayList<>();
        for (Review r : reviewPage.getContent()) {
            list.add(Map.of(
                "id", r.getId(),
                "user", Map.of("id", r.getUserId(), "name", r.getUserName() != null ? r.getUserName() : "Anonymous", "avatar_url", Optional.ofNullable(null)),
                "rating", r.getRating(),
                "comment", r.getComment() != null ? r.getComment() : "",
                "helpful_count", r.getHelpfulCount() != null ? r.getHelpfulCount() : 0,
                "created_at", r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""
            ));
        }
        return Map.of("data", list, "total", reviewPage.getTotalElements(), "page", page, "limit", limit);
    }

    @Transactional
    public Map<String, Object> addReview(String placeId, Map<String, Object> body) {
        Map<String, String> currentUser = getCurrentUserInfo();
        String currentUserId = currentUser.get("id");

        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập trước khi bình luận!");
        }

        List<Review> existing = reviewRepository.findByPlaceIdAndUserId(placeId, currentUserId);
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already reviewed this place");
        }

        Review r = new Review();
        r.setPlaceId(placeId);
        r.setUserId(currentUserId);
        r.setUserName(currentUser.get("name"));
        r.setRating(Integer.parseInt(body.get("rating").toString()));
        r.setComment((String) body.get("comment"));
        r.setHelpfulCount(0);
        r.setCreatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(r);

        Place p = placeRepository.findById(placeId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));

        Page<Review> allReviewsPage = reviewRepository.findByPlaceIdOrderByIdDesc(placeId, Pageable.unpaged());
        List<Review> allReviews = allReviewsPage.getContent();

        double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        p.setReviewCount(allReviews.size());
        p.setRating(Math.round(avg * 10.0) / 10.0);
        placeRepository.save(p);

        return Map.of("id", saved.getId(), "rating", saved.getRating(), "comment", saved.getComment() != null ? saved.getComment() : "", "created_at", saved.getCreatedAt().toString());
    }

    private Map<String, Object> mapToPlaceJson(Place p, Double distance) {
        Map<String, Object> json = new HashMap<>();
        json.put("id", p.getId());
        json.put("name", p.getName());
        json.put("description", p.getDescription() != null ? p.getDescription() : "");
        json.put("address", p.getAddress());
        json.put("city", p.getCity() != null ? p.getCity() : "");
        json.put("latitude", p.getLatitude());
        json.put("longitude", p.getLongitude());
        json.put("price_level", p.getPriceLevel() != null ? p.getPriceLevel() : 0);
        json.put("business_status", p.getBusinessStatus() != null ? p.getBusinessStatus() : "open");
        json.put("source", p.getSource() != null ? p.getSource() : "manual");
        json.put("rating", p.getRating() != null ? p.getRating() : 0.0);
        json.put("review_count", p.getReviewCount() != null ? p.getReviewCount() : 0);
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