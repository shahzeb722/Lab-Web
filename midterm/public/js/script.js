// Assignment 2 — Responsive Hamburger Menu (Vanilla JS only)

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

// Toggle menu open/close on hamburger click
hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
});

// Bonus: close menu when any nav link is clicked
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(function (item) {
    item.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
    });
});

// ========================================
// FEATURED DEALS — AJAX INTEGRATION
// ========================================

$(document).ready(function () {
    // Fetch products from FakeStore API
    fetchFeaturedProducts();

    // Close modal when X is clicked
    $('.modal-close').on('click', function () {
        $('#quickViewModal').removeClass('show');
    });

    // Close modal when clicking outside the modal content
    $(window).on('click', function (event) {
        const modal = $('#quickViewModal')[0];
        if (event.target === modal) {
            $('#quickViewModal').removeClass('show');
        }
    });
});

// Function to fetch products from API
function fetchFeaturedProducts() {
    $.ajax({
        url: '/api/featured-products',
        type: 'GET',
        dataType: 'json',
        success: function (products) {
            displayProducts(products);
        },
        error: function (xhr, status, error) {
            console.error('Error fetching products:', error);
            $('#featuredDealsContainer').html(
                '<div class="loading-spinner"><p>Unable to load products. Please try again later.</p></div>'
            );
        }
    });
}

// Function to display products in the DOM
function displayProducts(products) {
    // Clear the loading spinner and container
    $('#featuredDealsContainer').empty();

    // Loop through each product and create a card
    products.forEach(function (product) {
        const productCard = createProductCard(product);
        $('#featuredDealsContainer').append(productCard);
    });

    // Attach event listeners to the Quick View buttons
    attachQuickViewListeners();
}

// Function to create a product card HTML
function createProductCard(product) {
    // Generate star rating display
    const rating = Math.round(product.rating.rate * 2) / 2; // Round to nearest 0.5
    const stars = generateStars(rating);
    const ratingCount = product.rating.count;

    // Format price
    const price = '$' + product.price.toFixed(2);

    // Create truncated title (max 3 lines)
    const title = product.title.length > 50 ? product.title.substring(0, 50) + '...' : product.title;

    const card = `
        <div class="product-card">
            <div class="product-card-image">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="product-card-info">
                <h3 class="product-title">${title}</h3>
                <div class="product-rating">
                    <span class="product-rating-stars">${stars}</span>
                    <span class="product-rating-text">(${ratingCount})</span>
                </div>
                <div class="product-price">${price}</div>
                <div class="product-card-actions">
                    <button class="quick-view-btn" data-product-id="${product.id}">Quick View</button>
                    <button class="add-cart-btn">Add to Cart</button>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Function to generate star rating display
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }

    // Half star
    if (hasHalfStar) {
        stars += '☆'; // You could use a different character or CSS styling for this
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
    }

    return stars;
}

// Function to attach Quick View button listeners
function attachQuickViewListeners() {
    $('.quick-view-btn').on('click', function () {
        const productId = $(this).data('product-id');
        fetchProductDetails(productId);
    });
}

// Function to fetch full product details and open modal
function fetchProductDetails(productId) {
    $.ajax({
        url: `/api/featured-products/${productId}`,
        type: 'GET',
        dataType: 'json',
        success: function (product) {
            displayProductModal(product);
        },
        error: function (xhr, status, error) {
            console.error('Error fetching product details:', error);
        }
    });
}

// Function to display product modal
function displayProductModal(product) {
    // Populate modal with product details
    const rating = Math.round(product.rating.rate * 2) / 2;
    const stars = generateStars(rating);

    $('#modalProductImage').attr('src', product.image);
    $('#modalProductTitle').text(product.title);
    $('#modalProductRating').html(
        `<span style="color: #ffc107; font-size: 16px;">${stars}</span> <strong>${rating}</strong>`
    );
    $('#modalProductRatingCount').text(`(${product.rating.count} reviews)`);
    $('#modalProductDescription').text(product.description);
    $('#modalProductPrice').text('$' + product.price.toFixed(2));

    // Show the modal
    $('#quickViewModal').addClass('show');
}

