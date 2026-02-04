// API URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Store all products globally
let allProducts = [];
let filteredProducts = [];
let currentViewProducts = []; // Products currently displayed on page
let currentPage = 1;
let itemsPerPage = 10;
let sortBy = null;
let sortOrder = 'asc';
let currentProduct = null; // Currently selected product
let isEditMode = false;

// Fetch products from API
async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        allProducts = await response.json();
        filteredProducts = allProducts;
        displayProducts(filteredProducts);
        setupSearch();
        setupPagination();
    } catch (error) {
        console.error('Error fetching products:', error);
        showError();
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterProducts(searchTerm);
    });
}

// Setup pagination controls
function setupPagination() {
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    itemsPerPageSelect.addEventListener('change', function(e) {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        displayProducts(filteredProducts);
    });
}

// Sort products
function sortProducts(field, order) {
    sortBy = field;
    sortOrder = order;
    
    // Update active button state
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    
    if (field === 'title' && order === 'asc') {
        document.getElementById('sortTitleAsc').classList.add('active');
    } else if (field === 'title' && order === 'desc') {
        document.getElementById('sortTitleDesc').classList.add('active');
    } else if (field === 'price' && order === 'asc') {
        document.getElementById('sortPriceAsc').classList.add('active');
    } else if (field === 'price' && order === 'desc') {
        document.getElementById('sortPriceDesc').classList.add('active');
    }
    
    // Apply sort
    applySorting();
    currentPage = 1;
    displayProducts(filteredProducts);
}

// Apply sorting to filtered products
function applySorting() {
    if (!sortBy) return;
    
    filteredProducts.sort((a, b) => {
        let valueA, valueB;
        
        if (sortBy === 'title') {
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
            
            if (sortOrder === 'asc') {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        } else if (sortBy === 'price') {
            valueA = parseFloat(a.price);
            valueB = parseFloat(b.price);
            
            if (sortOrder === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        }
        
        return 0;
    });
}

// Filter products based on search term
function filterProducts(searchTerm) {
    const searchResults = document.getElementById('searchResults');
    
    if (searchTerm === '') {
        // Show all products if search is empty
        filteredProducts = [...allProducts];
        searchResults.style.display = 'none';
    } else {
        // Filter products by title
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
        
        // Show search results info
        searchResults.style.display = 'block';
        if (filteredProducts.length === 0) {
            searchResults.innerHTML = `<i class="bi bi-info-circle"></i> No products found matching "${searchTerm}"`;
        } else {
            searchResults.innerHTML = `Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} matching "${searchTerm}"`;
        }
    }
    
    // Apply current sorting if active
    applySorting();
    
    currentPage = 1;
    displayProducts(filteredProducts);
}

// Display products in grid
function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    const loading = document.getElementById('loading');
    const totalProducts = document.getElementById('totalProducts');
    const totalCategories = document.getElementById('totalCategories');
    const paginationContainer = document.getElementById('paginationContainer');

    // Hide loading, show grid
    loading.style.display = 'none';
    productGrid.style.display = 'flex';

    // Update stats
    totalProducts.textContent = allProducts.length;
    
    // Count unique categories
    const categories = new Set(allProducts.map(p => p.category?.name).filter(Boolean));
    totalCategories.textContent = categories.size;

    // Calculate pagination
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    // Store current view products for export
    currentViewProducts = paginatedProducts;

    // Clear existing content
    productGrid.innerHTML = '';

    // Check if no products
    if (paginatedProducts.length === 0) {
        productGrid.innerHTML = '<div class="col-12 text-center py-5"><h4 class="text-muted">No products to display</h4></div>';
        paginationContainer.style.display = 'none';
        return;
    }

    // Show pagination
    paginationContainer.style.display = 'flex';

    // Add each product as a card
    paginatedProducts.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6';
        
        // Get first image or placeholder
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0].replace(/[\[\]"]/g, '') 
            : 'https://via.placeholder.com/300x250';
        
        // Clean and truncate description
        const description = product.description 
            ? (product.description.length > 150 
                ? product.description.substring(0, 150) + '...' 
                : product.description)
            : 'No description available';

        col.innerHTML = `
            <div class="product-card" onclick="showProductDetail(${product.id})">
                <div class="product-description">
                    <strong>Description:</strong><br>
                    ${description}
                </div>
                <div class="product-image-container">
                    <img src="${imageUrl}" 
                         alt="${product.title}" 
                         onerror="this.src='https://via.placeholder.com/300x250'">
                    <span class="product-id-badge">#${product.id}</span>
                </div>
                <div class="product-card-body">
                    <div class="product-category">
                        <i class="bi bi-tag"></i> ${product.category?.name || 'General'}
                    </div>
                    <h5 class="product-title">${product.title}</h5>
                    <div class="product-footer">
                        <span class="product-price">$${product.price}</span>
                        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
                            <i class="bi bi-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        productGrid.appendChild(col);
    });
    
    // Update pagination controls
    updatePaginationControls(totalPages, products.length);
}

// Update pagination controls
function updatePaginationControls(totalPages, totalItems) {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    
    // Update page info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    pageInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems}`;
    
    // Clear pagination
    pagination.innerHTML = '';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.innerHTML = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="bi bi-chevron-left"></i></button>`;
    pagination.appendChild(prevLi);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        const li = document.createElement('li');
        li.innerHTML = `<button onclick="changePage(1)">1</button>`;
        pagination.appendChild(li);
        
        if (startPage > 2) {
            const dots = document.createElement('li');
            dots.innerHTML = `<button disabled>...</button>`;
            pagination.appendChild(dots);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.innerHTML = `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(li);
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('li');
            dots.innerHTML = `<button disabled>...</button>`;
            pagination.appendChild(dots);
        }
        
        const li = document.createElement('li');
        li.innerHTML = `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
        pagination.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.innerHTML = `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><i class="bi bi-chevron-right"></i></button>`;
    pagination.appendChild(nextLi);
}

// Change page
function changePage(page) {
    currentPage = page;
    displayProducts(filteredProducts);
    // Scroll to top of products section
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Export current view to CSV
function exportToCSV() {
    if (currentViewProducts.length === 0) {
        alert('No products to export!');
        return;
    }
    
    // CSV Header
    const headers = ['ID', 'Title', 'Price', 'Category', 'Description'];
    
    // Prepare CSV rows
    const rows = currentViewProducts.map(product => {
        // Clean description - remove quotes and newlines
        const description = (product.description || 'N/A')
            .replace(/"/g, '""') // Escape quotes
            .replace(/\n/g, ' ') // Remove newlines
            .replace(/\r/g, ''); // Remove carriage returns
        
        return [
            product.id,
            `"${product.title.replace(/"/g, '""')}"`, // Escape quotes in title
            product.price,
            `"${product.category?.name || 'N/A'}"`,
            `"${description}"`
        ].join(',');
    });
    
    // Combine header and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        // Create download link
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.setAttribute('download', `products_export_${timestamp}.csv`);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        alert(`Successfully exported ${currentViewProducts.length} products to CSV!`);
    }
}

