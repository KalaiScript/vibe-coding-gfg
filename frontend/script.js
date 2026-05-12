const API_URL = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : ''; // Auto-fallback for local file preview

// Global State
let cart = JSON.parse(localStorage.getItem('aurelia_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('aurelia_wishlist')) || [];
let products = [];
let filteredProducts = [];
let adminEditProductId = null;

// DOM Elements
const header = document.getElementById('header');
const cartToggle = document.getElementById('cart-toggle');
const cartDrawer = document.getElementById('cart-drawer');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const productsContainer = document.getElementById('products-container');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const wishlistBtn = document.getElementById('wishlist-btn');
const wishlistCount = document.getElementById('wishlist-count');
const adminProductsList = document.getElementById('admin-products-list');
const adminForm = document.getElementById('admin-form');
const adminFeedback = document.getElementById('admin-feedback');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initScrollEffects();
    updateCartUI();
    updateWishlistUI();
    
    if (productsContainer) {
        showLoadingSkeletons();
        fetchProducts();
    } else if (adminProductsList) {
        fetchProducts();
    }

    if (document.getElementById('checkout-items')) {
        renderCheckout();
    }

    initEventListeners();
    initSearchAndFilter();
});

// Scroll Effects
function initScrollEffects() {
    // Header Glassmorphism
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            // Only remove if not on a page that forced it (like About/Contact)
            if (!header.classList.contains('force-scrolled')) {
                header.classList.remove('scrolled');
            }
        }
    });

    // Intersection Observer for Fade-in
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// Loading Skeletons
function showLoadingSkeletons() {
    const skeletons = Array(8).fill().map((_, i) => `
        <div class="product-card skeleton" style="--i: ${i}">
            <div class="skeleton-image"></div>
            <div class="skeleton-text">
                <div class="skeleton-title"></div>
                <div class="skeleton-price"></div>
            </div>
        </div>
    `).join('');
    productsContainer.innerHTML = skeletons;
}

// Fetch Products
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json();
        filteredProducts = [...products];
        if (productsContainer) renderProducts();
        if (adminProductsList) renderAdminProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        if (productsContainer) {
            productsContainer.innerHTML = '<p>The collection is currently unavailable. Please check back soon.</p>';
        }
        if (adminProductsList) {
            adminProductsList.innerHTML = '<p>Unable to load admin collection data.</p>';
        }
    }
}

function renderProducts() {
    productsContainer.innerHTML = filteredProducts.map((product, index) => {
        const isInWishlist = wishlist.some(item => item.id === product.id);
        return `
            <div class="product-card" style="--i: ${index % 8}">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                    <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})">
                        <span>${isInWishlist ? '♥' : '♡'}</span>
                    </button>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <span class="price">$${product.price.toLocaleString()}</span>
                    <button class="btn add-to-cart" onclick="addToCart(${product.id})">Add to Selection</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Re-observe new elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    });
    document.querySelectorAll('.product-card').forEach(el => observer.observe(el));
}

function renderAdminProducts() {
    if (!adminProductsList) return;

    if (products.length === 0) {
        adminProductsList.innerHTML = '<p>No items are available in the collection yet.</p>';
        return;
    }

    adminProductsList.innerHTML = products.map(product => `
        <div class="admin-product-card">
            <div class="admin-card-info">
                <img src="${product.imageUrl}" alt="${product.name}">
                <div>
                    <h4>${product.name}</h4>
                    <p>${product.category || 'Uncategorized'}</p>
                    <span>$${product.price.toLocaleString()}</span>
                </div>
            </div>
            <div class="admin-product-actions">
                <button class="btn" onclick="populateAdminForm(${product.id})">Edit</button>
                <button class="btn delete-btn" onclick="deleteAdminProduct(${product.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function populateAdminForm(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    adminEditProductId = product.id;
    document.getElementById('admin-product-id').value = product.id;
    document.getElementById('admin-product-name').value = product.name;
    document.getElementById('admin-product-image').value = product.imageUrl;
    document.getElementById('admin-product-price').value = product.price;
    document.getElementById('admin-product-category').value = product.category || '';
    if (adminFeedback) {
        adminFeedback.innerText = `Editing ${product.name}. Submit to save changes.`;
    }
}

async function handleAdminFormSubmit(e) {
    if (!adminForm) return;
    e.preventDefault();

    const name = document.getElementById('admin-product-name').value.trim();
    const imageUrl = document.getElementById('admin-product-image').value.trim();
    const price = parseFloat(document.getElementById('admin-product-price').value);
    const category = document.getElementById('admin-product-category').value.trim();

    if (!name || !imageUrl || Number.isNaN(price)) {
        showNotification('Please complete all required product fields.', 'error');
        return;
    }

    const payload = {
        name,
        imageUrl,
        price,
        category: category || undefined
    };

    const method = adminEditProductId ? 'PUT' : 'POST';
    const endpoint = adminEditProductId ? `${API_URL}/products/${adminEditProductId}` : `${API_URL}/products`;

    try {
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Unable to save product');
        }

        adminFeedback.innerText = adminEditProductId ? 'Product updated successfully.' : 'Product added successfully.';
        adminEditProductId = null;
        document.getElementById('admin-product-id').value = '';
        adminForm.reset();
        await fetchProducts();
        showNotification('Collection updated successfully.', 'success');
    } catch (error) {
        if (adminFeedback) {
            adminFeedback.innerText = `Admin save failed: ${error.message}`;
        }
    }
}

async function deleteAdminProduct(productId) {
    if (!confirm('Delete this product from the collection?')) return;

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Unable to delete product');
        }

        adminFeedback.innerText = 'Product has been removed.';
        await fetchProducts();
        showNotification('Product deleted from collection.', 'info');
    } catch (error) {
        if (adminFeedback) {
            adminFeedback.innerText = `Delete failed: ${error.message}`;
        }
    }
}

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    openCartDrawer();
    showNotification(`${product.name} added to your selection!`, 'success');
}

