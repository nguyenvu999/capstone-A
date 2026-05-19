package com.example.netsuggest.places.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @Column(length = 50, nullable = false)
    private String id;

    private String name;
    private String icon;
    private String color;

    @ManyToMany(mappedBy = "categories")
    private List<Place> places;

    public Category() {}

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public List<Place> getPlaces() { return places; }
    public void setPlaces(List<Place> places) { this.places = places; }
}