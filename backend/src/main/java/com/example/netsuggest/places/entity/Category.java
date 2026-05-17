package com.example.netsuggest.places.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category {
    
    @Id
    private String id; // Khóa chính dạng chuỗi (Ví dụ: "restaurant", "cafe", "bar")
    private String name;
    private String icon;
    private String color;

    // Constructor mặc định (Bắt buộc phải có đối với JPA Entity)
    public Category() {
    }

    // Constructor có tham số đầy đủ để tiện khởi tạo nhanh nếu cần
    public Category(String id, String name, String icon, String color) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.color = color;
    }

    // --- GETTERS AND SETTERS ---
    
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}