function removeFromCart(productId) {
    const product = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    if (product) {
        showNotification(`${product.name} removed from selection.`, 'info');
    }
}

// Wishlist Logic
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        showNotification(`${product.name} removed from wishlist.`, 'info');
    } else {
        wishlist.push(product);
        showNotification(`${product.name} added to wishlist! ♥`, 'success');
    }
    
    saveWishlist();
    updateWishlistUI();
    renderProducts(); // Re-render to update wishlist buttons
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function saveCart() {
    localStorage.setItem('aurelia_cart', JSON.stringify(cart));
}

function updateCartUI() {
    if (cartCount) cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center" style="margin-top:2rem;">Your selection is empty.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" style="display:flex; gap:1rem; margin-bottom:1.5rem; align-items:center;">
                    <img src="${item.imageUrl}" style="width:60px; height:60px; object-fit:cover;">
                    <div style="flex-grow:1;">
                        <h4 style="font-size:0.9rem;">${item.name}</h4>
                        <span style="color:var(--gold); font-size:0.8rem;">$${item.price.toLocaleString()} x ${item.quantity}</span>
                    </div>
                    <span style="cursor:pointer; color:#666;" onclick="removeFromCart(${item.id})">&times;</span>
                </div>
            `).join('');
        }
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalPrice) cartTotalPrice.innerText = `$${total.toLocaleString()}`;
}

function saveWishlist() {
    localStorage.setItem('aurelia_wishlist', JSON.stringify(wishlist));
}

function updateWishlistUI() {
    if (wishlistCount) wishlistCount.innerText = wishlist.length;
}

// Search and Filter Logic
function initSearchAndFilter() {
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (filterButtons) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', handleFilter);
        });
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.price.toString().includes(query)
    );
    renderProducts();
}

function handleFilter(e) {
    const filterType = e.target.dataset.filter;
    
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    if (filterType === 'all') {
        filteredProducts = [...products];
    } else if (filterType === 'price-low') {
        filteredProducts = [...products].sort((a, b) => a.price - b.price);
    } else if (filterType === 'price-high') {
        filteredProducts = [...products].sort((a, b) => b.price - a.price);
    } else if (filterType === 'wishlist') {
        filteredProducts = products.filter(product => 
            wishlist.some(item => item.id === product.id)
        );
    }
    
    renderProducts();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function openCartDrawer() {
    if (cartDrawer) {
        cartDrawer.classList.add('open');
        return;
    }

    // Fallback for pages without a drawer component
    window.location.href = 'checkout.html';
}

function closeCartDrawer() {
    if (cartDrawer) {
        cartDrawer.classList.remove('open');
    }
}

// Event Listeners
function initEventListeners() {
    if (cartToggle) cartToggle.addEventListener('click', openCartDrawer);
    if (closeCart) closeCart.addEventListener('click', closeCartDrawer);
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            const wishlistFilter = document.querySelector('[data-filter="wishlist"]');
            if (wishlistFilter) wishlistFilter.click();
        });
    }
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminFormSubmit);
    }
    
    // Chat Logic
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendChat = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatFab && chatWindow) {
        chatFab.addEventListener('click', () => chatWindow.classList.toggle('open'));
    }
    if (closeChat && chatWindow) {
        closeChat.addEventListener('click', () => chatWindow.classList.remove('open'));
    }

    const handleChat = async () => {
        const msg = chatInput.value.trim();
        if (!msg) return;

        // User Message
        chatMessages.innerHTML += `<div class="message user">${msg}</div>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            const data = await response.json();
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Bot Message with delay
            setTimeout(() => {
                chatMessages.innerHTML += `<div class="message bot">${data.response}</div>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 500);
        } catch (error) {
            // Remove typing indicator
            if (chatMessages.contains(typingIndicator)) {
                chatMessages.removeChild(typingIndicator);
            }
            console.error('Chat error:', error);
        }
    };

    if (sendChat) sendChat.addEventListener('click', handleChat);
    if (chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    // Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const responseDiv = document.getElementById('form-response');
            responseDiv.innerText = 'Sending to concierge...';
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            try {
                const response = await fetch(`${API_URL}/contact-submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                responseDiv.innerText = data.message;
                contactForm.reset();
            } catch (error) {
                responseDiv.innerText = 'An error occurred. Please try again.';
            }
        });
    }

    // Payment Logic
    const paymentBtn = document.getElementById('process-payment-btn');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', async () => {
            if (cart.length === 0) return alert('Your selection is empty.');
            
            const statusDiv = document.getElementById('payment-status');
            statusDiv.innerText = 'Verifying secure transaction...';
            paymentBtn.disabled = true;
            paymentBtn.innerHTML = '<span class="spinner"></span> Processing...';
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            try {
                const response = await fetch(`${API_URL}/process-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                        total: total
                    })
                });
                const data = await response.json();
                
                statusDiv.innerText = 'Success. Your AURELIA pieces are being prepared.';
                paymentBtn.innerHTML = '✓ Payment Successful';
                localStorage.removeItem('aurelia_cart');
                cart = [];
                updateCartUI();
                setTimeout(() => window.location.href = 'index.html', 3000);
            } catch (error) {
                statusDiv.innerText = 'Transaction failed. Please contact your bank.';
                paymentBtn.disabled = false;
                paymentBtn.innerHTML = 'Try Again';
            }
        });
    }
}

// Checkout Rendering
function renderCheckout() {
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your selection is empty.</p>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
            <span>${item.name} (x${item.quantity})</span>
            <span>$${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalEl.innerText = `$${total.toLocaleString()}`;
}
