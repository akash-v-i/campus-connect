package com.campusconnect.library;

import com.campusconnect.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
@Getter
@Setter
@NoArgsConstructor
public class Fine extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "issued_book_id", nullable = false)
    private String issuedBookId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_book_id", insertable = false, updatable = false)
    private IssuedBook issuedBook;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, PAID

    @Column(name = "paid_date")
    private LocalDateTime paidDate;
}
