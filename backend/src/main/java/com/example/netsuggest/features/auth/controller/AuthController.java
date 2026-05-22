package com.example.netsuggest.features.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        // Trích xuất metadata từ token giải mã của Supabase
        String supabaseUid = jwt.getSubject(); // Chuỗi UUID tài khoản
        String email = jwt.getClaimAsString("email"); // Email tài khoản

        return ResponseEntity.ok(Map.of(
            "id", supabaseUid,
            "email", email
        ));
    }
}