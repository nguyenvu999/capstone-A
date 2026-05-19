package com.example.netsuggest.places.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "place_images")
public class PlaceImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public PlaceImage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Place getPlace() { return place; }
    public void setPlace(Place place) { this.place = place; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}