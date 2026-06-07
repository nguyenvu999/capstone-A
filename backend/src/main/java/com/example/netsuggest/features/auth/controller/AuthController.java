package com.example.netsuggest.features.auth.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        if (jwt == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        String supabaseUid = jwt.getSubject();
        String email = jwt.getClaimAsString("email");

        // Trích xuất chuỗi JWT thô từ request đầu vào
        String rawToken = null;
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            rawToken = authHeader.substring(7);
        }

        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok();

        // Nếu tìm thấy chuỗi JWT từ Frontend gửi sang, bọc ngay vào HttpOnly Cookie thời hạn 6 tiếng
        if (rawToken != null) {
            ResponseCookie cookie = ResponseCookie.from("access_token", rawToken)
                    .httpOnly(true)                // Chống hacker dùng mã độc JavaScript đánh cắp Token (XSS)
                    .secure(false)                 // Đặt thành True nếu chạy Production có HTTPS thực tế
                    .path("/")                     // Có hiệu lực cho toàn bộ đường dẫn trên hệ thống
                    .maxAge(21600)                 // Hết hạn tự động sau 6 tiếng đồng hồ 
                    .sameSite("Lax")               // Bảo vệ chống tấn công giả mạo CSRF
                    .build();
            
            responseBuilder.header(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return responseBuilder.body(Map.of(
            "id", supabaseUid,
            "email", email
        ));
    }
}