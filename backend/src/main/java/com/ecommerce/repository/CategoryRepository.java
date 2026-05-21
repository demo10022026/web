package com.ecommerce.repository;

import com.ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    @Query("SELECT c FROM Category c WHERE c.parentCategory IS NULL")
    List<Category> findRootCategories();

    List<Category> findByParentCategory_CategoryId(Integer parentId);

    Optional<Category> findByCategoryNameIgnoreCase(String categoryName);

    Optional<Category> findByCategoryNameIgnoreCaseAndParentCategoryIsNull(
            String categoryName
    );

    Optional<Category> findByCategoryNameIgnoreCaseAndParentCategory_CategoryId(
            String categoryName,
            Integer parentCategoryId
    );
}