// Show product detail modal
function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    isEditMode = false;
    
    // Get image URL
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0].replace(/[\[\]"]/g, '') 
        : 'https://via.placeholder.com/800x400';
    
    // Populate modal
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalId').textContent = `#${product.id}`;
    document.getElementById('modalTitleView').textContent = product.title;
    document.getElementById('modalTitleEdit').value = product.title;
    document.getElementById('modalPriceView').textContent = `$${product.price}`;
    document.getElementById('modalPriceEdit').value = product.price;
    document.getElementById('modalCategory').textContent = product.category?.name || 'N/A';
    document.getElementById('modalDescriptionView').textContent = product.description || 'No description available';
    document.getElementById('modalDescriptionEdit').value = product.description || '';
    
    // Reset to view mode
    toggleEditMode(false);
    
    // Show modal
    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentProduct = null;
    isEditMode = false;
}

// Toggle edit mode
function toggleEditMode(enable = null) {
    isEditMode = enable !== null ? enable : !isEditMode;
    
    // Toggle visibility
    document.getElementById('modalTitleView').style.display = isEditMode ? 'none' : 'block';
    document.getElementById('modalTitleEdit').style.display = isEditMode ? 'block' : 'none';
    document.getElementById('modalPriceView').style.display = isEditMode ? 'none' : 'block';
    document.getElementById('modalPriceEdit').style.display = isEditMode ? 'block' : 'none';
    document.getElementById('modalDescriptionView').style.display = isEditMode ? 'none' : 'block';
    document.getElementById('modalDescriptionEdit').style.display = isEditMode ? 'block' : 'none';
    
    // Toggle buttons
    document.getElementById('btnEdit').style.display = isEditMode ? 'none' : 'inline-block';
    document.getElementById('btnSave').style.display = isEditMode ? 'inline-block' : 'none';
    document.getElementById('btnCancel').style.display = isEditMode ? 'inline-block' : 'none';
}

// Cancel edit
function cancelEdit() {
    if (!currentProduct) return;
    
    // Restore original values
    document.getElementById('modalTitleEdit').value = currentProduct.title;
    document.getElementById('modalPriceEdit').value = currentProduct.price;
    document.getElementById('modalDescriptionEdit').value = currentProduct.description || '';
    
    toggleEditMode(false);
}

// Save product
async function saveProduct() {
    if (!currentProduct) return;
    
    // Get updated values
    const updatedProduct = {
        title: document.getElementById('modalTitleEdit').value.trim(),
        price: parseFloat(document.getElementById('modalPriceEdit').value),
        description: document.getElementById('modalDescriptionEdit').value.trim()
    };
    
    // Validate
    if (!updatedProduct.title) {
        alert('Title is required!');
        return;
    }
    
    if (isNaN(updatedProduct.price) || updatedProduct.price <= 0) {
        alert('Please enter a valid price!');
        return;
    }
    
    try {
        // Call API to update
        const response = await fetch(`${API_URL}/${currentProduct.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProduct)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update product');
        }
        
        const result = await response.json();
        
        // Update local data
        const productIndex = allProducts.findIndex(p => p.id === currentProduct.id);
        if (productIndex !== -1) {
            allProducts[productIndex] = { ...allProducts[productIndex], ...updatedProduct };
            currentProduct = allProducts[productIndex];
        }
        
        // Update view
        document.getElementById('modalTitleView').textContent = updatedProduct.title;
        document.getElementById('modalPriceView').textContent = `$${updatedProduct.price}`;
        document.getElementById('modalDescriptionView').textContent = updatedProduct.description || 'No description available';
        
        // Refresh display
        filterProducts(document.getElementById('searchInput').value.toLowerCase().trim());
        
        // Exit edit mode
        toggleEditMode(false);
        
        alert('Product updated successfully!');
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product. Please try again.');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeModal();
    }
    
    const createModal = document.getElementById('createModal');
    if (event.target === createModal) {
        closeCreateModal();
    }
});

// Open create modal
function openCreateModal() {
    // Reset form
    document.getElementById('createTitle').value = '';
    document.getElementById('createPrice').value = '';
    document.getElementById('createDescription').value = '';
    document.getElementById('createCategoryId').value = '';
    document.getElementById('createImages').value = '';
    
    // Show modal
    document.getElementById('createModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close create modal
function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Create new product
async function createProduct() {
    // Get form values
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const imagesInput = document.getElementById('createImages').value.trim();
    
    // Validate required fields
    if (!title) {
        alert('Title is required!');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price!');
        return;
    }
    
    if (isNaN(categoryId) || categoryId <= 0) {
        alert('Please enter a valid category ID!');
        return;
    }
    
    // Parse images
    let images = [];
    if (imagesInput) {
        images = imagesInput.split(',').map(url => url.trim()).filter(url => url);
    }
    
    // If no images provided, use placeholder
    if (images.length === 0) {
        images = ['https://via.placeholder.com/300x250'];
    }
    
    // Prepare product data
    const newProduct = {
        title: title,
        price: price,
        description: description || 'No description',
        categoryId: categoryId,
        images: images
    };
    
    try {
        // Call API to create
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create product');
        }
        
        const createdProduct = await response.json();
        
        // Add to local array
        allProducts.unshift(createdProduct); // Add to beginning
        
        // Close modal
        closeCreateModal();
        
        // Refresh display
        filteredProducts = [...allProducts];
        currentPage = 1;
        displayProducts(filteredProducts);
        
        alert(`Product "${createdProduct.title}" created successfully!`);
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Failed to create product. Please try again.');
    }
}

// Add to cart function (placeholder)
function addToCart(productId) {
    alert(`Product #${productId} added to cart!`);
}

// Show error message
function showError() {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    
    loading.style.display = 'none';
    errorMessage.style.display = 'block';
}

// Load products when page loads
window.addEventListener('DOMContentLoaded', fetchProducts);
