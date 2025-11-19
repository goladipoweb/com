// Supabase configuration (loaded from window.__CONFIG__ provided by config.js)
const SUPABASE_URL = (window.__CONFIG__ && window.__CONFIG__.SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (window.__CONFIG__ && window.__CONFIG__.SUPABASE_ANON_KEY) || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.warn('Supabase configuration missing. Ensure config.js is created from config.sample.js and not committed.');
}

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let currentConversationId = null;
let messageSubscription = null;

// DOM Elements
const navMenu = document.getElementById('navMenu');
const hamburger = document.getElementById('hamburger');
const authLinks = document.getElementById('authLinks');
const userLinks = document.getElementById('userLinks');
const logoutBtn = document.getElementById('logoutBtn');
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const noResults = document.getElementById('noResults');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const addProductForm = document.getElementById('addProductForm');
const profileForm = document.getElementById('profileForm');
const userProducts = document.getElementById('userProducts');
const noProducts = document.getElementById('noProducts');
const productImage = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const loading = document.getElementById('loading');
const toast = document.getElementById('toast');

// Advanced Search Elements
const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
const advancedFilters = document.getElementById('advancedFilters');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const filterCategory = document.getElementById('filterCategory');
const filterMinPrice = document.getElementById('filterMinPrice');
const filterMaxPrice = document.getElementById('filterMaxPrice');
const filterLocation = document.getElementById('filterLocation');
const filterVerified = document.getElementById('filterVerified');
const filterSort = document.getElementById('filterSort');

// Messaging Elements
const conversationsList = document.getElementById('conversationsList');
const noConversations = document.getElementById('noConversations');
const noConversationSelected = document.getElementById('noConversationSelected');
const conversationView = document.getElementById('conversationView');
const conversationName = document.getElementById('conversationName');
const conversationDetails = document.getElementById('conversationDetails');
const messagesList = document.getElementById('messagesList');
const messageText = document.getElementById('messageText');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const unreadBadge = document.getElementById('unreadBadge');

// Verification Elements
// Verification (disabled)

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

// Initialize the application
async function initApp() {
    // Ensure only home page is visible on load
    pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('home').classList.add('active');
    
    // Check if user is already logged in
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user) {
        currentUser = user;
        updateUIForAuth();
        loadUserProducts();
        loadUserProfile();
        // Messaging disabled for now
        // Verification disabled for now
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize AI chatbox
    initChatbox();
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation
    hamburger.addEventListener('click', toggleMobileMenu);
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    // Enable all elements with data-page (e.g., hero buttons, footer links)
    const pageTriggers = document.querySelectorAll('[data-page]');
    pageTriggers.forEach(el => {
        el.addEventListener('click', handleNavigation);
    });
    
    // Authentication
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Search
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Dashboard
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleUpdateProduct);
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleUpdateProfile);
    }
    
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });

    // Enable any element inside the dashboard with data-tab to switch tabs (e.g., "Add Product" button in empty state)
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        dashboardSection.addEventListener('click', (e) => {
            const tabTrigger = e.target.closest('[data-tab]');
            if (tabTrigger) {
                e.preventDefault();
                const tab = tabTrigger.getAttribute('data-tab');
                if (tab) {
                    switchTab(tab);
                }
            }
        });
    }
    
    // Image preview
    if (productImage) {
        productImage.addEventListener('change', handleImagePreview);
    }
    
    const editProductImage = document.getElementById('editProductImage');
    if (editProductImage) {
        editProductImage.addEventListener('change', handleEditImagePreview);
    }
    
    // Advanced search filters
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', toggleFilters);
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', handleSearch);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Messaging disabled for now
    
    // Verification disabled
}

// Toggle mobile menu
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Handle navigation between pages
function handleNavigation(e) {
    const page = e.target.getAttribute('data-page');
    
    // Only prevent default if this is a page navigation link
    if (page) {
        e.preventDefault();
        
        // Close mobile menu if open
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // Show the selected page
        pages.forEach(p => {
            p.classList.remove('active');
            if (p.id === page) {
                p.classList.add('active');
            }
        });
        
        // Special handling for dashboard
        if (page === 'dashboard' && !currentUser) {
            showPage('signin');
            showToast('Please sign in to access your dashboard', 'error');
        }
        
        // Load data for specific pages
        if (page === 'search') {
            // Clear previous search results
            searchResults.innerHTML = '';
            noResults.style.display = 'none';
        }
    }
    // If no data-page attribute, allow default behavior (external links like WhatsApp)
}

// Handle user sign in
async function handleSignIn(e) {
    e.preventDefault();
    showLoading(true);
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        updateUIForAuth();
        loadUserProducts();
        loadUserProfile();
        showPage('dashboard');
        showToast('Successfully signed in!', 'success');
    } catch (error) {
        console.error('Sign in error:', error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle user sign up
async function handleSignUp(e) {
    e.preventDefault();
    showLoading(true);
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        showLoading(false);
        return;
    }
    
    try {
        // Create user account
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        if (!data.user) {
            throw new Error('User creation failed');
        }
        
        console.log('User created:', data.user.id);
        
        // Wait for trigger to create basic profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update profile with additional info (name, phone)
        // The profile was already created by database trigger
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ 
                name, 
                phone,
                location: '',
                is_verified: false
            })
            .eq('id', data.user.id);
        
        if (profileError) {
            console.error('Profile update error:', profileError);
            // Don't throw error - basic profile was created by trigger
            console.log('Profile will be updated later');
        }
        
        console.log('Profile updated with user info');
        
        showToast('Account created successfully! You can now sign in.', 'success');
        showPage('signin');
        signupForm.reset();
    } catch (error) {
        console.error('Sign up error:', error);
        
        // Show user-friendly error message
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
            errorMessage = 'This email is already registered. Please sign in instead.';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle user logout
async function handleLogout() {
    showLoading(true);
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        updateUIForAuth();
        showPage('home');
        showToast('Successfully logged out', 'success');
    } catch (error) {
        console.error('Logout error:', error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Update UI when user is authenticated
function updateUIForAuth() {
    if (currentUser) {
        authLinks.style.display = 'none';
        userLinks.style.display = 'flex';
    } else {
        authLinks.style.display = 'flex';
        userLinks.style.display = 'none';
    }
}

// Handle product search with advanced filters
async function handleSearch() {
    const query = searchInput.value.trim();
    
    showLoading(true);
    
    try {
        let queryBuilder = supabaseClient
            .from('products')
            .select(`
                *,
                profiles (
                    name,
                    phone,
                    location,
                    is_verified
                )
            `)
            .eq('is_active', true);
        
        // Apply search query
        if (query) {
            queryBuilder = queryBuilder.ilike('name', `%${query}%`);
        }
        
        // Apply category filter
        if (filterCategory && filterCategory.value) {
            queryBuilder = queryBuilder.eq('category', filterCategory.value);
        }
        
        // Apply price filters
        if (filterMinPrice && filterMinPrice.value) {
            queryBuilder = queryBuilder.gte('price', parseFloat(filterMinPrice.value));
        }
        
        if (filterMaxPrice && filterMaxPrice.value) {
            queryBuilder = queryBuilder.lte('price', parseFloat(filterMaxPrice.value));
        }
        
        const { data, error } = await queryBuilder;
        
        if (error) throw error;
        
        let results = data || [];
        
        // Apply location filter (client-side since it's on profiles)
        if (filterLocation && filterLocation.value) {
            const locationQuery = filterLocation.value.toLowerCase();
            results = results.filter(product => 
                product.profiles?.location?.toLowerCase().includes(locationQuery)
            );
        }
        
        // Apply verification filter (client-side)
        if (filterVerified && filterVerified.value) {
            const verifiedValue = filterVerified.value === 'true';
            results = results.filter(product => 
                product.profiles?.is_verified === verifiedValue
            );
        }
        
        // Apply sorting
        if (filterSort && filterSort.value) {
            results = sortResults(results, filterSort.value);
        }
        
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error.message);
        showToast('Error searching for products', 'error');
    } finally {
        showLoading(false);
    }
}

// Sort search results
function sortResults(results, sortBy) {
    switch (sortBy) {
        case 'price_low':
            return results.sort((a, b) => a.price - b.price);
        case 'price_high':
            return results.sort((a, b) => b.price - a.price);
        case 'oldest':
            return results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'newest':
        default:
            return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

// Toggle filters visibility
function toggleFilters() {
    if (advancedFilters.style.display === 'none') {
        advancedFilters.style.display = 'block';
    } else {
        advancedFilters.style.display = 'none';
    }
}

// Clear all filters
function clearFilters() {
    searchInput.value = '';
    if (filterCategory) filterCategory.value = '';
    if (filterMinPrice) filterMinPrice.value = '';
    if (filterMaxPrice) filterMaxPrice.value = '';
    if (filterLocation) filterLocation.value = '';
    if (filterVerified) filterVerified.value = '';
    if (filterSort) filterSort.value = 'newest';
    
    searchResults.innerHTML = '';
    noResults.style.display = 'none';
    showToast('Filters cleared', 'success');
}

// Display search results
function displaySearchResults(products) {
    searchResults.innerHTML = '';
    
    if (products && products.length > 0) {
        noResults.style.display = 'none';
        
        products.forEach(product => {
            const productCard = createProductCard(product, true);
            searchResults.appendChild(productCard);
        });
    } else {
        noResults.style.display = 'block';
    }
}

// Handle adding a new product
async function handleAddProduct(e) {
    e.preventDefault();
    showLoading(true);
    
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const imageFile = productImage.files[0];
    
    try {
        let imageUrl = null;
        
        // Upload image if provided
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `products/${currentUser.id}/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('product-images')
                .upload(filePath, imageFile);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('product-images')
                .getPublicUrl(filePath);
            
            imageUrl = urlData.publicUrl;
        }
        
        // Add product to database
        const { data, error } = await supabaseClient
            .from('products')
            .insert([
                { 
                    name, 
                    description, 
                    price, 
                    category,
                    image_url: imageUrl,
                    seller_id: currentUser.id,
                    is_active: true,
                    created_at: new Date()
                }
            ])
            .select();
        
        if (error) throw error;
        
        showToast('Product added successfully!', 'success');
        addProductForm.reset();
        imagePreview.innerHTML = '';
        
        // Reload user products
        loadUserProducts();
        
        // Switch to products tab
        switchTab('products');
    } catch (error) {
        console.error('Add product error:', error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load user's products
async function loadUserProducts() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('seller_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayUserProducts(data);
    } catch (error) {
        console.error('Load products error:', error.message);
        showToast('Error loading your products', 'error');
    }
}

// Display user's products in dashboard
function displayUserProducts(products) {
    userProducts.innerHTML = '';
    
    if (products && products.length > 0) {
        noProducts.style.display = 'none';
        
        products.forEach(product => {
            const productCard = createProductCard(product, false);
            userProducts.appendChild(productCard);
        });
    } else {
        noProducts.style.display = 'block';
    }
}

// Create product card element
function createProductCard(product, isSearchResult) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageSrc = product.image_url || 'assets/placeholder-product.jpg';
    const isVerified = product.profiles?.is_verified || false;
    const sellerName = product.profiles?.name || 'Unknown';
    
    card.innerHTML = `
        <img src="${imageSrc}" alt="${product.name}" class="product-image" onerror="this.src='assets/placeholder-product.jpg'">
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">₦${product.price.toLocaleString()}</p>
            <p class="product-description">${product.description}</p>
            ${product.category ? `<p class="product-category"><i class="fas fa-tag"></i> ${product.category}</p>` : ''}
            <div class="product-seller">
                ${isSearchResult ? `
                    <div>
                        <span>
                            ${sellerName}
                            ${isVerified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                        </span>
                        ${product.profiles?.location ? `<br><small><i class="fas fa-map-marker-alt"></i> ${product.profiles.location}</small>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="tel:${product.profiles?.phone || ''}" class="contact-btn">
                            <i class="fas fa-phone"></i>
                        </a>
                    </div>
                ` : `
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span>${product.is_active ? 'Active' : 'Inactive'}</span>
                        <button class="btn btn-primary btn-sm edit-product-btn" data-id="${product.id}" title="Edit Product">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" data-id="${product.id}" title="Delete Product">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
    
    // Add delete and edit functionality for user's own products
    if (!isSearchResult) {
        const deleteBtn = card.querySelector('.btn-danger');
        deleteBtn.addEventListener('click', () => deleteProduct(product.id));
        
        const editBtn = card.querySelector('.edit-product-btn');
        editBtn.addEventListener('click', () => editProduct(product));
    }
    
    return card;
}

// Delete a product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    showLoading(true);
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('seller_id', currentUser.id);
        
        if (error) throw error;
        
        showToast('Product deleted successfully', 'success');
        loadUserProducts();
    } catch (error) {
        console.error('Delete product error:', error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load user profile data
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        // Populate profile form
        document.getElementById('profileName').value = data.name || '';
        document.getElementById('profileEmail').value = data.email || '';
        document.getElementById('profilePhone').value = data.phone || '';
        document.getElementById('profileLocation').value = data.location || '';
    } catch (error) {
        console.error('Load profile error:', error.message);
    }
}

// Handle profile update
async function handleUpdateProfile(e) {
    e.preventDefault();
    showLoading(true);
    
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    const location = document.getElementById('profileLocation').value;
    
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ name, phone, location })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Update profile error:', error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle tab changes in dashboard
function handleTabChange(e) {
    const tab = e.target.getAttribute('data-tab');
    switchTab(tab);
}

// Switch between dashboard tabs
function switchTab(tab) {
    // Update active tab button
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });
    
    // Show active tab content
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tab}-tab`) {
            content.classList.add('active');
        }
    });
}

// Handle image preview for product upload
function handleImagePreview() {
    const file = productImage.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
}

// Handle image preview for edit product
function handleEditImagePreview() {
    const file = editProductImage.files[0];
    const editImagePreview = document.getElementById('editImagePreview');
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            editImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        
        reader.readAsDataURL(file);
    } else {
        editImagePreview.innerHTML = '';
    }
}

// Edit a product - load data into edit form
function editProduct(product) {
    // Populate edit form with product data
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name || '';
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductPrice').value = product.price || '';
    document.getElementById('editProductCategory').value = product.category || '';
    
    // Show current image
    const editImagePreview = document.getElementById('editImagePreview');
    if (product.image_url) {
        editImagePreview.innerHTML = `<img src="${product.image_url}" alt="Current image">`;
    } else {
        editImagePreview.innerHTML = '';
    }
    
    // Switch to edit tab
    switchTab('edit-product');
}

// Handle updating a product
async function handleUpdateProduct(e) {
    e.preventDefault();
    showLoading(true);
    
    const productId = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value;
    const description = document.getElementById('editProductDescription').value;
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const category = document.getElementById('editProductCategory').value;
    const imageFile = editProductImage.files[0];
    
    try {
        let imageUrl = null;
        
        // Upload new image if provided
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `products/${currentUser.id}/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('product-images')
                .upload(filePath, imageFile);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('product-images')
                .getPublicUrl(filePath);
            
            imageUrl = urlData.publicUrl;
        }
        
        // Update product in database
        const updateData = {
            name,
            description,
            price,
            category
        };
        
        // Only update image if a new one was uploaded
        if (imageUrl) {
            updateData.image_url = imageUrl;
        }
        
        const { error } = await supabaseClient
            .from('products')
            .update(updateData)
            .eq('id', productId)
            .eq('seller_id', currentUser.id);
        
        if (error) throw error;
        
        showToast('Product updated successfully!', 'success');
        editProductForm.reset();
        document.getElementById('editImagePreview').innerHTML = '';
        
        // Reload user products
        loadUserProducts();
        
        // Switch back to products tab
        switchTab('products');
    } catch (error) {
        console.error('Update product error:', error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Show a specific page
function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });
    
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        loading.style.display = 'flex';
    } else {
        loading.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast';
    
    if (type) {
        toast.classList.add(type);
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== MESSAGING SYSTEM =====

// Load all conversations for current user
async function loadConversations() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('conversations')
            .select(`
                *,
                participant1:profiles!conversations_participant1_id_fkey(name),
                participant2:profiles!conversations_participant2_id_fkey(name),
                messages(id, content, created_at, is_read, sender_id)
            `)
            .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        displayConversations(data || []);
        updateUnreadCount(data || []);
    } catch (error) {
        console.error('Load conversations error:', error.message);
    }
}

