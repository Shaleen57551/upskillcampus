package com.servicehub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
public class ServiceListing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "merchant_id", nullable = false)
    private User merchant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    private String duration;
    private String imageUrl;
    
    private Double averageRating = 0.0;
    private Integer reviewCount = 0;

    public ServiceListing(String title, String description, BigDecimal price, User merchant, Category category, String duration, String imageUrl) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.merchant = merchant;
        this.category = category;
        this.duration = duration;
        this.imageUrl = imageUrl;
    }
}
