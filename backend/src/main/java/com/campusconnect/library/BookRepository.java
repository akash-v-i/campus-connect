package com.campusconnect.library;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface BookRepository extends JpaRepository<Book, String> {

    @Query("SELECT b FROM Book b WHERE b.isDeleted = false")
    Page<Book> findAllActive(Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.isDeleted = false AND " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Book> searchBooks(@Param("search") String search, Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.isDeleted = false AND b.category = :category")
    Page<Book> findByCategory(@Param("category") String category, Pageable pageable);
}
