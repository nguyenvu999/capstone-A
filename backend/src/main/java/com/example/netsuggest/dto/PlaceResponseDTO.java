package com.example.netsuggest.dto;

public class PlaceResponseDTO {
    private Long id;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private Double distance; // Khoảng cách tính theo km

    // Constructor trống
    public PlaceResponseDTO() {}

    // Constructor đầy đủ
    public PlaceResponseDTO(Long id, String name, String address, Double lat, Double lng, Double distance) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
        this.distance = Math.round(distance * 100.0) / 100.0; // Làm tròn 2 chữ số thập phân (VD: 3.45 km)
    }

    // Getter và Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }
}