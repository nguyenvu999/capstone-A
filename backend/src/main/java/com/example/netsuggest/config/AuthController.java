package com.example.netsuggest.config;

import com.example.netsuggest.auth.entity.User;
import com.example.netsuggest.auth.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

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

            User user = userRepository.findByEmail(email).orElse(new User());
            user.setEmail(email);
            user.setFullName(name);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Tạo token phiên làm việc
            String sessionToken = UUID.randomUUID().toString();
            Cookie cookie = new Cookie("access_token", sessionToken);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(6 * 3600);
            
            // Cấu hình cho Render (HTTPS + Cross-site)
            cookie.setSecure(true); 
            cookie.setAttribute("SameSite", "None"); 
            
            response.addCookie(cookie);
        }
        // Redirect về Frontend
        response.sendRedirect("https://frontend-capstone-p0a6.onrender.com/auth/callback");
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<?> getMe(OAuth2AuthenticationToken authentication) {
        if (authentication == null) return ResponseEntity.status(401).body("Unauthorized");
        return ResponseEntity.ok(authentication.getPrincipal().getAttributes());
    }
}