package com.example.netsuggest.features.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.netsuggest.features.auth.entity.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> { 
    Optional<User> findByEmail(String email);
    
    // Đã loại bỏ Microsoft OAuth2
    // Optional<User> findByMicrosoftId(String microsoftId); 
}