// Display conversations list
function displayConversations(conversations) {
    conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
        noConversations.style.display = 'block';
        return;
    }
    
    noConversations.style.display = 'none';
    
    conversations.forEach(conversation => {
        const otherUser = conversation.participant1_id === currentUser.id 
            ? conversation.participant2 
            : conversation.participant1;
        
        const lastMessage = conversation.messages && conversation.messages.length > 0
            ? conversation.messages[conversation.messages.length - 1]
            : null;
        
        const hasUnread = lastMessage && !lastMessage.is_read && lastMessage.sender_id !== currentUser.id;
        
        const item = document.createElement('div');
        item.className = `conversation-item ${hasUnread ? 'unread' : ''}`;
        item.dataset.conversationId = conversation.id;
        item.dataset.otherUserName = otherUser?.name || 'Unknown';
        
        item.innerHTML = `
            <h5>${otherUser?.name || 'Unknown User'}</h5>
            ${lastMessage ? `
                <p class="last-message">${lastMessage.content}</p>
                <p class="message-time">${formatMessageTime(lastMessage.created_at)}</p>
            ` : '<p class="last-message">No messages yet</p>'}
        `;
        
        item.addEventListener('click', () => openConversation(conversation.id, otherUser?.name || 'Unknown'));
        conversationsList.appendChild(item);
    });
}

// Update unread message count
function updateUnreadCount(conversations) {
    let unreadCount = 0;
    
    conversations.forEach(conversation => {
        if (conversation.messages) {
            const unreadMessages = conversation.messages.filter(
                msg => !msg.is_read && msg.sender_id !== currentUser.id
            );
            unreadCount += unreadMessages.length;
        }
    });
    
    if (unreadCount > 0) {
        unreadBadge.textContent = unreadCount;
        unreadBadge.style.display = 'inline-block';
    } else {
        unreadBadge.style.display = 'none';
    }
}

// Open a conversation
async function openConversation(conversationId, otherUserName) {
    currentConversationId = conversationId;
    
    // Update active state
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.classList.remove('unread');
    }
    
    noConversationSelected.style.display = 'none';
    conversationView.style.display = 'flex';
    conversationName.textContent = otherUserName;
    conversationDetails.textContent = 'Active conversation';
    
    await loadMessages(conversationId);
    markMessagesAsRead(conversationId);
}

// Load messages for a conversation
async function loadMessages(conversationId) {
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        displayMessages(data || []);
    } catch (error) {
        console.error('Load messages error:', error.message);
    }
}

