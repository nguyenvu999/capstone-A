package com.example.netsuggest.auth;

import com.example.netsuggest.auth.entity.User;
import com.example.netsuggest.auth.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Xử lý sau khi đăng nhập Microsoft thành công.
     * 1. Lưu/Cập nhật thông tin người dùng vào Supabase (Postgres).
     * 2. Tạo Session ID mới (UUID).
     * 3. Thiết lập Cookie HttpOnly tồn tại trong 6 tiếng.
     */
    @GetMapping("/login/success")
    public void loginSuccess(OAuth2AuthenticationToken authentication, HttpServletResponse response) throws Exception {
        if (authentication != null) {
            Map<String, Object> attrs = authentication.getPrincipal().getAttributes();
            String email = (String) attrs.get("email");
            String name = (String) attrs.get("name");
            String sub = (String) attrs.get("sub");

            // --- LƯU TRỮ VÀO DATABASE (ĐÃ BỎ AVATAR) ---
            User user = userRepository.findByEmail(email).orElse(new User());
            user.setEmail(email);
            user.setFullName(name);
            user.setMicrosoftId(sub);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // --- QUẢN LÝ PHIÊN ĐĂNG NHẬP (6 TIẾNG) ---
            // Mỗi lần đăng nhập tạo 1 UUID mới, token cũ bị ghi đè/vứt bỏ
            String sessionToken = UUID.randomUUID().toString();

            Cookie cookie = new Cookie("access_token", sessionToken);
            cookie.setHttpOnly(true); // Bảo mật: JavaScript không thể truy cập
            cookie.setPath("/");
            cookie.setMaxAge(6 * 3600); // 21,600 giây = 6 tiếng
            // cookie.setSecure(true); // Kích hoạt nếu dùng HTTPS
            response.addCookie(cookie);
            response.setHeader("Set-Cookie", "access_token=" + sessionToken + "; Path=/; Max-Age=21600; HttpOnly; Secure; SameSite=None");
        }
        
        String frontendUrl = System.getenv("capstone-a.vercel.app"); // Ví dụ: https://capstone-a.vercel.app
        response.sendRedirect(frontendUrl + "/auth/callback");
    }

    /**
     * Lấy thông tin người dùng hiện tại từ Security Context.
     */
    @GetMapping("/auth/me")
    public ResponseEntity<?> getMe(OAuth2AuthenticationToken authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(authentication.getPrincipal().getAttributes());
    }

    /**
     * Đăng xuất và vô hiệu hóa Token.
     * Đảm bảo các token cũ sẽ expire (hủy) hoàn toàn trên cả Client và Server.
     */
    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // 1. Xóa Cookies phía trình duyệt bằng cách set MaxAge = 0
        clearCookie(response, "access_token");
        clearCookie(response, "JSESSIONID");

        // 2. Vô hiệu hóa Session trên RAM của Server
        // Lệnh này khiến token cũ không còn tác dụng để gọi API được nữa
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // 3. Xóa thông tin xác thực trong SecurityContext của Spring
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok("Logged out successfully");
    }

    /**
     * Helper xóa cookie nhanh
     */
    private void clearCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }
}