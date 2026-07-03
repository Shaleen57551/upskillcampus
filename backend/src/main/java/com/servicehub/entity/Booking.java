package com.servicehub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceListing service;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "merchant_id", nullable = false)
    private User merchant;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED, COMPLETED

    private LocalDateTime scheduledDate;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Booking(ServiceListing service, User customer, User merchant, String status, LocalDateTime scheduledDate) {
        this.service = service;
        this.customer = customer;
        this.merchant = merchant;
        this.status = status;
        this.scheduledDate = scheduledDate;
    }
}
