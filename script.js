// Supabase configuration
const SUPABASE_URL = 'https://xowxltikqnhhvftzoasa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvd3hsdGlrcW5oaHZmdHpvYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTU3NTksImV4cCI6MjA3NzI5MTc1OX0.8pE_CVCua7b3i3mkM9UM6WXBmlrB907YV0_Qiul-jU8';

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
const verificationStatus = document.getElementById('verificationStatus');
const verificationForm = document.getElementById('verificationForm');
const verifyForm = document.getElementById('verifyForm');
const idDocument = document.getElementById('idDocument');
const businessDocument = document.getElementById('businessDocument');

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
        loadConversations();
        loadVerificationStatus();
        setupMessageSubscription();
    }
    
    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation
    hamburger.addEventListener('click', toggleMobileMenu);
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
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
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleUpdateProfile);
    }
    
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });
    
    // Image preview
    if (productImage) {
        productImage.addEventListener('change', handleImagePreview);
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
    
    // Messaging
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (messageText) {
        messageText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Verification
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerificationSubmit);
    }
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
                        ${currentUser && currentUser.id !== product.seller_id ? `
                            <button class="contact-btn" onclick="startConversation('${product.seller_id}', '${sellerName}')">
                                <i class="fas fa-comment"></i>
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <span>${product.is_active ? 'Active' : 'Inactive'}</span>
                    <button class="btn btn-danger btn-sm" data-id="${product.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                `}
            </div>
        </div>
    `;
    
    // Add delete functionality for user's own products
    if (!isSearchResult) {
        const deleteBtn = card.querySelector('.btn-danger');
        deleteBtn.addEventListener('click', () => deleteProduct(product.id));
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

// ===== VERIFICATION SYSTEM =====

// Load verification status
async function loadVerificationStatus() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('verifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        displayVerificationStatus(data);
    } catch (error) {
        console.error('Load verification error:', error.message);
    }
}

// Display verification status
function displayVerificationStatus(verification) {
    if (!verification) {
        verificationStatus.innerHTML = `
            <div class="status-card unverified">
                <div class="status-icon"><i class="fas fa-user"></i></div>
                <div class="status-info">
                    <h4>Not Verified</h4>
                    <p>Complete the form below to get verified and build buyer trust</p>
                </div>
            </div>
        `;
        verificationForm.style.display = 'block';
        return;
    }
    
    let statusClass, icon, title, description;
    
    switch (verification.status) {
        case 'verified':
            statusClass = 'verified';
            icon = 'fa-check-circle';
            title = 'Verified Seller';
            description = 'Your account has been verified! You now have a verified badge.';
            verificationForm.style.display = 'none';
            break;
        case 'pending':
            statusClass = 'pending';
            icon = 'fa-clock';
            title = 'Verification Pending';
            description = 'Your verification is under review. We\'ll notify you soon!';
            verificationForm.style.display = 'none';
            break;
        case 'rejected':
            statusClass = 'rejected';
            icon = 'fa-times-circle';
            title = 'Verification Rejected';
            description = `Reason: ${verification.rejection_reason || 'Please review and resubmit.'}`;
            verificationForm.style.display = 'block';
            break;
        default:
            statusClass = 'unverified';
            icon = 'fa-user';
            title = 'Not Verified';
            description = 'Complete the form to get verified';
            verificationForm.style.display = 'block';
    }
    
    verificationStatus.innerHTML = `
        <div class="status-card ${statusClass}">
            <div class="status-icon ${statusClass}"><i class="fas ${icon}"></i></div>
            <div class="status-info">
                <h4>${title}</h4>
                <p>${description}</p>
            </div>
        </div>
    `;
    
    // Update profile is_verified status
    if (verification.status === 'verified') {
        supabaseClient
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', currentUser.id);
    }
}

// Handle verification form submission
async function handleVerificationSubmit(e) {
    e.preventDefault();
    showLoading(true);
    
    const businessName = document.getElementById('businessName').value;
    const businessAddress = document.getElementById('businessAddress').value;
    const businessPhone = document.getElementById('businessPhone').value;
    const idDocFile = idDocument.files[0];
    const businessDocFile = businessDocument.files[0];
    
    try {
        let idDocUrl = null;
        let businessDocUrl = null;
        
        // Upload ID document
        if (idDocFile) {
            const fileExt = idDocFile.name.split('.').pop();
            const fileName = `id_${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `verifications/${currentUser.id}/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('verification-documents')
                .upload(filePath, idDocFile);
            
            if (uploadError) throw uploadError;
            
            const { data: urlData } = supabaseClient.storage
                .from('verification-documents')
                .getPublicUrl(filePath);
            
            idDocUrl = urlData.publicUrl;
        }
        
        // Upload business document if provided
        if (businessDocFile) {
            const fileExt = businessDocFile.name.split('.').pop();
            const fileName = `business_${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `verifications/${currentUser.id}/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('verification-documents')
                .upload(filePath, businessDocFile);
            
            if (uploadError) throw uploadError;
            
            const { data: urlData } = supabaseClient.storage
                .from('verification-documents')
                .getPublicUrl(filePath);
            
            businessDocUrl = urlData.publicUrl;
        }
        
        // Submit verification request
        const { error } = await supabaseClient
            .from('verifications')
            .upsert([{
                user_id: currentUser.id,
                business_name: businessName,
                business_address: businessAddress,
                business_phone: businessPhone,
                id_document_url: idDocUrl,
                business_document_url: businessDocUrl,
                status: 'pending',
                submitted_at: new Date()
            }]);
        
        if (error) throw error;
        
        showToast('Verification submitted successfully! We\'ll review it soon.', 'success');
        verifyForm.reset();
        loadVerificationStatus();
    } catch (error) {
        console.error('Verification submit error:', error.message);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
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