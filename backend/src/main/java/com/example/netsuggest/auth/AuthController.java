package com.example.netsuggest.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class AuthController {

    // 1. Sau khi MS thành công, lưu Cookie và nhảy về trang trung gian của React
    @GetMapping("/login/success")
    public String loginSuccess(OAuth2AuthenticationToken authentication, HttpServletResponse response) {
        if (authentication != null) {
            String token = "dummy-session-token"; // Hoặc lấy từ authentication.getPrincipal()
            Cookie cookie = new Cookie("access_token", token);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(3600);
            response.addCookie(cookie);
        }
        // Redirect về trang callback của React để xử lý nốt logic UI
        return "redirect:http://localhost:5173/auth/callback";
    }

    // 2. Endpoint để React lấy thông tin user (getMe)
    @GetMapping("/auth/me")
    @ResponseBody
    public ResponseEntity<?> getMe(OAuth2AuthenticationToken authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authentication.getPrincipal().getAttributes());
    }

    // 3. Logout xóa Cookie
    @PostMapping("/auth/logout")
    @ResponseBody
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("access_token", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }
}