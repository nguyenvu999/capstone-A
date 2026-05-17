package com.example.netsuggest.places.controller;

import com.example.netsuggest.places.service.PlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/places")
public class PlaceController {

    @Autowired private PlaceService placeService;

    // 1. GET /places (Đồng bộ ánh xạ từ params sang Service)
    @GetMapping
    public ResponseEntity<?> getPlaces(
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) List<Integer> price,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        
        return ResponseEntity.ok(placeService.getPlaces(category, price, status, minRating, lat, lng, radius, search, page, limit));
    }

    // 2. GET /places/:id
    @GetMapping("/{id}")
    public ResponseEntity<?> getPlaceDetail(@PathVariable Long id) {
        Map<String, Object> detail = placeService.getPlaceDetail(id);
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "not_found", "message", "Place not found"));
        }
        return ResponseEntity.ok(detail);
    }

    // 3. POST /places
    @PostMapping
    public ResponseEntity<?> createPlace(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(placeService.createPlace(body));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "duplicate_place",
                "message", "This place may already exist",
                "existing_place", placeService.getExistingDuplicateInfo(body)
            ));
        }
    }

    // 4. POST /places/:id/images
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadImages(@PathVariable Long id, @RequestParam("images") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "No files uploaded"));
        }
        return ResponseEntity.ok(Map.of("data", placeService.uploadImages(id, files)));
    }

    // 5. GET /places/:id/reviews
    @GetMapping("/{id}/reviews")
    public ResponseEntity<?> getReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(placeService.getReviews(id, page, limit));
    }

    // 6. POST /places/:id/reviews
    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> addReview(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(placeService.addReview(id, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "already_reviewed",
                "message", e.getMessage()
            ));
        }
    }
}