// Display messages
function displayMessages(messages) {
    messagesList.innerHTML = '';
    
    messages.forEach(message => {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${message.sender_id === currentUser.id ? 'sent' : 'received'}`;
        
        bubble.innerHTML = `
            <div class="message-text">${message.content}</div>
            <div class="message-time">${formatMessageTime(message.created_at)}</div>
        `;
        
        messagesList.appendChild(bubble);
    });
    
    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
}

// Send a message
async function sendMessage() {
    const content = messageText.value.trim();
    
    if (!content || !currentConversationId) return;
    
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert([{
                conversation_id: currentConversationId,
                sender_id: currentUser.id,
                content,
                is_read: false,
                created_at: new Date()
            }]);
        
        if (error) throw error;
        
        // Update conversation timestamp
        await supabaseClient
            .from('conversations')
            .update({ updated_at: new Date() })
            .eq('id', currentConversationId);
        
        messageText.value = '';
        loadMessages(currentConversationId);
    } catch (error) {
        console.error('Send message error:', error.message);
        showToast('Error sending message', 'error');
    }
}

// Start a new conversation (called from product card)
window.startConversation = async function(sellerId, sellerName) {
    if (!currentUser) {
        showToast('Please sign in to message sellers', 'error');
        showPage('signin');
        return;
    }
    
    try {
        // Check if conversation already exists
        const { data: existing, error: searchError } = await supabaseClient
            .from('conversations')
            .select('id')
            .or(`and(participant1_id.eq.${currentUser.id},participant2_id.eq.${sellerId}),and(participant1_id.eq.${sellerId},participant2_id.eq.${currentUser.id})`)
            .single();
        
        if (existing) {
            // Open existing conversation
            showPage('dashboard');
            switchTab('messages');
            setTimeout(() => openConversation(existing.id, sellerName), 300);
            return;
        }
        
        // Create new conversation
        const { data: newConv, error } = await supabaseClient
            .from('conversations')
            .insert([{
                participant1_id: currentUser.id,
                participant2_id: sellerId,
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        showPage('dashboard');
        switchTab('messages');
        loadConversations();
        setTimeout(() => openConversation(newConv.id, sellerName), 300);
        showToast('Conversation started!', 'success');
    } catch (error) {
        console.error('Start conversation error:', error.message);
        showToast('Error starting conversation', 'error');
    }
};

// Note: Users start conversations by clicking the message icon on product cards
// The startConversation function is called from product cards in the search results

// Mark messages as read
async function markMessagesAsRead(conversationId) {
    try {
        await supabaseClient
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', currentUser.id);
        
        loadConversations();
    } catch (error) {
        console.error('Mark as read error:', error.message);
    }
}

// Format message timestamp
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Set up real-time message subscription
function setupMessageSubscription() {
    if (messageSubscription) return;
    
    messageSubscription = supabaseClient
        .channel('messages')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                if (payload.new.conversation_id === currentConversationId) {
                    loadMessages(currentConversationId);
                }
                loadConversations();
            }
        )
        .subscribe();
}

// Initialize database tables (run this once to set up your database)
async function initializeDatabase() {
    // This function would typically be run separately to set up the database
    // It's included here for reference
    
    // Create profiles table
    /*
    CREATE TABLE profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    */
    
    // Create products table
    /*
    CREATE TABLE products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category TEXT,
        image_url TEXT,
        seller_id UUID REFERENCES profiles(id) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    */
    
    // Create conversations table
    /*
    CREATE TABLE conversations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        participant1_id UUID REFERENCES profiles(id) NOT NULL,
        participant2_id UUID REFERENCES profiles(id) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    */
    
    // Create messages table
    /*
    CREATE TABLE messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        sender_id UUID REFERENCES profiles(id) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX idx_messages_sender ON messages(sender_id);
    */
    
    // Create verifications table
    /*
    CREATE TABLE verifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
        business_name TEXT,
        business_address TEXT,
        business_phone TEXT,
        id_document_url TEXT,
        business_document_url TEXT,
        status TEXT DEFAULT 'pending', -- pending, verified, rejected
        rejection_reason TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID REFERENCES profiles(id)
    );
    */
    
    // Create storage buckets
    /*
    -- Product images bucket
    const { data: productBucket, error: productError } = await supabaseClient.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
    });
    
    -- Verification documents bucket
    const { data: verificationBucket, error: verificationError } = await supabaseClient.storage.createBucket('verification-documents', {
        public: false,
        allowedMimeTypes: ['image/*', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
    });
    */
}

// Set up real-time subscriptions for products (optional)
function setupRealtimeSubscriptions() {
    // Subscribe to product changes
    supabaseClient
        .channel('products')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products' },
            (payload) => {
                console.log('Product change received!', payload);
                // Refresh products if needed
                if (currentUser) {
                    loadUserProducts();
                }
            }
        )
        .subscribe();
}

// ===== AI CHATBOX SYSTEM =====

// Chatbox DOM elements
const aiChatbox = document.getElementById('aiChatbox');
const chatboxMessages = document.getElementById('chatboxMessages');
const chatboxInput = document.getElementById('chatboxInput');
const chatboxSend = document.getElementById('chatboxSend');
const chatboxClose = document.getElementById('chatboxClose');
const chatboxToggle = document.getElementById('chatboxToggle');
const chatboxToggleFooter = document.getElementById('chatboxToggleFooter');
const chatboxToggleFloat = document.getElementById('chatboxToggleFloat');

// Product categories for AI understanding
const categories = [
    'Engine Parts', 'Brake System', 'Suspension', 'Electrical',
    'Transmission', 'Exhaust', 'Body Parts', 'Accessories',
    'Tires & Wheels', 'Other'
];

const mechanicalTopics = [
    {
        id: 'overheating',
        keywords: ['overheating', 'over heating', 'engine hot', 'running hot', 'temperature high', 'heat gauge']
    },
    {
        id: 'brakeNoise',
        keywords: ['brake noise', 'brakes squeal', 'squeaking brake', 'grinding brake', 'brake sound', 'screeching brake']
    },
    {
        id: 'noStart',
        keywords: ['won\'t start', 'no start', 'car not starting', 'engine won\'t crank', 'starter problem', 'battery dead']
    },
    {
        id: 'roughIdle',
        keywords: ['rough idle', 'engine misfire', 'idling rough', 'misfiring', 'shaking at idle', 'engine hesitation']
    }
];

const languageOptions = [
    { code: 'english', label: 'English' },
    { code: 'igbo', label: 'Igbo' },
    { code: 'yoruba', label: 'Yorùbá' },
    { code: 'pidgin', label: 'Pidgin' },
    { code: 'hausa', label: 'Hausa' }
];

const translations = {
    english: {
        languageSelected: `Great! I'll chat with you in {language}. How can I help today?`,
        welcomeMessage: `I'm your AI assistant. I can help you:<ul><li>🔍 Search for auto parts</li><li>🎯 Apply filters to your search</li><li>🧭 Guide you around the website</li><li>❓ Answer questions about GoLadipo</li></ul><p>How can I help you today?</p>`,
        navigatedHome: `I've taken you to the home page. Is there anything specific you'd like to explore?`,
        navigatedSearch: `I've opened the search page. You can search for auto parts here. What are you looking for?`,
        navigatedSignin: `I've opened the sign in page. Please enter your credentials to access your account.`,
        navigatedSignup: `I've opened the sign up page. Create a new account to start buying or selling auto parts.`,
        navigatedDashboard: `I've opened your dashboard. You can manage your products and profile here.`,
        dashboardRequiresAuth: `Please sign in first to access your dashboard. Would you like me to open the sign in page?`,
        searchPerformed: `I've searched for "{query}". Check the results below. Would you like to apply any filters?`,
        searchPrompt: `What part are you looking for? You can say things like "search for brake pads" or "find engine oil".`,
        categoryFilterApplied: `I've filtered the search to show only {category} products. Want to look for something specific here?`,
        priceFilterApplied: `I've applied a price filter: {min} - {max}.`,
        locationFilterApplied: `I've filtered results to show products from {location}.`,
        verifiedFilterApplied: `I've filtered to show only verified sellers so you can deal with trusted partners.`,
        sortPriceLow: `I've sorted the results by price: lowest to highest.`,
        sortPriceHigh: `I've sorted the results by price: highest to lowest.`,
        sortNewest: `I've sorted the results to show the newest products first.`,
        filtersCleared: `I've cleared all filters. The search is now reset.`,
        helpOverview: `I'm your AI assistant for GoLadipo! I can help you with:<ul><li>🔍 Finding the right parts</li><li>🎯 Applying category, price, or location filters</li><li>🧭 Navigating any page</li><li>❓ Answering questions about GoLadipo</li></ul><p>Try asking for a part or a filter.</p>`,
        aboutGoLadipo: `GoLadipo is an auto parts marketplace connecting mechanics and sellers with customers across Lagos, Nigeria.<ul><li>Search trusted listings from verified sellers</li><li>Contact sellers directly via phone</li><li>Focus on the Lagos market for fast delivery</li><li>Easy tools for both buyers and sellers</li></ul><p>Want to search for something now?</p>`,
        listCategories: `We have the following product categories:<ul><li>Engine Parts</li><li>Brake System</li><li>Suspension</li><li>Electrical</li><li>Transmission</li><li>Exhaust</li><li>Body Parts</li><li>Accessories</li><li>Tires & Wheels</li><li>Other</li></ul><p>You can say "show me engine parts" to filter.</p>`,
        howToBuy: `To buy parts on GoLadipo:<ol><li>Search for the part you need</li><li>Review the sellers and locations</li><li>Click the phone icon to call the seller</li><li>Agree on payment and delivery directly</li></ol><p>Need help finding your part?</p>`,
        howToSell: `To sell parts on GoLadipo:<ol><li>Sign up for an account</li><li>Open your dashboard</li><li>Use "Add Product" to list your parts</li><li>Keep your listings updated for buyers</li></ol><p>I can guide you through each step.</p>`,
        fallback: `I'm not sure I understood that. I can help you search for parts, apply filters, navigate the site, or answer questions about GoLadipo.`,
        priceAny: `Any`,
        selectLanguageFirst: `Please choose a language to start chatting.`
    },
    igbo: {
        languageSelected: `Ọ dị mma! Aga m asụ {language} mgbe anyị na-ekwurịta. Kedu ka m ga-esi nyere gị taa?`,
        welcomeMessage: `A bụ m onye enyemaka AI gị. Enwere m ike inyere gị:<ul><li>🔍 Chọọ akụkụ ụgbọala</li><li>🎯 Tọọ nzacha maka ọchụchọ gị</li><li>🧭 Gosi gị etu ị ga-esi gbanwee weebụsaịtị</li><li>❓ Zaa ajụjụ gbasara GoLadipo</li></ul><p>Kedu ihe ịchọrọ ka m mee?</p>`,
        navigatedHome: `Ebutela gị na ibe ụlọ. Ị chọrọ ka m gosipụta ihe pụrụ iche?`,
        navigatedSearch: `E meghere m ibe ọchụchọ. Ị nwere ike ịchọ akụkụ ụgbọala ebe a. Gịnị ka ị na-achọ?`,
        navigatedSignin: `E meghere m ibe nbanye. Tinye ozi akaụntụ gị ka ị banye.`,
        navigatedSignup: `E meghere m ibe ndebanye. Mee akaụntụ ọhụrụ ka ị malite ịzụta ma ọ bụ ree akụkụ.`,
        navigatedDashboard: `E meghere m dashboard gị. N'ebe a ka ị na-achịkwa ngwaahịa na profaịlụ gị.`,
        dashboardRequiresAuth: `Biko banye tupu ị nweta dashboard gị. Ka m mee ka ibe nbanye meghere?`,
        searchPerformed: `Achọpụtara m "{query}". Lelee nsonaazụ dị n'okpuru. Ị chọrọ itinye nzacha?`,
        searchPrompt: `Kedụ akụkụ ka ị na-achọ? Ị nwere ike ikwu "chọọ brake pad" ma ọ bụ "chọọ engine oil".`,
        categoryFilterApplied: `Atọgharịrị m ọchụchọ ka o gosipụta naanị ngwaahịa {category}. Ị chọrọ ihe pụrụ iche n'ime ìgwè a?`,
        priceFilterApplied: `Etinyela m nzacha ọnụahịa: {min} - {max}.`,
        locationFilterApplied: `Nsonaazụ a si na {location}.`,
        verifiedFilterApplied: `Echere m naanị ndị na-ere ahịa a kwadoro ka ị nwee ntụkwasị obi.`,
        sortPriceLow: `Nsonaazụ ahaziri site n'ọnụ ahịa site na nke kacha ala ruo nke kacha elu.`,
        sortPriceHigh: `Nsonaazụ ahaziri site n'ọnụ ahịa site na nke kacha elu ruo nke kacha ala.`,
        sortNewest: `Nsonaazụ kacha ọhụrụ dị ugbu a n'elu.`,
        filtersCleared: `E wepụla nzacha niile. Ọchịchọ amalitegharịrị.`,
        helpOverview: `A bụ m onye enyemaka AI nke GoLadipo! Enwere m ike inyere gị:<ul><li>🔍 Chọta akụkụ ziri ezi</li><li>🎯 Tọọ nzacha dịka ụdị, ọnụahịa ma ọ bụ ebe</li><li>🧭 Gosi gị ibe ọ bụla</li><li>❓ Zaa ajụjụ gbasara GoLadipo</li></ul><p>Gwa m ihe ịchọrọ.</p>`,
        aboutGoLadipo: `GoLadipo bụ ahịa akụkụ ụgbọala na-ejikọ ndị mekanik na ndị na-ere ahịa na ndị ahịa n'ofe Lagos, Naịjirịa.<ul><li>Chọọ ngwaahịa sitere n'aka ndị na-ere ahịa a kwadoro</li><li>Kpọọ onye na-ere ozugbo site na ekwentị</li><li>Lezie anya na ahịa Lagos maka nnyefe ngwa ngwa</li><li>Ngwaọrụ dị mfe maka ndị na-azụ na ndị na-ere</li></ul><p>Ị chọrọ ka m chọọ ihe ugbu a?</p>`,
        listCategories: `Anyị nwere ụdị ngwaahịa ndị a:<ul><li>Engine Parts</li><li>Brake System</li><li>Suspension</li><li>Electrical</li><li>Transmission</li><li>Exhaust</li><li>Body Parts</li><li>Accessories</li><li>Tires & Wheels</li><li>Other</li></ul><p>I nwere ike ikwu "gosipụta engine parts" iji zoo oke.</p>`,
        howToBuy: `Iji zụta akụkụ na GoLadipo:<ol><li>Chọọ akụkụ ịchọrọ</li><li>Nyochaa ndị na-ere na ebe ha nọ</li><li>Pịa akara ekwentị ka ị kpọọ onye na-ere</li><li>Kwekọọ banyere ịkwụ ụgwọ na nnyefe ozugbo</li></ol><p>Ị chọrọ ka m nyere gị chọta akụkụ ahụ?</p>`,
        howToSell: `Iji ree akụkụ na GoLadipo:<ol><li>Debanye akaụntụ</li><li>Meghee dashboard gị</li><li>Jiri "Add Product" tinye ngwaahịa</li><li>Debe ndepụta gị ka ndị na-azụ hụ ha</li></ol><p>Agam eduzi gị site na nzọụkwụ ọ bụla.</p>`,
        fallback: `Aghọtaghị m nke ahụ nke ọma. Enwere m ike inyere gị ịchọ akụkụ, tọọ nzacha, gbanwee weebụsaịtị, ma ọ bụ zaa ajụjụ gbasara GoLadipo.`,
        priceAny: `Ọ bụla`,
        selectLanguageFirst: `Biko họrọ asụsụ tupu anyị bido ikwurịta.`
    },
    yoruba: {
        languageSelected: `O tayọ! Emi yoo ba ọ sọrọ ni {language}. Kini mo le ran ọ lọwọ loni?`,
        welcomeMessage: `Ẹ ku abọ! Emi ni iranwọ AI rẹ. Mo le ṣe iranlọwọ fun ọ:<ul><li>🔍 Wa awọn ẹya ọkọ</li><li>🎯 Lo àlẹmọ lati dara si abajade</li><li>🧭 Dari ọ ka kiri oju opo wẹẹbu</li><li>❓ Dahun ibeere nipa GoLadipo</li></ul><p>Ki ni o fẹ ki n ṣe fun ọ?</p>`,
        navigatedHome: `Mo ti gbe ọ pada si oju-ile. Ṣe ohun pataki wa ti o fẹ wo?`,
        navigatedSearch: `Mo ti ṣii oju-iwe wiwa. O le wa awọn ẹya ọkọ nibi. Kí ni o ń wá?`,
        navigatedSignin: `Mo ti ṣii oju-iwe ìbuwọlé. Jọwọ tẹ alaye rẹ lati wọle.`,
        navigatedSignup: `Mo ti ṣii oju-iwe ìforúkọsílẹ̀. Ṣẹda àkọọlẹ tuntun lati bẹ̀rẹ̀ sí ra tabi ta awọn ẹya.`,
        navigatedDashboard: `Mo ti ṣii dasibodu rẹ. O le ṣakoso awọn ọja ati profaili rẹ nibẹ.`,
        dashboardRequiresAuth: `Jọwọ wọle kí o tó lo dasibodu rẹ. Ṣe kí n ṣí oju-iwe ìbuwọlé fún ọ?`,
        searchPerformed: `Mo ti wa “{query}”. Ṣayẹwo abajade ni isalẹ. Ṣe o fẹ fi àlẹmọ kun?`,
        searchPrompt: `Kí ni apakan tí o ń wá? O le sọ “wa brake pad” tabi “wa engine oil”.`,
        categoryFilterApplied: `Mo ti dín àwárí naa ku sí {category} nikan. Ṣe o fẹ nkan pataki ninu ẹ̀ka yìí?`,
        priceFilterApplied: `Mo ti fi àlẹmọ owo kun: {min} - {max}.`,
        locationFilterApplied: `Abajade wọ̀nyí wá láti {location}.`,
        verifiedFilterApplied: `Mo ti fi hàn awọn onijaja tí a fọwọ́si nìkan ki o le ra lọ́wọ́ ẹni tí o lè gbẹ́kẹ̀lé.`,
        sortPriceLow: `Mo ti ṣeto abajade lati owo ti o kere ju de ti o ga ju.`,
        sortPriceHigh: `Mo ti ṣeto abajade lati owo ti o ga ju de ti o kere ju.`,
        sortNewest: `Mo ti gbe awọn ọja tuntun sí oke.`,
        filtersCleared: `Mo ti pa gbogbo àlẹmọ rẹ. Àwárí ti tún bẹrẹ.`,
        helpOverview: `Emi ni iranwọ AI fun GoLadipo! Mo le:<ul><li>🔍 Ran ọ lọwọ lati wa awọn ẹya</li><li>🎯 Ṣeto àlẹmọ fun ẹka, owo, tabi ibi</li><li>🧭 Dari ọ ka kiri eyikeyi oju-iwe</li><li>❓ Dahun awọn ibeere nipa GoLadipo</li></ul><p>Kan sọ fun mi ohun ti o nilo.</p>`,
        aboutGoLadipo: `GoLadipo jẹ ọjà ori ayelujara fun awọn ẹya ọkọ ti ń so awọn mekaniki ati awọn onija pọ mọ awọn onibara ni Lagos.<ul><li>Wa awọn ọja lati ọdọ awọn onijaja tí a fọwọ́si</li><li>Pe awọn onijaja taara lori foonu</li><li>Ilọra lori ọja Lagos fun fífi ránṣẹ yarayara</li><li>Pẹpẹ tí ó rọrùn fun awọn onra ati awọn onijaja</li></ul><p>Ṣe o fẹ ki n ran ọ lọwọ lati wa nkan kan?</p>`,
        listCategories: `A ni awọn ẹ̀ka ọja wọnyi:<ul><li>Engine Parts</li><li>Brake System</li><li>Suspension</li><li>Electrical</li><li>Transmission</li><li>Exhaust</li><li>Body Parts</li><li>Accessories</li><li>Tires & Wheels</li><li>Other</li></ul><p>O le sọ “show me engine parts” lati fi àlẹmọ síi.</p>`,
        howToBuy: `Lati ra lori GoLadipo:<ol><li>Wa apakan tí o fẹ</li><li>Ṣayẹwo alaye onijaja ati ibi rẹ</li><li>Tẹ aami foonu lati pe onijaja</li><li>Ṣe ìpinnu lori owo ati fífi ránṣẹ pọ</li></ol><p>Nilo iranlọwọ lati wa nkan naa?</p>`,
        howToSell: `Lati ta lori GoLadipo:<ol><li>Ṣe àkọọlẹ tuntun</li><li>Ṣí dasibodu rẹ</li><li>Lo "Add Product" lati gbe ọja kalẹ</li><li>Máa ṣe imudojuiwọn atokọ rẹ fun awọn onra</li></ol><p>Emi yoo dari ọ ni gbogbo igbesẹ.</p>`,
        fallback: `Mi ò ye ohun tí o sọ. Mo le ran ọ lọwọ lati wa awọn ẹya, lo àlẹmọ, dari ọ kiri oju opo wẹẹbu, tabi dahun ibeere nipa GoLadipo.`,
        priceAny: `Ohunkóhun`,
        selectLanguageFirst: `Jọwọ yan ede kan kí a tó bẹrẹ ibaraẹnisọrọ.`
    },
    pidgin: {
        languageSelected: `Correct! I go yarn you for {language}. Wetin you wan make I do today?`,
        welcomeMessage: `Na me be your AI assistant. I fit help you:<ul><li>🔍 Find motor parts</li><li>🎯 Add filters to narrow your search</li><li>🧭 Show you road for the website</li><li>❓ Answer any question about GoLadipo</li></ul><p>How I fit take help you?</p>`,
        navigatedHome: `I don carry you go home page. Anything wey you wan see?`,
        navigatedSearch: `I don open the search page. Wetin part you dey find?`,
        navigatedSignin: `Sign-in page don open. Put your details make you log in.`,
        navigatedSignup: `Sign-up page don open. Create new account make you start to buy or sell parts.`,
        navigatedDashboard: `I don open your dashboard. You fit manage products and profile there.`,
        dashboardRequiresAuth: `You gats log in before you fit use dashboard. Make I open the sign-in page?`,
        searchPerformed: `I don search for "{query}". Check the results below. You wan add filters?`,
        searchPrompt: `Which part you dey find? You fit talk "search brake pad" or "find engine oil".`,
        categoryFilterApplied: `I don set am make e show only {category} products. You wan look for something specific?`,
        priceFilterApplied: `I don put price filter: {min} - {max}.`,
        locationFilterApplied: `Results now dey show sellers wey dey {location}.`,
        verifiedFilterApplied: `Na only verified sellers I leave make you fit trust who you dey deal with.`,
        sortPriceLow: `I arrange am from cheapest go costliest.`,
        sortPriceHigh: `I arrange am from costliest go cheapest.`,
        sortNewest: `Latest products dey on top now.`,
        filtersCleared: `I don clear every filter. Start afresh.`,
        helpOverview: `Na me be GoLadipo AI helper! I fit:<ul><li>🔍 Help you find parts</li><li>🎯 Add filters like category, price or location</li><li>🧭 Show you any page</li><li>❓ Answer question about GoLadipo</li></ul><p>Just tell me wetin you need.</p>`,
        aboutGoLadipo: `GoLadipo na marketplace wey join mechanics and sellers with customers for Lagos.<ul><li>Find trusted listings from verified sellers</li><li>Call sellers direct for phone</li><li>Focus for Lagos so delivery quick</li><li>Easy tools for buyers and sellers</li></ul><p>Make I help you search something?</p>`,
        listCategories: `We get these categories:<ul><li>Engine Parts</li><li>Brake System</li><li>Suspension</li><li>Electrical</li><li>Transmission</li><li>Exhaust</li><li>Body Parts</li><li>Accessories</li><li>Tires & Wheels</li><li>Other</li></ul><p>Just talk "show me engine parts" make I filter am.</p>`,
        howToBuy: `To buy for GoLadipo:<ol><li>Search the part wey you need</li><li>Check seller info and location</li><li>Tap the phone icon call the seller</li><li>Arrange payment and delivery with am</li></ol><p>Need help to find the part?</p>`,
        howToSell: `To sell for GoLadipo:<ol><li>Register new account</li><li>Enter your dashboard</li><li>Use "Add Product" put your parts</li><li>Dey update the listings make buyers see am</li></ol><p>I fit guide you anytime.</p>`,
        fallback: `I no too understand that one. I fit help you find parts, add filters, show you page, or answer GoLadipo questions.`,
        priceAny: `Any`,
        selectLanguageFirst: `Abeg choose language first make we start to yarn.`
    },
    hausa: {
        languageSelected: `Madalla! Zan yi magana da kai a {language}. Ta yaya zan taimake ka yau?`,
        welcomeMessage: `Ni ne mataimaki na AI. Zan iya taimaka maka da:<ul><li>🔍 Neman sassan mota</li><li>🎯 Saita matattaran bincike</li><li>🧭 Nuna maka yadda ake zagayawa shafin</li><li>❓ Amsa tambayoyi game da GoLadipo</li></ul><p>Me kake bukata yanzu?</p>`,
        navigatedHome: `Na kai ka shafin gida. Kana son wani abu na musamman?`,
        navigatedSearch: `Na buɗe shafin bincike. Za ka iya neman sassan mota a nan. Me kake nema?`,
        navigatedSignin: `Na buɗe shafin shiga. Shigar da bayananka domin ka shiga.`,
        navigatedSignup: `Na buɗe shafin yin rajista. Ƙirƙiri sabon asusu domin fara siyayya ko sayarwa.`,
        navigatedDashboard: `Na buɗe dashboard ɗinka. Za ka iya sarrafa kayayyaki da bayaninka a nan.`,
        dashboardRequiresAuth: `Da fatan ka shiga kafin ka iya amfani da dashboard. Ina buɗe maka shafin shiga?`,
        searchPerformed: `Na bincika "{query}". Duba sakamakon a ƙasa. Kana so mu saka wani matattara?`,
        searchPrompt: `Wanne ɓangare kake nema? Kana iya cewa "nemo brake pad" ko "nemo engine oil".`,
        categoryFilterApplied: `Na tsaftace binciken ya zama na {category} kaɗai. Kana son wani abu na musamman a nan?`,
        priceFilterApplied: `Na saka matattarar farashi: {min} - {max}.`,
        locationFilterApplied: `Sakamakon yanzu daga {location}.`,
        verifiedFilterApplied: `Na bar waɗanda aka tantance kaɗai domin ka yi hulɗa da masu inganci.`,
        sortPriceLow: `Na shirya sakamakon daga mafi arha zuwa mafi tsada.`,
        sortPriceHigh: `Na shirya sakamakon daga mafi tsada zuwa mafi arha.`,
        sortNewest: `Na sanya sabbin kayayyaki a saman jerin.`,
        filtersCleared: `Na share duk matattara. Binciken ya fara sabo.`,
        helpOverview: `Ni ne mataimakin GoLadipo! Zan iya:<ul><li>🔍 Nemo maka kayayyaki</li><li>🎯 Saita matattaran nau'i, farashi ko wuri</li><li>🧭 Nuna maka kowanne shafi</li><li>❓ Amsa tambayoyin GoLadipo</li></ul><p>Ka gaya min abin da kake so.</p>`,
        aboutGoLadipo: `GoLadipo kasuwar sassan mota ce da ke haɗa masassaƙa da 'yan kasuwa da kwastomomi a Lagos, Najeriya.<ul><li>Nemo kayayyaki daga masu sayarwa da aka tantance</li><li>Kira su kai tsaye ta waya</li><li>Mayar da hankali kan kasuwar Lagos don isarwa cikin sauri</li><li>Dandamali mai sauƙi ga masu siye da masu sayarwa</li></ul><p>Ina iya taimaka maka ka fara bincike yanzu?</p>`,
        listCategories: `Muna da waɗannan rukunan kayayyaki:<ul><li>Engine Parts</li><li>Brake System</li><li>Suspension</li><li>Electrical</li><li>Transmission</li><li>Exhaust</li><li>Body Parts</li><li>Accessories</li><li>Tires & Wheels</li><li>Other</li></ul><p>Za ka iya cewa "nuna min engine parts" domin a tace.</p>`,
        howToBuy: `Don siyayya a GoLadipo:<ol><li>Nemo sassan da kake so</li><li>Duba bayanin mai sayarwa da wurin sa</li><li>Danna alamar waya domin ka kira shi</li><li>Yi magana game da biyan kuɗi da isarwa kai tsaye</li></ol><p>Kana bukatar taimako wajen nemo sassan?</p>`,
        howToSell: `Don sayarwa a GoLadipo:<ol><li>Yi rajista da sabon asusu</li><li>Buɗe dashboard ɗinka</li><li>Yi amfani da "Add Product" don ɗora kayayyaki</li><li>Sabunta jerin kayayyaki akai-akai domin masu siye su gani</li></ol><p>Zan iya jagorantar ka a kowane mataki.</p>`,
        fallback: `Ban gane abin da ka ce ba. Zan iya taimaka maka da binciken kayayyaki, matattara, ko tambayoyi game da GoLadipo.`,
        priceAny: `Duk farashi`,
        selectLanguageFirst: `Da fatan ka zaɓi harshe kafin mu fara hira.`
    }
};

const mechanicalAdviceContent = {
    overheating: {
        english: {
            summary: `Sounds like your engine is overheating.`,
            stepsIntro: `Try these quick checks:`,
            steps: [
                `Safely pull over, turn off the A/C, and let the engine idle so the cooling fan can run.`,
                `After the temperature drops, check the coolant level and look for leaks around the radiator hoses and water pump.`,
                `Inspect the radiator fan and drive belt—if the fan is not spinning, the motor, relay, or belt may have failed.`,
                `If overheating continues, avoid driving and have a mechanic pressure-test the cooling system.`
            ],
            partsIntro: `Parts that usually solve overheating problems:`,
            parts: [
                `Coolant / antifreeze`,
                `Radiator cap`,
                `Thermostat`,
                `Radiator fan motor or relay`,
                `Upper & lower radiator hoses`
            ],
            caution: `Never open the radiator cap while the engine is still hot—wait until it cools completely.`,
            buyPrompt: `Tell me when you want me to search GoLadipo for these cooling system parts.`
        },
        igbo: {
            summary: `O yiri ka engine gị na-ekpo oke ọkụ.`,
            stepsIntro: `Gbalịa ihe ndị a ngwa ngwa:`,
            steps: [
                `Kwụsị ụgbọala n'ebe dị nchebe, gbanyụọ A/C ma hapụ engine ka ọ rụọ nwayọọ ka fan wee kpoo ọkụ.`,
                `Mgbe okpomọkụ dara, lelee ọkwa coolant ma chọọ ntụpọ mmiri n'akụkụ hose radiator na water pump.`,
                `Lelee radiator fan na belt; ma ọ bụrụ na fan anaghị atụgharị, injin fan, relay, ma ọ bụ belt nwere ike ịdaa.`,
                `Ọ bụrụ na ọkụ ahụ agaghị akwụsị, ejila ụgbọala gaa njem; ka onye mekanik nwalee usoro oyi kpamkpam.`
            ],
            partsIntro: `Chee echiche ịzụta akụkụ ndị a:`,
            parts: [
                `Coolant / antifreeze`,
                `Radiator cap`,
                `Thermostat`,
                `Radiator fan motor or relay`,
                `Upper & lower radiator hoses`
            ],
            caution: `Emegheghi mkpuchi radiator mgbe engine ka na-ekpo ọkụ; chere ruo mgbe o kpoo oyi kpamkpam.`,
            buyPrompt: `Gwa m ma ịchọrọ ka m chọọ akụkụ oyi ndị a n'ahịa GoLadipo.`
        },
        yoruba: {
            summary: `O dabi pe engine rẹ n gbona ju.`,
            stepsIntro: `Ṣe ayẹwo kukuru wọnyi:`,
            steps: [
                `Duro ni ibi ailewu, pa A/C ki o jẹ ki engine maa ṣiṣẹ laiyara ki afẹfẹ tutu le ṣiṣẹ.`,
                `Nigbati iwọn otutu ba dinku, ṣayẹwo ipele coolant ki o si wo boya omi n jo ni ayika hose radiator ati water pump.`,
                `Ṣayẹwo afẹfẹ radiator ati beliti; bi afẹfẹ ko ba yi ka, motor, relay tabi beliti le ti bajẹ.`,
                `Ti iṣoro ko ba dẹkun, maṣe maa wakọ; jẹ ki mekaniki ṣe idanwo eto itutu naa.`
            ],
            partsIntro: `Awọn ẹya ti a maa n lo lati yanju overheating:`,
            parts: [
                `Coolant / antifreeze`,
                `Radiator cap`,
                `Thermostat`,
                `Radiator fan motor or relay`,
                `Upper & lower radiator hoses`
            ],
            caution: `Maṣe yọ ideri radiator nigba ti engine ṣi n gbona; duro de ki o tutu patapata.`,
            buyPrompt: `So fun mi ti o ba fẹ ki n wa awọn ẹya tutu wọnyi lori GoLadipo.`
        },
        pidgin: {
            summary: `E be like say your engine dey overheat.`,
            stepsIntro: `Try do these quick checks:`,
            steps: [
                `Park for safe place, off the A/C and leave the engine make e idle so the fan go cool am.`,
                `When the heat reduce, check coolant level and look for leak around radiator hose and water pump.`,
                `Confirm say radiator fan and belt dey work—if fan no dey spin, motor, relay or belt fit don spoil.`,
                `If heat still dey, no drive again; allow mechanic test the cooling system with pressure.`
            ],
            partsIntro: `Parts wey dey solve overheating:`,
            parts: [
                `Coolant / antifreeze`,
                `Radiator cap`,
                `Thermostat`,
                `Radiator fan motor or relay`,
                `Upper & lower radiator hoses`
            ],
            caution: `No ever open radiator cap when engine still hot—wait make e cool finish.`,
            buyPrompt: `Just yarn me make I search GoLadipo for these cooling parts for you.`
        },
        hausa: {
            summary: `Alamar tana nuna injin ɗinka yana zafi sosai.`,
            stepsIntro: `Yi waɗannan binciken cikin gaggawa:`,
            steps: [
                `Tsaya a wuri mai aminci, kashe A/C sannan ka bar injin yana aiki a hankali domin fan ya yi sanyaya.`,
                `Da zarar zafin ya ragu, duba matakin coolant kuma ka nemi yayyafawar ruwa a kusa da bututun radiator da famfon ruwa.`,
                `Duba fan ɗin radiator da bel; idan fan ba ya juyawa, mota, relay ko bel ɗin na iya lalacewa.`,
                `Idan zafi bai tsaya ba, kada ka ci gaba da tukin mota; bari makaniki ya gwada tsarin sanyaya.`
            ],
            partsIntro: `Yawanci ana buƙatar waɗannan sassa domin matsalar zafi:`,
            parts: [
                `Coolant / antifreeze`,
                `Radiator cap`,
                `Thermostat`,
                `Radiator fan motor or relay`,
                `Upper & lower radiator hoses`
            ],
            caution: `Kada ka buɗe murfin radiator yayin da injin har yanzu yana zafi; jira ya huce gaba ɗaya.`,
            buyPrompt: `Gaya min idan kana so in nemo maka waɗannan sassan sanyaya a GoLadipo.`
        }
    },
    brakeNoise: {
        english: {
            summary: `That squeal or grinding points to worn brake parts.`,
            stepsIntro: `Here is how to troubleshoot it:`,
            steps: [
                `Look through the wheel to see how thick the brake pads are—if they are thin, they need to be replaced.`,
                `If you hear a grinding metal-on-metal sound, the rotors may already be scored.`,
                `Check the brake fluid level; low fluid can also trigger warning lights.`,
                `Avoid spirited driving until new pads/rotors are installed.`
            ],
            partsIntro: `Common brake parts to order:`,
            parts: [
                `Front or rear brake pads`,
                `Brake rotors / discs`,
                `Brake hardware kit or shims`,
                `Brake fluid`
            ],
            caution: `Metal-on-metal grinding means you should stop driving to protect the brake calipers.`,
            buyPrompt: `Say the word and I'll search GoLadipo for quality brake components.`
        },
        igbo: {
            summary: `Ụda ahụ na-egosi na brake pads ma ọ bụ rotors agwụla.`,
            stepsIntro: `Mee nyocha ndị a:`,
            steps: [
                `Lelee site n'akụkụ wiil hụ ma brake pad ka nwere ibu; ma ọ bụrụ na ọ dị ntakịrị, gbanwee ya.`,
                `Ọ bụrụ na ị nụrụ ụda igwe na-agbaji, rotors nwere ike ịdị njọ.`,
                `Lelee ọkwa brake fluid; ọkwa dị ala nwekwara ike kpalite ìhè ịdọ aka na ntị.`,
                `Egbula ịnya ọsọ ruo mgbe a gbanwere pads na rotors.`
            ],
            partsIntro: `Akụkụ brake a na-achọkarị:`,
            parts: [
                `Front or rear brake pads`,
                `Brake rotors / discs`,
                `Brake hardware kit or shims`,
                `Brake fluid`
            ],
            caution: `Mgbe igwe na-agbaji na-abụ ụda igwe na igwe, kwụsị ịnya ka ị chekwaa brake caliper.`,
            buyPrompt: `Gwa m ka m chọọ akụkụ brake ndị a na GoLadipo maka gị.`
        },
        yoruba: {
            summary: `Ariwo yẹn fihan pe pad tabi rotor brake ti wọ.`,
            stepsIntro: `Gba igbesẹ wọnyi:`,
            steps: [
                `Wo laarin rim lati rii bi sanra brake pad ṣe ri; ti o ba rẹ̀ kéré, o yẹ ki a ropo.`,
                `Ti o ba n gbo ohun irin si irin, rotor le ti fọ tẹlẹ.`,
                `Ṣayẹwo ipele omi brake; ti o ba kéré, ina ikilọ le tan.`,
                `Má ṣe wakọ lórí iyara titi ti a fi ropo pad ati rotor tuntun.`
            ],
            partsIntro: `Awọn ẹya brake ti o yẹ ki o ra:`,
            parts: [
                `Front or rear brake pads`,
                `Brake rotors / discs`,
                `Brake hardware kit or shims`,
                `Brake fluid`
            ],
            caution: `Ohun irin-si-irin tumọ si pe o yẹ ki o da wakọ duro ki o ma ba jẹ caliper.`,
            buyPrompt: `Ṣe mi ni mimọ ki n wa awọn ẹya brake to péye lori GoLadipo.`
        },
        pidgin: {
            summary: `That screech dey show say brake parts don wear.`,
            stepsIntro: `Na wetin you go do:`,
            steps: [
                `Look inside the rim to see if brake pad still thick; if e slim, change am.`,
                `If na metal dey grind metal, the rotor don dey cut already.`,
                `Check brake fluid level because low fluid fit on bring warning light.`,
                `No dey drive fast till you fit replace pads and rotors.`
            ],
            partsIntro: `Brake parts wey you fit buy:`,
            parts: [
                `Front or rear brake pads`,
                `Brake rotors / discs`,
                `Brake hardware kit or shims`,
                `Brake fluid`
            ],
            caution: `Once you hear metal-on-metal, park the car make you no spoil caliper.`,
            buyPrompt: `Holla me make I find beta brake parts for GoLadipo.`
        },
        hausa: {
            summary: `Karan ƙwarya ko gugar karfe yana nuna pad ɗin birki sun ƙare.`,
            stepsIntro: `Ga abin da za ka dubawa:`,
            steps: [
                `Kalli cikin tayar ka ga kaurin pad ɗin birki; idan sun yi kaɗan, sauya su.`,
                `Idan kana jin karar ƙarfe kan ƙarfe, rotors sun riga sun lalace.`,
                `Duba matakin ruwan birki; idan ya ragu, zai kunna fitilar gargaɗi.`,
                `Kada ka yi tuki da karfi har sai an saka sababbin pad da rotors.`
            ],
            partsIntro: `Sassan birki da ake yawan siya:`,
            parts: [
                `Front or rear brake pads`,
                `Brake rotors / discs`,
                `Brake hardware kit or shims`,
                `Brake fluid`
            ],
            caution: `Karar ƙarfe-kan-ƙarfe na nufin ya kamata ka tsaya don kare caliper.`,
            buyPrompt: `Fadi min idan kana so in nemo maka kayan birki masu kyau a GoLadipo.`
        }
    },
    noStart: {
        english: {
            summary: `If the engine won't start, begin with the battery and starter circuit.`,
            stepsIntro: `Follow these steps:`,
            steps: [
                `Check if the dash lights and headlamps are bright—dim lights usually mean weak battery voltage.`,
                `Inspect battery terminals for corrosion and tighten/clean them.`,
                `Try jump-starting; if the engine cranks with a boost, the battery is failing.`,
                `If you only hear a single click, the starter motor or relay may be stuck.`
            ],
            partsIntro: `Helpful parts for no-start issues:`,
            parts: [
                `Car battery`,
                `Starter motor`,
                `Battery terminals & cables`,
                `Jumper cables / booster pack`
            ],
            caution: `Always match positive-to-positive and negative-to-negative when jump-starting.`,
            buyPrompt: `Need any of these? I can search GoLadipo for fresh electrical parts.`
        },
        igbo: {
            summary: `Ọ bụrụ na engine anaghị amalite, bido site n'ịlele batrị na starter.`,
            stepsIntro: `Soro usoro ndị a:`,
            steps: [
                `Lelee ma ọkụ dashboard na headlamp na-enwu; ọkụ dị nwayọọ na-egosi batrị dara.`,
                `Nyocha terminal batrị maka corrosion ma sachapụ ha nke ọma.`,
                `Nwale jump-start; ma ọ bụrụ na engine kbanye mgbe e nyere ya ọkụ, batrị kwesịrị ịgbanwe.`,
                `Ọ bụrụ na ị nụ naanị otu mkpịsị ụda, starter motor ma ọ bụ relay nwere ike idina.`
            ],
            partsIntro: `Akụrụngwa bara uru maka nsogbu nbido:`,
            parts: [
                `Car battery`,
                `Starter motor`,
                `Battery terminals & cables`,
                `Jumper cables / booster pack`
            ],
            caution: `Jikọọ positive na positive, negative na negative mgbe ị na-eme jump-start.`,
            buyPrompt: `Gwa m ma ịchọrọ ka m chọọ batrị, starter, ma ọ bụ waya ọhụrụ.`
        },
        yoruba: {
            summary: `Ti engine ko ba fẹ tan, bẹrẹ si wo batiri ati starter.`,
            stepsIntro: `Gba igbesẹ wọnyi:`,
            steps: [
                `Ṣayẹwo boya imọlẹ dashboard ati headlamp n tan gan; imọlẹ alailagbara maa n tumọ si batiri ti rọ.`,
                `Wo awọn teermina batiri fun rust ki o sọ di mimọ/tighten.`,
                `Gbiyanju jump-start; ti engine ba yi ka nigbati a ba fun ni agbara ita, batiri ti rẹ.`,
                `Ti ohun kan ṣoṣo ba dun, starter motor tabi relay le di.`
            ],
            partsIntro: `Awọn ẹya ti o wulo fun iṣoro ibẹrẹ:`,
            parts: [
                `Car battery`,
                `Starter motor`,
                `Battery terminals & cables`,
                `Jumper cables / booster pack`
            ],
            caution: `Nigbati o ba n jump-start, so rere mọ rere ati odi mọ odi.`,
            buyPrompt: `Fun mi ni aṣẹ ki n wa batiri, starter tabi waya tuntun lori GoLadipo.`
        },
        pidgin: {
            summary: `If motor no wan start, check battery and starter first.`,
            stepsIntro: `Do am like this:`,
            steps: [
                `Look whether dashboard light and headlamp bright; if dem dull, battery weak.`,
                `Check battery head make sure corrosion no dey and tighten am.`,
                `Try jump-start; if motor start when you boost, battery don weak finish.`,
                `If na only click you dey hear, starter motor or relay fit jam.`
            ],
            partsIntro: `Parts wey help for no-start wahala:`,
            parts: [
                `Car battery`,
                `Starter motor`,
                `Battery terminals & cables`,
                `Jumper cables / booster pack`
            ],
            caution: `When you wan jump-start, join plus to plus and minus to minus only.`,
            buyPrompt: `Need any of these? I fit find fresh electrical parts for GoLadipo.`
        },
        hausa: {
            summary: `Idan injin bai fara ba, fara da batir da starter.`,
            stepsIntro: `Bi waɗannan matakan:`,
            steps: [
                `Duba ko fitilun dash da headlamp suna haske; idan sun yi rauni, batir ɗin ya yi ƙasa.`,
                `Kalli sandunan batir domin tsatsa kuma ka tsabtace su.`,
                `Gwada jump-start; idan injin ya yi juyi da taimako, batir ɗin na bukatar sauyawa.`,
                `Idan ka ji danna ɗaya, starter ko relay na iya makalewa.`
            ],
            partsIntro: `Kayayyakin da ke taimaka wa matsalar farawa:`,
            parts: [
                `Car battery`,
                `Starter motor`,
                `Battery terminals & cables`,
                `Jumper cables / booster pack`
            ],
            caution: `Lokacin jump-start, haɗa tabbatacce da tabbatacce, mara kyau da mara kyau.`,
            buyPrompt: `Ka gaya min idan kana so in samo batir ko sassan lantarki a GoLadipo.`
        }
    },
    roughIdle: {
        english: {
            summary: `A rough idle or misfire usually means fuel, air, or ignition issues.`,
            stepsIntro: `Work through these checks:`,
            steps: [
                `Scan for check-engine codes if possible and note any cylinder misfire codes.`,
                `Inspect spark plugs and coil packs; fouled plugs should be replaced as a set.`,
                `Look for vacuum leaks on hoses and the intake boot—hissing sounds indicate leaks.`,
                `Clean the throttle body or MAF sensor and replace a dirty air filter.`
            ],
            partsIntro: `Useful parts to restore a smooth idle:`,
            parts: [
                `Spark plugs`,
                `Ignition coil packs or plug wires`,
                `Air filter`,
                `MAF/throttle body cleaner`,
                `Fuel injector cleaner`
            ],
            caution: `If the check-engine light flashes, avoid heavy acceleration to protect the catalytic converter.`,
            buyPrompt: `Ready to fix it? I can look up ignition and intake parts on GoLadipo.`
        },
        igbo: {
            summary: `Mgbe engine na-agagharị ma ọ bụ na-emehie ọsọ, ọ bụkarị nsogbu mmanụ, ikuku, ma ọ bụ ọkụ.`,
            stepsIntro: `Lelee ihe ndị a:`,
            steps: [
                `Jụọ maka koodu check-engine ma depụta koodu cylinder misfire ọ bụla.`,
                `Nyocha spark plugs na coil packs; gbanwee plugs ndị e jiri nwayọọ ma dochie ha otu.`,
                `Chọọ oghere ikuku na hose na intake boot; ụda hissing na-egosi nkwarụ.`,
                `Sachapụ throttle body ma ọ bụ MAF ma dochie air filter ma ọ bụrụ na ọ jọgburu.`
            ],
            partsIntro: `Akụkụ ndị na-eme ka engine dị jụụ ọzọ:`,
            parts: [
                `Spark plugs`,
                `Ignition coil packs or plug wires`,
                `Air filter`,
                `MAF/throttle body cleaner`,
                `Fuel injector cleaner`
            ],
            caution: `Ọ bụrụ na ọkụ check-engine na-enwu ngwa ngwa, zere ịgbalite ọsọ ka ọ ghara imerụ catalytic converter.`,
            buyPrompt: `Gwa m ka m chọọ plugs, coil, na air filter ọhụrụ maka gị.`
        },
        yoruba: {
            summary: `Idle to n ru tabi misfire maa n jẹ iṣoro epo, afẹfẹ tabi ina.`,
            stepsIntro: `Ṣayẹwo eyi:`,
            steps: [
                `Ka koodu check-engine ti o ba ṣee ṣe, ki o kọ eyikeyi koodu misfire silinda.`,
                `Ṣayẹwo spark plug ati coil pack; rọpo gbogbo plug ti o ti bàjẹ jọ.`,
                `Wa fun jijo ninu awọn hose ati intake boot; ohun sisun n tọka si jijo.`,
                `Nu throttle body tabi MAF ki o si rọpo àlẹmọ afẹfẹ tí ó ti di ete.`
            ],
            partsIntro: `Awọn ẹya to ran lọwọ lati jẹki idle dan:`,
            parts: [
                `Spark plugs`,
                `Ignition coil packs or plug wires`,
                `Air filter`,
                `MAF/throttle body cleaner`,
                `Fuel injector cleaner`
            ],
            caution: `Ti fitila check-engine ba n tan loju, ma ṣe tẹ gaasi ju lati daabobo catalytic converter.`,
            buyPrompt: `Ṣetan lati tun un ṣe? Emi le wa awọn ẹya ina ati intake lori GoLadipo.`
        },
        pidgin: {
            summary: `Rough idle or misfire mean fuel/air/ignition wahala dey.`,
            stepsIntro: `Check these things:`,
            steps: [
                `Scan for check-engine code if you fit and keep note of any misfire code.`,
                `Look your spark plugs and coil pack; once plug dirty, change the full set.`,
                `Find vacuum leak around hose and intake boot—if you hear hiss, leak dey.`,
                `Clean throttle body or MAF and change dirty air filter.`
            ],
            partsIntro: `Parts wey go make engine calm again:`,
            parts: [
                `Spark plugs`,
                `Ignition coil packs or plug wires`,
                `Air filter`,
                `MAF/throttle body cleaner`,
                `Fuel injector cleaner`
            ],
            caution: `If check-engine light dey flash, no press throttle hard so catalytic converter no go spoil.`,
            buyPrompt: `Make I help you find plugs, coils and air filter for GoLadipo? Just talk.`
        },
        hausa: {
            summary: `Rough idle ko misfire yawanci yana nufin matsalar mai, iska ko wutar feshi.`,
            stepsIntro: `Duba waɗannan:`,
            steps: [
                `Idan zai yiwu, karanta lambar check-engine kuma rubuta kowace lambar misfire.`,
                `Duba spark plugs da coil packs; a maye gurbin plugs ɗin da suka lalace gaba ɗaya.`,
                `Nemi yayyafawar iska a bututun vacuum da intake boot; sautin huci yana nuna yayyafawa.`,
                `Tsabtace throttle body ko MAF sannan ka maye gurbin tace iska idan ya datti.`
            ],
            partsIntro: `Sassan da ke taimakawa a daidaita idle:`,
            parts: [
                `Spark plugs`,
                `Ignition coil packs or plug wires`,
                `Air filter`,
                `MAF/throttle body cleaner`,
                `Fuel injector cleaner`
            ],
            caution: `Idan fitilar check-engine na walƙiya, guji taka gas da ƙarfi domin kare catalytic converter.`,
            buyPrompt: `Ka sanar da ni idan kana so in nemo maka plugs, coils da tace iska a GoLadipo.`
        }
    }
};

let selectedLanguage = null;
let hasWelcomedUser = false;
let languageButtonsContainer = null;

// Initialize chatbox
function initChatbox() {
    // Toggle chatbox
    if (chatboxToggle) {
        chatboxToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChatbox();
        });
    }
    
    if (chatboxToggleFooter) {
        chatboxToggleFooter.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChatbox();
        });
    }
    
    if (chatboxToggleFloat) {
        chatboxToggleFloat.addEventListener('click', toggleChatbox);
    }
    
    // Close chatbox
    if (chatboxClose) {
        chatboxClose.addEventListener('click', toggleChatbox);
    }
    
    // Send message
    if (chatboxSend) {
        chatboxSend.addEventListener('click', handleChatboxSend);
    }
    
    // Send on Enter key
    if (chatboxInput) {
        chatboxInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleChatboxSend();
            }
        });
    }

    addLanguageSelectorBlock(true);
}

