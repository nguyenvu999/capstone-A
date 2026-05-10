package com.example.netsuggest.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class AuthController {

    @GetMapping("/login/success")
    public void loginSuccess(OAuth2AuthenticationToken authentication, HttpServletResponse response) throws Exception {
        if (authentication != null) {
            // 1. Tạo UUID ngẫu nhiên để Token cũ không bao giờ dùng lại được
            String newToken = UUID.randomUUID().toString();

            // 2. Thiết lập Cookie 6 tiếng (21600s)
            Cookie cookie = new Cookie("access_token", newToken);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(6 * 3600);
            response.addCookie(cookie);
        }
        response.sendRedirect("http://localhost:5173/auth/callback");
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> getMe(OAuth2AuthenticationToken authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authentication.getPrincipal().getAttributes());
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // Xóa Cookies phía Client
        clearCookie(response, "access_token");
        clearCookie(response, "JSESSIONID");

        // Vô hiệu hóa Session trên Server ngay lập tức
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok().build();
    }

    private void clearCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}