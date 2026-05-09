package com.example.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {

    @Autowired
    private OAuth2AuthorizedClientService authorizedClientService;

    // Chuyển sang GetMapping vì OAuth2 redirect mặc định là GET
    @GetMapping("/login/success")
    public String loginSuccess(OAuth2AuthenticationToken authentication, HttpServletResponse response) {
        
        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                authentication.getAuthorizedClientRegistrationId(), 
                authentication.getName());

        if (client != null) {
            OAuth2AccessToken accessToken = client.getAccessToken();

            // Tạo HTTP-only cookie
            Cookie cookie = new Cookie("access_token", accessToken.getTokenValue());
            cookie.setHttpOnly(true);
            cookie.setSecure(false); // Đặt true nếu dùng HTTPS
            cookie.setMaxAge(3600);
            cookie.setPath("/");

            response.addCookie(cookie);
        }

        // Redirect về địa chỉ của Frontend (React/Vue/Vite)
        return "redirect:http://localhost:5173/dashboard";
    }
}