// Toggle chatbox visibility
function toggleChatbox() {
    if (aiChatbox) {
        aiChatbox.classList.toggle('active');
        if (aiChatbox.classList.contains('active') && chatboxInput) {
            chatboxInput.focus();
        }
    }
}

// Handle sending a message
async function handleChatboxSend() {
    if (!chatboxInput) return;
    
    const message = chatboxInput.value.trim();
    if (!message) return;

    if (!selectedLanguage) {
        addMessageToChat(getTranslation('selectLanguageFirst', {}, 'english'));
        chatboxInput.value = '';
        if (languageButtonsContainer) {
            languageButtonsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        return;
    }
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    chatboxInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process message with AI
    setTimeout(() => {
        hideTypingIndicator();
        processAIMessage(message);
    }, 500);
}

// Add message to chat
function addMessageToChat(text, sender = 'bot') {
    if (!chatboxMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Check if text contains HTML or should be plain text
    if (text.includes('<') && text.includes('>')) {
        content.innerHTML = text;
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        content.appendChild(p);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatboxMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
}

function addLanguageSelectorBlock(clearExisting = false) {
    if (!chatboxMessages) return;
    
    if (clearExisting) {
        chatboxMessages.innerHTML = '';
    }
    
    selectedLanguage = null;
    hasWelcomedUser = false;
    
    const buttonsHtml = languageOptions.map(option => (
        `<button type="button" class="language-button" data-language="${option.code}">${option.label}</button>`
    )).join('');
    
    const selectorMessage = `<p>Choose your preferred language to chat:</p><div class="language-buttons">${buttonsHtml}</div>`;
    addMessageToChat(selectorMessage, 'bot');
    
    const containers = chatboxMessages.querySelectorAll('.language-buttons');
    languageButtonsContainer = containers[containers.length - 1] || null;
    
    if (languageButtonsContainer) {
        languageButtonsContainer.querySelectorAll('.language-button').forEach(button => {
            button.addEventListener('click', () => handleLanguageSelection(button.dataset.language));
        });
    }
}

function handleLanguageSelection(languageCode) {
    const optionExists = languageOptions.some(option => option.code === languageCode);
    if (!optionExists) return;
    
    const previousLanguage = selectedLanguage;
    selectedLanguage = languageCode;
    
    if (languageButtonsContainer) {
        languageButtonsContainer.querySelectorAll('.language-button').forEach(button => {
            const isActive = button.dataset.language === languageCode;
            button.classList.toggle('selected', isActive);
            button.disabled = isActive;
        });
    }
    
    if (previousLanguage === languageCode && hasWelcomedUser) {
        return;
    }
    
    sendBotResponse('languageSelected', { language: getLanguageNativeName(languageCode) });
    sendBotResponse('welcomeMessage');
    hasWelcomedUser = true;
}

function getLanguageNativeName(languageCode) {
    const match = languageOptions.find(option => option.code === languageCode);
    return match ? match.label : languageCode;
}

function sendBotResponse(key, params = {}) {
    const message = getTranslation(key, params);
    if (message) {
        addMessageToChat(message, 'bot');
    }
}

function getTranslation(key, params = {}, overrideLanguage) {
    const languageKey = overrideLanguage || selectedLanguage || 'english';
    const languagePack = translations[languageKey] || translations.english;
    let template = languagePack[key];
    
    if (!template && languageKey !== 'english') {
        template = translations.english[key];
    }
    
    if (!template) {
        return '';
    }
    
    return template.replace(/\{(\w+)\}/g, (_, token) => (
        params[token] !== undefined ? params[token] : ''
    ));
}

function formatCurrencyValue(value) {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
        return value;
    }
    
    return `₦${numberValue.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function handleMechanicalAdvice(message) {
    if (!message) return false;
    
    const topic = mechanicalTopics.find(item =>
        item.keywords.some(keyword => message.includes(keyword))
    );
    
    if (!topic) {
        return false;
    }
    
    const advice = buildMechanicalAdviceMessage(topic.id);
    if (!advice) {
        return false;
    }
    
    addMessageToChat(advice, 'bot');
    return true;
}

function buildMechanicalAdviceMessage(topicId) {
    const languageKey = selectedLanguage || 'english';
    const topicContent = mechanicalAdviceContent[topicId];
    
    if (!topicContent) {
        return '';
    }
    
    const content = topicContent[languageKey] || topicContent.english;
    if (!content) {
        return '';
    }
    
    let html = `<p>${content.summary}</p>`;
    
    if (content.steps?.length) {
        html += `<p>${content.stepsIntro}</p><ol>`;
        content.steps.forEach(step => {
            html += `<li>${step}</li>`;
        });
        html += '</ol>';
    }
    
    if (content.parts?.length) {
        html += `<p>${content.partsIntro}</p><ul>`;
        content.parts.forEach(part => {
            html += `<li>${part}</li>`;
        });
        html += '</ul>';
    }
    
    if (content.caution) {
        html += `<p>${content.caution}</p>`;
    }
    
    if (content.buyPrompt) {
        html += `<p>${content.buyPrompt}</p>`;
    }
    
    return html;
}

// Show typing indicator
function showTypingIndicator() {
    if (!chatboxMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content typing-indicator';
    content.innerHTML = '<span></span><span></span><span></span>';
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);
    chatboxMessages.appendChild(typingDiv);
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Process AI message - Main AI logic
function processAIMessage(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    // Navigation queries
    if (matchesPattern(message, ['home', 'main page', 'landing page'])) {
        navigateToPage('home');
        sendBotResponse('navigatedHome');
        return;
    }
    
    if (matchesPattern(message, ['search', 'find parts', 'browse', 'products', 'parts'])) {
        navigateToPage('search');
        sendBotResponse('navigatedSearch');
        return;
    }
    
    if (matchesPattern(message, ['sign in', 'login', 'signin'])) {
        navigateToPage('signin');
        sendBotResponse('navigatedSignin');
        return;
    }
    
    if (matchesPattern(message, ['sign up', 'register', 'create account', 'signup'])) {
        navigateToPage('signup');
        sendBotResponse('navigatedSignup');
        return;
    }
    
    if (matchesPattern(message, ['dashboard', 'my account', 'profile'])) {
        if (currentUser) {
            navigateToPage('dashboard');
            sendBotResponse('navigatedDashboard');
        } else {
            sendBotResponse('dashboardRequiresAuth');
        }
        return;
    }
    
    // Search queries
    if (matchesPattern(message, ['show me', 'find me', 'search for', 'looking for', 'need', 'want', 'i need', 'i want'])) {
        const searchQuery = extractSearchQuery(userMessage);
        if (searchQuery) {
            performSearch(searchQuery);
            sendBotResponse('searchPerformed', { query: searchQuery });
        } else {
            sendBotResponse('searchPrompt');
        }
        return;
    }
    
    // Category filters
    const categoryMatch = findCategoryInMessage(message);
    if (categoryMatch) {
        applyCategoryFilter(categoryMatch);
        sendBotResponse('categoryFilterApplied', { category: categoryMatch });
        return;
    }
    
    // Price filters
    const priceMatch = extractPriceRange(message);
    if (priceMatch) {
        applyPriceFilter(priceMatch.min, priceMatch.max);
        const minText = priceMatch.min ? formatCurrencyValue(priceMatch.min) : getTranslation('priceAny');
        const maxText = priceMatch.max ? formatCurrencyValue(priceMatch.max) : getTranslation('priceAny');
        sendBotResponse('priceFilterApplied', { min: minText, max: maxText });
        return;
    }
    
    // Location filters
    const locationMatch = extractLocation(message);
    if (locationMatch) {
        applyLocationFilter(locationMatch);
        sendBotResponse('locationFilterApplied', { location: locationMatch });
        return;
    }
    
    // Verified sellers filter
    if (matchesPattern(message, ['verified', 'verified sellers', 'verified only', 'only verified'])) {
        applyVerifiedFilter(true);
        sendBotResponse('verifiedFilterApplied');
        return;
    }
    
    // Sort queries
    if (matchesPattern(message, ['cheapest', 'lowest price', 'price low', 'low to high'])) {
        applySortFilter('price_low');
        sendBotResponse('sortPriceLow');
        return;
    }
    
    if (matchesPattern(message, ['expensive', 'highest price', 'price high', 'high to low'])) {
        applySortFilter('price_high');
        sendBotResponse('sortPriceHigh');
        return;
    }
    
    if (matchesPattern(message, ['newest', 'latest', 'recent'])) {
        applySortFilter('newest');
        sendBotResponse('sortNewest');
        return;
    }
    
    // Clear filters
    if (matchesPattern(message, ['clear', 'reset', 'remove filters', 'clear filters'])) {
        clearFilters();
        sendBotResponse('filtersCleared');
        return;
    }

    if (handleMechanicalAdvice(message)) {
        return;
    }
    
    // Help/FAQ queries
    if (matchesPattern(message, ['help', 'what can you do', 'how can you help', 'what do you do'])) {
        sendBotResponse('helpOverview');
        return;
    }
    
    if (matchesPattern(message, ['what is goladipo', 'about', 'tell me about'])) {
        sendBotResponse('aboutGoLadipo');
        return;
    }
    
    if (matchesPattern(message, ['categories', 'what categories', 'types of parts'])) {
        sendBotResponse('listCategories');
        return;
    }
    
    if (matchesPattern(message, ['how to buy', 'how to purchase', 'buying process'])) {
        sendBotResponse('howToBuy');
        return;
    }
    
    if (matchesPattern(message, ['how to sell', 'become a seller', 'sell parts'])) {
        sendBotResponse('howToSell');
        return;
    }
    
    // Default response for unrecognized queries
    sendBotResponse('fallback');
}

// Helper functions for pattern matching
function matchesPattern(text, patterns) {
    return patterns.some(pattern => text.includes(pattern));
}

function extractSearchQuery(message) {
    const patterns = [
        /(?:show me|find me|search for|looking for|need|want|i need|i want)\s+(.+)/i,
        /search\s+(.+)/i,
        /find\s+(.+)/i
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // If message doesn't match patterns but seems like a search query
    if (message.length > 3 && !matchesPattern(message, ['filter', 'sort', 'show', 'navigate', 'go to'])) {
        return message;
    }
    
    return null;
}

function findCategoryInMessage(message) {
    for (const category of categories) {
        if (message.includes(category.toLowerCase())) {
            return category;
        }
    }
    
    // Check for common variations
    const categoryMap = {
        'engine': 'Engine Parts',
        'brake': 'Brake System',
        'suspension': 'Suspension',
        'electrical': 'Electrical',
        'transmission': 'Transmission',
        'exhaust': 'Exhaust',
        'body': 'Body Parts',
        'accessories': 'Accessories',
        'tires': 'Tires & Wheels',
        'wheels': 'Tires & Wheels',
        'tire': 'Tires & Wheels'
    };
    
    for (const [key, value] of Object.entries(categoryMap)) {
        if (message.includes(key)) {
            return value;
        }
    }
    
    return null;
}

function extractPriceRange(message) {
    const pricePatterns = [
        /(?:under|below|less than|maximum|max)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
        /(?:over|above|more than|minimum|min)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
        /₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:to|-|and)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
        /between\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:and|to)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i
    ];
    
    let min = null;
    let max = null;
    
    // Check for "under" or "below"
    const underMatch = message.match(/(?:under|below|less than|maximum|max)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
    if (underMatch) {
        max = parseFloat(underMatch[1].replace(/,/g, ''));
    }
    
    // Check for "over" or "above"
    const overMatch = message.match(/(?:over|above|more than|minimum|min)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
    if (overMatch) {
        min = parseFloat(overMatch[1].replace(/,/g, ''));
    }
    
    // Check for range
    const rangeMatch = message.match(/₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:to|-|and)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
                       message.match(/between\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:and|to)\s*₦?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
    if (rangeMatch) {
        min = parseFloat(rangeMatch[1].replace(/,/g, ''));
        max = parseFloat(rangeMatch[2].replace(/,/g, ''));
    }
    
    if (min || max) {
        return { min, max };
    }
    
    return null;
}

function extractLocation(message) {
    const locationPatterns = [
        /(?:in|from|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
        /(?:location|area)\s+(.+)/i
    ];
    
    for (const pattern of locationPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // Common Lagos locations
    const locations = ['ladipo', 'mushin', 'ikeja', 'surulere', 'yaba', 'lagos island', 'lagos mainland'];
    for (const loc of locations) {
        if (message.includes(loc)) {
            return loc.charAt(0).toUpperCase() + loc.slice(1);
        }
    }
    
    return null;
}

// Action functions - Navigate to a page (for AI chatbox)
function navigateToPage(page) {
    // Close mobile menu if open
    if (navMenu) navMenu.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    
    // Update active nav link
    if (navLinks) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
    }
    
    // Show the selected page
    if (pages) {
        pages.forEach(p => {
            p.classList.remove('active');
            if (p.id === page) {
                p.classList.add('active');
            }
        });
    }
    
    // Special handling for dashboard
    if (page === 'dashboard' && !currentUser) {
        showPage('signin');
        showToast('Please sign in to access your dashboard', 'error');
        return;
    }
    
    // Load data for specific pages
    if (page === 'search' && searchResults && noResults) {
        // Clear previous search results
        searchResults.innerHTML = '';
        noResults.style.display = 'none';
    }
}

function performSearch(query) {
    if (searchInput) {
        searchInput.value = query;
        navigateToPage('search');
        setTimeout(() => {
            handleSearch();
        }, 500);
    }
}

function applyCategoryFilter(category) {
    navigateToPage('search');
    setTimeout(() => {
        if (filterCategory) {
            filterCategory.value = category;
            // Show filters if hidden
            if (advancedFilters && advancedFilters.style.display === 'none') {
                advancedFilters.style.display = 'block';
            }
            handleSearch();
        }
    }, 500);
}

function applyPriceFilter(min, max) {
    navigateToPage('search');
    setTimeout(() => {
        if (filterMinPrice && min) {
            filterMinPrice.value = min;
        }
        if (filterMaxPrice && max) {
            filterMaxPrice.value = max;
        }
        // Show filters if hidden
        if (advancedFilters && advancedFilters.style.display === 'none') {
            advancedFilters.style.display = 'block';
        }
        handleSearch();
    }, 500);
}

function applyLocationFilter(location) {
    navigateToPage('search');
    setTimeout(() => {
        if (filterLocation) {
            filterLocation.value = location;
            // Show filters if hidden
            if (advancedFilters && advancedFilters.style.display === 'none') {
                advancedFilters.style.display = 'block';
            }
            handleSearch();
        }
    }, 500);
}

function applyVerifiedFilter(verified) {
    navigateToPage('search');
    setTimeout(() => {
        if (filterVerified) {
            filterVerified.value = verified ? 'true' : '';
            // Show filters if hidden
            if (advancedFilters && advancedFilters.style.display === 'none') {
                advancedFilters.style.display = 'block';
            }
            handleSearch();
        }
    }, 500);
}

function applySortFilter(sortBy) {
    navigateToPage('search');
    setTimeout(() => {
        if (filterSort) {
            filterSort.value = sortBy;
            handleSearch();
        }
    }, 500);
}

// Chatbox initialization is called from initApp()