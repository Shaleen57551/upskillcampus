package com.servicehub.repository;

import com.servicehub.entity.ServiceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceListingRepository extends JpaRepository<ServiceListing, Long> {
    List<ServiceListing> findByMerchantId(Long merchantId);
    List<ServiceListing> findByCategoryId(Long categoryId);
}
