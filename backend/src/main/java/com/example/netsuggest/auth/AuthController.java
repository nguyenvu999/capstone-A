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

    @GetMapping("/login/success")
    public void loginSuccess(OAuth2AuthenticationToken authentication, HttpServletResponse response) throws Exception {
        if (authentication != null) {
            Map<String, Object> attrs = authentication.getPrincipal().getAttributes();
            String email = (String) attrs.get("email");
            String name = (String) attrs.get("name");
            String sub = (String) attrs.get("sub");

            User user = userRepository.findByEmail(email).orElse(new User());
            user.setEmail(email);
            user.setFullName(name);
            user.setMicrosoftId(sub);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            String sessionToken = UUID.randomUUID().toString();

            Cookie cookie = new Cookie("access_token", sessionToken);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(6 * 3600); 
            
            // THAY ĐỔI: Phải setSecure(true) vì Render dùng HTTPS
            // Nếu không có dòng này, trình duyệt sẽ chặn cookie từ Render
            cookie.setSecure(true); 
            // THAY ĐỔI: Set SameSite=None để cookie có thể gửi qua lại giữa 2 domain Render
            cookie.setAttribute("SameSite", "None");
            
            response.addCookie(cookie);
        }
        
        // THAY ĐỔI: Redirect về URL thật của Frontend trên Render
        response.sendRedirect("https://capstone-a-frontend.onrender.com/auth/callback");
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> getMe(OAuth2AuthenticationToken authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(authentication.getPrincipal().getAttributes());
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        clearCookie(response, "access_token");
        clearCookie(response, "JSESSIONID");

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("Logged out successfully");
    }

    private void clearCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // Đảm bảo đồng bộ với lúc tạo
        cookie.setAttribute("SameSite", "None");
        response.addCookie(cookie);
    }
}