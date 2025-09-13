let currentUser = null;
let currentChat = null;
let socket;

// Application Data
const APP_DATA = {
    predefined_categories: ["Technology", "Art", "Education", "Gaming", "Music", "Finance", "Health", "Science", "Business", "Entertainment"],
    service_types: ["Tutoring", "Graphic Design", "Programming", "Writing", "Translation", "Consulting", "Photography", "Video Editing", "Web Design", "Data Analysis"],
    user_ranks: ["Member", "Moderator", "Co-Admin", "Admin"],
    file_types: ["Document", "Image", "Video", "Audio", "Course", "Software", "Other"],
    initial_agnos_balance: 100,
    transaction_purposes: ["Service Payment", "File Purchase", "Course Purchase", "Tip", "Donation"]
};

// Page Management
window.showPage = function (pageId) {
    console.log('Switching to page:', pageId);
    try {
        if (pageId === 'dashboard-page') {
            currentCommunityId = null; // Reset community ID
        }
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log('Successfully switched to:', pageId);
        } else {
            console.error('Page not found:', pageId);
        }
    } catch (error) {
        console.error('Error switching pages:', error);
    }
};

// Modal Management
window.showModal = function (modalId) {
    console.log('Showing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        // Only set community ID if we're IN a community
        if (currentCommunityId && modalId === 'upload-file-modal') {
            document.getElementById('file-community-id').value = currentCommunityId;
        } else {
            document.getElementById('file-community-id').value = ''; // Clear if not in community
        }
        modal.classList.add('active');
        populateCategoryDropdowns();
    }


    if (currentCommunityId) {
        if (modalId === 'upload-file-modal') {
            document.getElementById('file-community-id').value = currentCommunityId;
        } else if (modalId === 'create-service-modal') {
            document.getElementById('service-community-id').value = currentCommunityId;
        }
    }

};

window.hideModal = function (modalId) {
    console.log('Hiding modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        document.getElementById('file-community-id').value = ''; // Always clear on close
        modal.classList.remove('active');

        if (modalId === 'upload-file-modal') {
            document.getElementById('file-community-id').value = '';
        } else if (modalId === 'create-service-modal') {
            document.getElementById('service-community-id').value = '';
        }



    }
};

// Logout function
// window.logout = function () {
//     currentUser = null;
//     sessionStorage.removeItem('currentUser');
//     if (socket) socket.close();
//     showPage('landing-page');
// };


// Replace the existing logout function in app.js
window.logout = function () {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close(1000, 'User logged out');
    }
    socket = null;
    currentUser = null;
    currentChat = null;
    sessionStorage.removeItem('currentUser');
    showPage('landing-page');
    console.log('User logged out, WebSocket closed');
};

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing application...');
    initializeMatrix();
    setupEventListeners();
    checkUserSession();
    populateCategoryDropdowns();
    initResponsiveNavigation();
    initResponsiveChat();



    // Add resize listener to auto-close menu on larger screens
    // window.addEventListener('resize', function () {
    //     if (window.innerWidth >= 768) {
    //         document.querySelector('.hamburger').classList.remove('active');
    //         document.querySelector('.sidebar').classList.remove('active');
    //         document.querySelector('.mobile-overlay').classList.remove('active');
    //         document.body.classList.remove('no-scroll');
    //     }
    // });

    console.log('Application initialized successfully');
});




// Enhanced Mobile Menu

// Initialize Responsive Navigation
function initResponsiveNavigation() {
    // Create mobile menu elements
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    document.querySelector('.top-nav').prepend(hamburger);

    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    // Toggle sidebar function
    function toggleSidebar() {
        document.querySelector('.sidebar').classList.toggle('active');
        document.querySelector('.hamburger').classList.toggle('active');
        document.querySelector('.mobile-overlay').classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    }

    // Event listeners
    hamburger.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Auto-close sidebar when clicking items on mobile
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function () {
            if (window.innerWidth < 992) {
                toggleSidebar();
            }
        });
    });

    // Handle window resize
    function handleResize() {
        if (window.innerWidth >= 992) {
            document.querySelector('.sidebar').classList.remove('active');
            document.querySelector('.hamburger').classList.remove('active');
            document.querySelector('.mobile-overlay').classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }

    window.addEventListener('resize', handleResize);
}


// Initialize chat responsiveness
function initResponsiveChat() {
    const chatContainer = document.querySelector('.chat-container');

    function handleChatResize() {
        if (window.innerWidth <= 768) {
            // Mobile behavior
            chatContainer.classList.add('mobile-view');
        } else {
            // Desktop behavior
            chatContainer.classList.remove('mobile-view');
        }
    }

    // Initial check
    handleChatResize();

    // Listen for resize events
    window.addEventListener('resize', handleChatResize);
}

// function setupEnhancedMobileMenu() {
//     // Create hamburger
//     const hamburger = document.createElement('div');
//     hamburger.className = 'hamburger';
//     hamburger.innerHTML = '<span></span><span></span><span></span>';
//     document.querySelector('.top-nav').prepend(hamburger);

//     // Create mobile overlay
//     const overlay = document.createElement('div');
//     overlay.className = 'mobile-overlay';
//     document.body.appendChild(overlay);

//     // Toggle functions
//     function toggleMenu() {
//         hamburger.classList.toggle('active');
//         document.querySelector('.sidebar').classList.toggle('active');
//         overlay.classList.toggle('active');
//         document.body.classList.toggle('no-scroll');
//     }

//     // Event listeners
//     hamburger.addEventListener('click', toggleMenu);
//     overlay.addEventListener('click', toggleMenu);

//     // Close menu when clicking sidebar items
//     document.querySelectorAll('.sidebar-item').forEach(item => {
//         item.addEventListener('click', () => {
//             if (window.innerWidth < 768) {
//                 toggleMenu();
//             }
//         });
//     });
// }

// Matrix Background Animation
function initializeMatrix() {
    try {
        const canvas = document.getElementById('matrix-bg');
        if (!canvas) {
            console.log('Matrix canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resizeCanvas();

        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        const matrixArray = matrix.split("");

        const fontSize = 10;
        let columns = Math.floor(canvas.width / fontSize);
        let drops = [];

        function resetDrops() {
            columns = Math.floor(canvas.width / fontSize);
            drops = [];
            for (let x = 0; x < columns; x++) {
                drops[x] = Math.floor(Math.random() * canvas.height / fontSize);
            }
        }

        resetDrops();

        function drawMatrix() {
            ctx.fillStyle = 'rgba(10, 15, 13, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00FF41';
            ctx.font = fontSize + 'px Consolas, Monaco, monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        setInterval(drawMatrix, 35);

        window.addEventListener('resize', function () {
            resizeCanvas();
            resetDrops();
        });

        console.log('Matrix animation initialized');

    } catch (error) {
        console.error('Matrix animation error:', error);
    }
}

// Populate category dropdowns
function populateCategoryDropdowns() {
    const dropdowns = [
        { id: 'community-category', options: APP_DATA.predefined_categories },
        { id: 'community-filter', options: ['All Categories', ...APP_DATA.predefined_categories] },
        { id: 'file-category', options: APP_DATA.file_types },
        { id: 'file-filter', options: ['All Categories', ...APP_DATA.file_types] },
        { id: 'service-category', options: APP_DATA.service_types },
        { id: 'service-filter', options: ['All Categories', ...APP_DATA.service_types] },
        { id: 'agnos-purpose', options: APP_DATA.transaction_purposes }
    ];

    dropdowns.forEach(dropdown => {
        const element = document.getElementById(dropdown.id);
        if (element) {
            element.innerHTML = dropdown.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');

    document.querySelectorAll('.request-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.request-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.request-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    try {
        // Registration form
        const regForm = document.getElementById('register-form');
        if (regForm) {
            regForm.addEventListener('submit', handleRegistration);
            console.log('Registration form listener added');
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('Login form listener added');
        }

        // Username availability check
        const regUsername = document.getElementById('reg-username');
        if (regUsername) {
            regUsername.addEventListener('input', checkUsernameAvailability);
        }

        // Password strength check
        const regPassword = document.getElementById('reg-password');
        if (regPassword) {
            regPassword.addEventListener('input', checkPasswordStrength);
        }

        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', function () {
                switchSection(this.dataset.section);
            });
        });

        // Tab switching
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('tab-btn')) {
                switchTab(e.target.dataset.tab);
            }
            if (e.target.classList.contains('chat-tab-btn')) {
                switchChatTab(e.target.dataset.chatTab);
            }
        });

        // Modal forms
        const forms = [
            { id: 'create-community-form', handler: handleCreateCommunity },
            { id: 'upload-file-form', handler: handleFileUpload },
            { id: 'create-service-form', handler: handleCreateService },
            { id: 'new-chat-form', handler: handleNewChat },
            { id: 'send-agnos-form', handler: handleSendAgnos }
        ];

        forms.forEach(form => {
            const element = document.getElementById(form.id);
            if (element) {
                element.addEventListener('submit', form.handler);
            }
        });

        // Filter changes
        const filters = [
            { id: 'community-filter', handler: filterCommunities },
            { id: 'file-filter', handler: filterFiles },
            { id: 'service-filter', handler: filterServices }
        ];

        filters.forEach(filter => {
            const element = document.getElementById(filter.id);
            if (element) {
                element.addEventListener('change', filter.handler);
            }
        });

        // Chat input enter key
        document.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && e.target.id === 'chat-input') {
                sendMessage();
            }
        });

        // Close modal when clicking close button
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    const forms = modal.querySelectorAll('form');
                    forms.forEach(form => form.reset());
                }
            }
        });

        // Community page navigation
        const communityBackBtn = document.getElementById('community-back-btn');
        if (communityBackBtn) {
            communityBackBtn.addEventListener('click', () => showPage('dashboard-page'));
        }

        console.log('Event listeners set up successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}




// User Authentication
async function handleRegistration(e) {
    e.preventDefault();
    console.log('Registration form submitted');

    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;

    console.log('Registration data:', { fullName, username, passwordLength: password.length });

    if (!fullName || !username || !password) {
        alert('All fields are required');
        return;
    }

    if (!isValidPassword(password)) {
        alert('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, username, password })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        console.log('User created successfully:', data.user.username);
        alert('Registration successful! You can now login.');
        showPage('login-page');

        document.getElementById('register-form').reset();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    console.log('Login attempt for username:', username);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        currentUser = data.user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

        console.log('Login successful for user:', currentUser.username);

        showPage('dashboard-page');
        setTimeout(loadDashboard, 100);
        document.getElementById('login-form').reset();
        connectWebSocket();
    } catch (error) {
        console.error('Login error:', error);
        showLoginError(error.message);
    }
}


// Replace the existing connectWebSocket function in app.js
function connectWebSocket() {
    if (!currentUser) {
        console.log('No current user, cannot establish WebSocket connection');
        return;
    }

    // Close existing connection if any
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
    }

    // WebSocket connection with reconnection logic
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const initialReconnectDelay = 1000; // 1 second
    const maxReconnectDelay = 30000; // 30 seconds

    function attemptWebSocketConnection() {
        // const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        // socket = new WebSocket(`${wsProtocol}${window.location.host}?userId=${currentUser.id}`);

        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const host = window.location.hostname === 'localhost' ? '192.168.29.198:3000' : window.location.host;
        socket = new WebSocket(`${wsProtocol}${host}?userId=${currentUser.id}`);

        socket.onopen = () => {
            console.log(`WebSocket connected for user: ${currentUser.id}`);
            reconnectAttempts = 0; // Reset attempts on successful connection
            // Re-load chat list to sync with server
            loadChatList();
        };

        socket.onmessage = (event) => {
            try {
                const { type, data } = JSON.parse(event.data);

                if (type === 'newMessage') {
                    if (currentChat &&
                        ((data.recipient_id === currentUser.id && data.sender_id.toString() === currentChat.id.split(':')[1]) ||
                            (data.sender_id === currentUser.id && data.recipient_id.toString() === currentChat.id.split(':')[1]))) {
                        openChat(currentChat.id, currentChat.name);
                    }
                    loadChatList();
                } else if (type === 'newCommunityMessage') {
                    if (currentChat && currentChat.id === `community:${data.community_id}`) {
                        openChat(currentChat.id, currentChat.name);
                    }
                    loadChatList();
                } else if (type === 'communityRequestUpdate') {
                    loadJoinRequests();
                    loadAllCommunities();
                    loadUserCommunities();
                    alert(`Community join request ${data.status.toLowerCase()}`);
                }
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };

        socket.onclose = (event) => {
            console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
            if (!currentUser) {
                console.log('User logged out, not attempting reconnect');
                return;
            }

            if (reconnectAttempts < maxReconnectAttempts) {
                const delay = Math.min(initialReconnectDelay * Math.pow(2, reconnectAttempts), maxReconnectDelay);
                console.log(`Attempting WebSocket reconnect in ${delay}ms (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
                reconnectAttempts++;
                setTimeout(attemptWebSocketConnection, delay);
            } else {
                console.error('Max reconnect attempts reached. Please try logging in again.');
                alert('Lost connection to server. Please refresh or log in again.');
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    // Initial connection attempt
    attemptWebSocketConnection();
}


// function connectWebSocket() {
//     if (!currentUser) return;

//     // Close existing connection if any
//     if (socket) socket.close();

//     // Connect to WebSocket server
//     const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
//     socket = new WebSocket(`${wsProtocol}${window.location.host}?userId=${currentUser.id}`);

//     socket.onopen = () => {
//         console.log('WebSocket connected');
//     };

//     socket.onmessage = (event) => {
//         const { type, data } = JSON.parse(event.data);

//         if (type === 'newMessage') {
//             // Update current chat if it's the active conversation
//             if (currentChat &&
//                 ((data.recipient_id === currentUser.id && data.sender_id.toString() === currentChat.id.split(':')[1]) ||
//                     (data.sender_id === currentUser.id && data.recipient_id.toString() === currentChat.id.split(':')[1]))) {
//                 openChat(currentChat.id, currentChat.name);
//             }
//             loadChatList();
//         }
//         else if (type === 'newCommunityMessage') {
//             // Update community chat if it's the active conversation
//             if (currentChat && currentChat.id === `community:${data.community_id}`) {
//                 openChat(currentChat.id, currentChat.name);
//             }
//             loadChatList();
//         }
//     };

//     socket.onclose = () => {
//         console.log('WebSocket disconnected - attempting reconnect...');
//         setTimeout(connectWebSocket, 5000);
//     };

//     socket.onerror = (error) => {
//         console.error('WebSocket error:', error);
//     };
// }




function showLoginError(message) {
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.textContent = message;
        setTimeout(() => {
            errorElement.textContent = '';
        }, 5000);
    }
    console.log('Login error:', message);
}

async function checkUsernameAvailability() {
    const username = document.getElementById('reg-username').value.trim();
    const statusElement = document.getElementById('username-status');

    if (!statusElement) return;

    if (username.length < 3) {
        statusElement.textContent = 'Username must be at least 3 characters';
        statusElement.className = 'status-text error';
        return;
    }

    try {
        const response = await fetch(`/api/check-username/${username}`);
        const data = await response.json();

        if (data.available) {
            statusElement.textContent = 'Username available';
            statusElement.className = 'status-text success';
        } else {
            statusElement.textContent = 'Username not available';
            statusElement.className = 'status-text error';
        }
    } catch (error) {
        console.error('Error checking username:', error);
        statusElement.textContent = 'Error checking username';
        statusElement.className = 'status-text error';
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('reg-password').value;
    const statusElement = document.getElementById('password-strength');

    if (!statusElement) return;

    if (isValidPassword(password)) {
        statusElement.textContent = 'Password is strong';
        statusElement.className = 'status-text success';
    } else {
        statusElement.textContent = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
        statusElement.className = 'status-text error';
    }
}

function isValidPassword(password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password);
}

// function checkUserSession() {
//     const savedUser = sessionStorage.getItem('currentUser');
//     if (savedUser) {
//         try {
//             currentUser = JSON.parse(savedUser);
//             console.log('Restored user session:', currentUser.username);
//             showPage('dashboard-page');
//             setTimeout(loadDashboard, 100);
//         } catch (e) {
//             console.error('Error parsing saved user:', e);
//             sessionStorage.removeItem('currentUser');
//         }
//     }
// }


// Replace the existing checkUserSession function in app.js
function checkUserSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Restored user session:', currentUser.username);
            showPage('dashboard-page');
            setTimeout(() => {
                loadDashboard();
                connectWebSocket(); // Explicitly call WebSocket connection
            }, 100);
        } catch (e) {
            console.error('Error parsing saved user:', e);
            sessionStorage.removeItem('currentUser');
            showPage('landing-page');
        }
    } else {
        showPage('landing-page');
    }
}

// Dashboard Management
async function loadDashboard() {
    if (!currentUser) {
        console.log('No current user, cannot load dashboard');
        return;
    }

    console.log('Loading dashboard for user:', currentUser.username);

    try {
        const navUsername = document.getElementById('nav-username');
        if (navUsername) {
            navUsername.textContent = currentUser.username;
        }

        await updateBalanceDisplay();
        await loadProfileStats();
        await loadUserCommunities();
        await loadAllCommunities();
        await loadUserFiles();
        await loadAllFiles();
        await loadUserServices();
        await loadAllServices();
        await loadChatList();
        await loadTransactionHistory();
        await loadJoinRequests();
        await loadAdminRequests();

        console.log('Dashboard loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function updateBalanceDisplay() {
    const user = await getCurrentUserData();
    const balance = user ? user.agnos_balance : 0;

    const elements = ['nav-balance', 'profile-balance', 'wallet-balance'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = balance.toFixed(2);
        }
    });
}

async function getCurrentUserData() {
    try {
        const response = await fetch(`/api/user/${currentUser.id}`);
        const user = await response.json();
        if (response.ok) {
            currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            return user;
        }
        throw new Error(user.error || 'Failed to fetch user data');
    } catch (error) {
        console.error('Error getting current user data:', error);
        return currentUser;
    }
}

async function loadProfileStats() {
    try {
        const response = await fetch(`/api/profile-stats/${currentUser.id}`);
        const stats = await response.json();
        if (!response.ok) {
            throw new Error(stats.error || 'Failed to load profile stats');
        }

        const profileCommunities = document.getElementById('profile-communities');
        const profileFiles = document.getElementById('profile-files');
        const profileServices = document.getElementById('profile-services');

        if (profileCommunities) profileCommunities.textContent = stats.communities;
        if (profileFiles) profileFiles.textContent = stats.files;
        if (profileServices) profileServices.textContent = stats.services;
    } catch (error) {
        console.error('Error loading profile stats:', error);
    }
}

// Community Management

// Replace the loadUserCommunities function in app.js
async function loadUserCommunities(filter = '') {
    const container = document.getElementById('user-communities');
    if (!container) return;

    try {
        const response = await fetch(`/api/communities/user/${currentUser.id}`);
        let communities = await response.json();
        if (!response.ok) {
            throw new Error(communities.error || 'Failed to load communities');
        }

        if (filter && filter !== 'All Categories') {
            communities = communities.filter(c => c.category === filter);
        }

        container.innerHTML = communities.length ? communities.map(community => `
            <div class="community-card">
                <div class="card-title">${community.name}</div>
                <div class="card-description">${community.description}</div>
                <div class="card-meta">
                    <span>Category: ${community.category}</span>
                    <span>${community.is_private ? 'Private' : 'Public'}</span>
                </div>
                <div class="card-meta">
                    <span>Role: ${community.role}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-primary" onclick="openCommunity(${community.id})">
                        Enter Community
                    </button>
                </div>
            </div>
        `).join('') : `
            <div class="community-card">
                <div class="card-title">No Communities Yet</div>
                <div class="card-description">Create or join communities to connect with others</div>
                <div class="card-actions">
                    <button class="btn-primary" onclick="showModal('create-community-modal')">Create Community</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading user communities:', error);
        container.innerHTML = '<p>Error loading communities</p>';
    }
}



// async function loadUserCommunities() {
//     const container = document.getElementById('user-communities');
//     if (!container) return;

//     try {
//         const response = await fetch(`/api/communities/user/${currentUser.id}`);
//         const communities = await response.json();
//         if (!response.ok) {
//             throw new Error(communities.error || 'Failed to load communities');
//         }

//         container.innerHTML = communities.length ? communities.map(community => `
//             <div class="community-card">
//                 <div class="card-title">${community.name}</div>
//                 <div class="card-description">${community.description}</div>
//                 <div class="card-meta">
//                     <span>Category: ${community.category}</span>
//                     <span>${community.is_private ? 'Private' : 'Public'}</span>
//                 </div>
//                 <div class="card-meta">
//                     <span>Role: ${community.role}</span>
//                 </div>
//                 <div class="card-actions">
//                     <button class="btn-primary" onclick="openCommunity(${community.id})">
//                         Enter Community
//                     </button>
//                 </div>
//             </div>
//         `).join('') : `
//             <div class="community-card">
//                 <div class="card-title">No Communities Yet</div>
//                 <div class="card-description">Create or join communities to connect with others</div>
//                 <div class="card-actions">
//                     <button class="btn-primary" onclick="showModal('create-community-modal')">Create Community</button>
//                 </div>
//             </div>
//         `;
//     } catch (error) {
//         console.error('Error loading user communities:', error);
//         container.innerHTML = '<p>Error loading communities</p>';
//     }
// }

// async function loadAllCommunities(filter = '') {
//     const container = document.getElementById('all-communities');
//     if (!container) return;

//     try {
//         const response = await fetch('/api/communities');
//         let communities = await response.json();
//         if (!response.ok) {
//             throw new Error(communities.error || 'Failed to load communities');
//         }

//         if (filter && filter !== 'All Categories') {
//             communities = communities.filter(c => c.category === filter);
//         }

//         container.innerHTML = communities.length ? communities.map(community => `
//             <div class="community-card">
//                 <div class="card-title">${community.name}</div>
//                 <div class="card-description">${community.description}</div>
//                 <div class="card-meta">
//                     <span>Category: ${community.category}</span>
//                     <span>${community.is_private ? 'Private' : 'Public'}</span>
//                 </div>
//                 <div class="card-meta">
//                     <span>Members: ${community.member_count}</span>
//                     <span>Created by: ${community.creator_username}</span>
//                 </div>
//                 <div class="card-actions">
//                     <button class="btn-primary" onclick="joinCommunity(${community.id})">${community.is_private ? 'Request to Join' : 'Join'}</button>
//                 </div>
//             </div>
//         `).join('') : '<p>No communities available</p>';
//     } catch (error) {
//         console.error('Error loading all communities:', error);
//         container.innerHTML = '<p>Error loading communities</p>';
//     }
// }


// Replace the loadAllCommunities function in app.js
async function loadAllCommunities(filter = '') {
    const container = document.getElementById('all-communities');
    if (!container) return;

    try {
        const response = await fetch('/api/communities');
        let communities = await response.json();
        if (!response.ok) {
            throw new Error(communities.error || 'Failed to load communities');
        }

        // Fetch user communities and join requests
        const userCommunitiesResponse = await fetch(`/api/communities/user/${currentUser.id}`);
        const userCommunities = await userCommunitiesResponse.json();
        const joinRequestsResponse = await fetch(`/api/community-requests/${currentUser.id}`);
        const joinRequests = await joinRequestsResponse.json();

        if (filter && filter !== 'All Categories') {
            communities = communities.filter(c => c.category === filter);
        }

        container.innerHTML = communities.length ? communities.map(community => {
            const isMember = userCommunities.some(c => c.id === community.id);
            const isAdmin = userCommunities.some(c => c.id === community.id && c.role === 'Admin');
            const joinRequest = joinRequests.find(r => r.community_id === community.id);
            let buttonText = 'Join';
            let buttonAction = `joinCommunity(${community.id})`;
            let buttonClass = 'btn-primary';

            if (isAdmin) {
                buttonText = 'Manage';
                buttonAction = `openCommunity(${community.id})`;
            }
            else if (isMember && !community.is_private) {
                buttonText = 'Joined';
                buttonClass = 'btn-success disabled';
                buttonAction = '';
            } else if (joinRequest) {
                if (joinRequest.status === 'Pending') {
                    buttonText = 'Requested';
                    buttonClass = 'btn-secondary disabled';
                    buttonAction = '';
                } else if (joinRequest.status === 'Approved') {

                    buttonText = 'Joined';
                    buttonClass = 'btn-success disabled';
                    buttonAction = '';
                } else if (joinRequest.status === 'Rejected') {
                    buttonText = 'Request Rejected';
                    buttonClass = 'btn-danger disabled';
                    buttonAction = '';
                }
            } else if (!community.is_private) {
                buttonText = 'Join';
                buttonAction = `joinCommunity(${community.id})`;

            } else {
                buttonText = 'Request to Join';
                buttonAction = `joinCommunity(${community.id})`;
            }

            return `
                <div class="community-card">
                    <div class="card-title">${community.name}</div>
                    <div class="card-description">${community.description}</div>
                    <div class="card-meta">
                        <span>Category: ${community.category}</span>
                        <span>${community.is_private ? 'Private' : 'Public'}</span>
                    </div>
                    <div class="card-meta">
                        <span>Members: ${community.member_count}</span>
                        <span>Created by: ${community.creator_username}</span>
                    </div>
                    <div class="card-actions">
                        <button class="${buttonClass}" ${buttonAction ? `onclick="${buttonAction}"` : 'disabled'}>${buttonText}</button>
                    </div>
                </div>
            `;
        }).join('') : '<p>No communities available</p>';
    } catch (error) {
        console.error('Error loading all communities:', error);
        container.innerHTML = '<p>Error loading communities</p>';
    }
}



// Replace the loadAllServices function in app.js
async function loadAllServices(filter = '') {
    const container = document.getElementById('all-services');
    if (!container) return;

    try {
        const response = await fetch('/api/services');
        let services = await response.json();
        if (!response.ok) {
            throw new Error(services.error || 'Failed to load services');
        }

        // Fetch user services and transactions
        const userServicesResponse = await fetch(`/api/services/user/${currentUser.id}`);
        const userServices = await userServicesResponse.json();
        const transactionsResponse = await fetch(`/api/transactions/${currentUser.id}`);
        const transactions = await transactionsResponse.json();

        if (filter && filter !== 'All Categories') {
            services = services.filter(s => s.category === filter);
        }

        container.innerHTML = services.length ? services.map(service => {
            const isProvider = userServices.some(s => s.id === service.id);
            const isPurchased = transactions.some(t => t.purpose === 'Service Payment' && t.recipient_id === service.user_id && t.sender_id === currentUser.id && t.service_id === service.id);
            let buttonText = isPurchased ? 'Access Service' : 'Buy';
            let buttonAction = isPurchased ? `accessService(${service.id}, '${service.provider_username}')` : `buyService(${service.id}, ${service.price}, '${service.provider_username}')`;
            let buttonClass = isPurchased ? 'btn-success' : 'btn-secondary';

            return `
                <div class="service-card">
                    <div class="card-title">${service.title}</div>
                    <div class="card-description">${service.description}</div>
                    <div class="card-meta">
                        <span>Category: ${service.category}</span>
                        <span>Provider: ${service.provider_username}</span>
                    </div>
                    <div class="card-meta">
                        <span class="price-tag">${service.price.toFixed(2)} AGNOS</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-primary" onclick="contactProvider('${service.provider_username}')">Contact</button>
                        ${isProvider ? '' : `<button class="${buttonClass}" onclick="${buttonAction}">${buttonText} ${isPurchased ? '' : `(${service.price.toFixed(2)} AGNOS)`}</button>`}
                    </div>
                </div>
            `;
        }).join('') : '<p>No services available</p>';
    } catch (error) {
        console.error('Error loading all services:', error);
        container.innerHTML = '<p>Error loading services</p>';
    }
}

// async function joinCommunity(communityId) {
//     try {
//         const response = await fetch(`/api/communities/${communityId}`);
//         const community = await response.json();
//         if (!response.ok) throw new Error(community.error || 'Failed to fetch community');

//         if (community.is_private) {
//             const requestResponse = await fetch('/api/community-requests', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ userId: currentUser.id, communityId })
//             });
//             const requestData = await requestResponse.json();
//             if (!requestResponse.ok) throw new Error(requestData.error || 'Failed to send request');

//             alert('Join request sent to community admins');
//             loadJoinRequests();
//         } else {
//             const joinResponse = await fetch('/api/communities/join', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ userId: currentUser.id, communityId })
//             });
//             const joinData = await joinResponse.json();
//             if (!joinResponse.ok) throw new Error(joinData.error || 'Failed to join community');

//             alert('Successfully joined community!');
//             loadUserCommunities();
//         }
//     } catch (error) {
//         console.error('Error joining community:', error);
//         alert(`Failed to join community: ${error.message}`);
//     }
// }



// Add new function in app.js after loadAllServices
async function accessService(serviceId, providerUsername) {
    try {
        // You can implement specific logic for accessing the service, e.g., redirecting to a service page or initiating a chat
        await contactProvider(providerUsername);
        alert('Accessing service. You can now coordinate with the provider.');
    } catch (error) {
        console.error('Error accessing service:', error);
        alert('Failed to access service: ' + error.message);
    }
}


// Replace the joinCommunity function in app.js
async function joinCommunity(communityId) {
    try {
        // Validate communityId
        if (!communityId || isNaN(parseInt(communityId))) {
            throw new Error('Invalid community ID');
        }

        const response = await fetch(`/api/communities/${communityId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! Status: ${response.status}`);
        }

        let community;
        try {
            community = await response.json();
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError, 'Response:', await response.text());
            throw new Error('Invalid response from server');
        }

        if (!community || !community.id) {
            throw new Error('Community data not found');
        }

        // const membershipCheck = await fetch(`/api/community-members/${communityId}/${currentUser.id}`);
        // if (!membershipCheck.ok) {
        //     throw new Error('Failed to check membership status');
        // }
        // const membership = await membershipCheck.json();
        // if (membership) {
        //     alert('You are already a member of this community');
        //     return;
        // }

        if (community.is_private) {
            const requestResponse = await fetch('/api/community-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, communityId })
            });
            const requestData = await requestResponse.json();
            if (!requestResponse.ok) {
                throw new Error(requestData.error || 'Failed to send join request');
            }

            alert('Join request sent to community admins');
            await loadJoinRequests();
            await loadAllCommunities();
        } else {
            const joinResponse = await fetch('/api/communities/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, communityId })
            });
            const joinData = await joinResponse.json();
            if (!joinResponse.ok) {
                throw new Error(joinData.error || 'Failed to join community');
            }

            alert('Successfully joined community!');
            await loadUserCommunities();
            await loadAllCommunities();

        }
    } catch (error) {
        console.error('Error joining community:', error);
        alert(`Failed to join community: ${error.message}`);
    }
}


// File Management
async function loadUserFiles() {
    const container = document.getElementById('user-files');
    if (!container) return;

    try {
        const response = await fetch(`/api/files/user/${currentUser.id}`);
        const files = await response.json();
        if (!response.ok) {
            throw new Error(files.error || 'Failed to load files');
        }

        container.innerHTML = files.length ? files.map(file => `
            <div class="file-card">
                <div class="card-title">${file.title}</div>
                <div class="card-description">${file.description}</div>
                <div class="card-meta">
                    <span>Category: ${file.category}</span>
                    <span>Size: ${(file.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div class="card-meta">
                    <span>Price: ${file.price > 0 ? file.price.toFixed(2) + ' AGNOS' : 'Free'}</span>
                </div>
                <div class="file-actions">
                    <button class="btn-success" onclick="downloadFile('${file.file_path}', '${file.title}')">
                        Download
                    </button>
                    <button class="btn-danger" onclick="deleteFile(${file.id}, '${file.title}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('') : `
            <div class="file-card">
                <div class="card-title">No Files Uploaded</div>
                <div class="card-description">Upload files to share with the community and earn AGNOS</div>
                <div class="card-actions">
                    <button class="btn-primary" onclick="showModal('upload-file-modal')">Upload File</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading user files:', error);
        container.innerHTML = '<p>Error loading files</p>';
    }
}

// async function loadAllFiles(filter = '') {
//     const container = document.getElementById('all-files');
//     if (!container) return;

//     try {
//         const response = await fetch('/api/files');
//         let files = await response.json();
//         if (!response.ok) {
//             throw new Error(files.error || 'Failed to load files');
//         }

//         if (filter && filter !== 'All Categories') {
//             files = files.filter(f => f.category === filter);
//         }

//         container.innerHTML = files.length ? files.map(file => `
//             <div class="file-card">
//                 <div class="card-title">${file.title}</div>
//                 <div class="card-description">${file.description}</div>
//                 <div class="card-meta">
//                     <span>Category: ${file.category}</span>
//                     <span>Size: ${(file.file_size / (1024 * 1024)).toFixed(2)} MB</span>
//                 </div>
//                 <div class="card-meta">
//                     <span>Uploaded by: ${file.uploader_username}</span>
//                     <span class="${file.price > 0 ? 'price-tag' : 'free-tag'}">${file.price > 0 ? file.price.toFixed(2) + ' AGNOS' : 'Free'}</span>
//                 </div>
//                 <div class="card-actions">
//                     ${file.price > 0 ?
//                 `<button class="btn-primary" onclick="buyFile(${file.id}, ${file.price}, '${file.uploader_username}')">Buy (${file.price.toFixed(2)} AGNOS)</button>` :
//                 `<button class="btn-primary" onclick="downloadFile('${file.file_path}')">Download</button>`}
//                 </div>
//             </div>
//         `).join('') : '<p>No files available</p>';
//     } catch (error) {
//         console.error('Error loading all files:', error);
//         container.innerHTML = '<p>Error loading files</p>';
//     }
// }





// Replace the loadAllFiles function in app.js
async function loadAllFiles(filter = '') {
    const container = document.getElementById('all-files');
    if (!container) return;

    try {
        const response = await fetch('/api/files');
        let files = await response.json();
        if (!response.ok) {
            throw new Error(files.error || 'Failed to load files');
        }

        // Fetch user transactions
        const transactionsResponse = await fetch(`/api/transactions/${currentUser.id}`);
        const transactions = await transactionsResponse.json();

        if (filter && filter !== 'All Categories') {
            files = files.filter(f => f.category === filter);
        }

        container.innerHTML = files.length ? files.map(file => {
            const isPurchased = transactions.some(t => t.purpose === 'File Purchase' && t.recipient_id === file.user_id && t.sender_id === currentUser.id && t.file_id === file.id);
            const isUploader = file.user_id === currentUser.id;
            let buttonText = isPurchased || isUploader ? 'Download' : 'Buy';
            let buttonAction = isPurchased || isUploader ? `downloadFile('${file.file_path}', '${file.title}')` : `buyFile(${file.id}, ${file.price}, '${file.uploader_username}')`;
            let buttonClass = isPurchased || isUploader ? 'btn-success' : 'btn-secondary';

            return `
                <div class="file-card">
                    <div class="card-title">${file.title}</div>
                    <div class="card-description">${file.description || 'No description'}</div>
                    <div class="card-meta">
                        <span>Category: ${file.category}</span>
                        <span>Uploader: ${file.uploader_username}</span>
                    </div>
                    <div class="card-meta">
                        <span>File Size: ${(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        <span class="price-tag">${file.price.toFixed(2)} AGNOS</span>
                    </div>
                    <div class="card-actions">
                        <button class="${buttonClass}" onclick="${buttonAction}">${buttonText} ${isPurchased || isUploader ? '' : `(${file.price.toFixed(2)} AGNOS)`}</button>
                    </div>
                </div>
            `;
        }).join('') : '<p>No files available</p>';
    } catch (error) {
        console.error('Error loading all files:', error);
        container.innerHTML = '<p>Error loading files</p>';
    }
}

function getFileSize(filePath) {
    return filePath.file_size ? (filePath.file_size / (1024 * 1024)).toFixed(2) : 'N/A';
}

// async function buyFile(fileId, price, uploaderUsername) {
//     try {
//         const response = await fetch('/api/transactions', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 senderId: currentUser.id,
//                 recipientUsername: uploaderUsername,
//                 amount: price,
//                 purpose: 'File Purchase'
//             })
//         });
//         const data = await response.json();
//         if (!response.ok) {
//             throw new Error(data.error || 'Failed to purchase file');
//         }

//         const fileResponse = await fetch(`/api/files`);
//         const files = await fileResponse.json();
//         const file = files.find(f => f.id === fileId);
//         if (!file) {
//             throw new Error('File not found');
//         }

//         alert('File purchased successfully! Download starting...');
//         downloadFile(file.file_path);
//         await updateBalanceDisplay();
//         await loadTransactionHistory();
//     } catch (error) {
//         console.error('Error purchasing file:', error);
//         alert('Failed to purchase file: ' + error.message);
//     }
// }





// Replace the buyFile function in app.js
async function buyFile(fileId, price, uploaderUsername) {
    try {
        const transactionsResponse = await fetch(`/api/transactions/${currentUser.id}`);
        const transactions = await transactionsResponse.json();
        const isAlreadyPurchased = transactions.some(t => t.purpose === 'File Purchase' && t.sender_id === currentUser.id && t.file_id === fileId);

        if (isAlreadyPurchased) {
            alert('You have already purchased this file. You can now download it.');
            return;
        }

        const userResponse = await fetch(`/api/user/${currentUser.id}`);
        const user = await userResponse.json();
        if (!userResponse.ok) throw new Error(user.error || 'Failed to fetch user data');

        if (user.agnos_balance < price) {
            alert('Insufficient AGNOS balance');
            return;
        }

        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: currentUser.id,
                recipientUsername: uploaderUsername,
                amount: price,
                purpose: 'File Purchase',
                fileId
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Transaction failed');

        alert('File purchased successfully!');
        currentUser.agnos_balance -= price;
        updateBalanceDisplay();
        await loadAllFiles();
    } catch (error) {
        console.error('Error buying file:', error);
        alert('Failed to buy file: ' + error.message);
    }
}

function downloadFile(filePath) {
    const link = document.createElement('a');
    link.href = `/${filePath}`;
    link.download = filePath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Service Management
async function loadUserServices() {
    const container = document.getElementById('user-services');
    if (!container) return;

    try {
        const response = await fetch(`/api/services/user/${currentUser.id}`);
        const services = await response.json();
        if (!response.ok) {
            throw new Error(services.error || 'Failed to load services');
        }

        container.innerHTML = services.length ? services.map(service => `
            <div class="service-card">
                <div class="card-title">${service.title}</div>
                <div class="card-description">${service.description}</div>
                <div class="card-meta">
                    <span>Category: ${service.category}</span>
                    <span>Price: ${service.price.toFixed(2)} AGNOS</span>
                </div>
            </div>
        `).join('') : `
            <div class="service-card">
                <div class="card-title">No Services Created</div>
                <div class="card-description">Offer services to earn AGNOS from the community</div>
                <div class="card-actions">
                    <button class="btn-primary" onclick="showModal('create-service-modal')">Create Service</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading user services:', error);
        container.innerHTML = '<p>Error loading services</p>';
    }
}

// async function loadAllServices(filter = '') {
//     const container = document.getElementById('all-services');
//     if (!container) return;

//     try {
//         const response = await fetch('/api/services');
//         let services = await response.json();
//         if (!response.ok) {
//             throw new Error(services.error || 'Failed to load services');
//         }

//         if (filter && filter !== 'All Categories') {
//             services = services.filter(s => s.category === filter);
//         }

//         container.innerHTML = services.length ? services.map(service => `
//             <div class="service-card">
//                 <div class="card-title">${service.title}</div>
//                 <div class="card-description">${service.description}</div>
//                 <div class="card-meta">
//                     <span>Category: ${service.category}</span>
//                     <span>Provider: ${service.provider_username}</span>
//                 </div>
//                 <div class="card-meta">
//                     <span class="price-tag">${service.price.toFixed(2)} AGNOS</span>
//                 </div>
//                 <div class="card-actions">
//                     <button class="btn-primary" onclick="contactProvider('${service.provider_username}')">Contact</button>
//                     <button class="btn-secondary" onclick="buyService(${service.id}, ${service.price}, '${service.provider_username}')">Buy (${service.price.toFixed(2)} AGNOS)</button>
//                 </div>
//             </div>
//         `).join('') : '<p>No services available</p>';
//     } catch (error) {
//         console.error('Error loading all services:', error);
//         container.innerHTML = '<p>Error loading services</p>';
//     }
// }

// async function buyService(serviceId, price, providerUsername) {
//     try {
//         const response = await fetch('/api/transactions', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 senderId: currentUser.id,
//                 recipientUsername: providerUsername,
//                 amount: price,
//                 purpose: 'Service Payment'
//             })
//         });
//         const data = await response.json();
//         if (!response.ok) {
//             throw new Error(data.error || 'Failed to purchase service');
//         }

//         alert('Service purchased successfully! Contact the provider for details.');
//         await updateBalanceDisplay();
//         await loadTransactionHistory();
//     } catch (error) {
//         console.error('Error purchasing service:', error);
//         alert('Failed to purchase service: ' + error.message);
//     }
// }





// Replace the buyService function in app.js
async function buyService(serviceId, price, providerUsername) {
    try {
        const transactionsResponse = await fetch(`/api/transactions/${currentUser.id}`);
        const transactions = await transactionsResponse.json();
        const isAlreadyPurchased = transactions.some(t => t.purpose === 'Service Payment' && t.sender_id === currentUser.id && t.service_id === serviceId);

        if (isAlreadyPurchased) {
            alert('You have already purchased this service. You can now access it.');
            return;
        }

        const userResponse = await fetch(`/api/user/${currentUser.id}`);
        const user = await userResponse.json();
        if (!userResponse.ok) throw new Error(user.error || 'Failed to fetch user data');

        if (user.agnos_balance < price) {
            alert('Insufficient AGNOS balance');
            return;
        }

        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: currentUser.id,
                recipientUsername: providerUsername,
                amount: price,
                purpose: 'Service Payment',
                serviceId
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Transaction failed');

        alert('Service purchased successfully!');
        currentUser.agnos_balance -= price;
        updateBalanceDisplay();
        await loadAllServices();
    } catch (error) {
        console.error('Error buying service:', error);
        alert('Failed to buy service: ' + error.message);
    }
}

async function contactProvider(username) {
    try {
        document.getElementById('chat-username').value = username;
        await handleNewChat({ preventDefault: () => { } });
    } catch (error) {
        console.error('Error starting chat with provider:', error);
        alert('Failed to start chat with provider');
    }
}

// Chat Management
async function loadChatList() {
    const container = document.getElementById('chat-list');
    if (!container) return;

    try {
        const response = await fetch(`/api/chats/${currentUser.id}`);
        const chats = await response.json();
        if (!response.ok) {
            throw new Error(chats.error || 'Failed to load chats');
        }

        const activeTab = document.querySelector('.chat-tab-btn.active')?.dataset.chatTab || 'personal';
        const filteredChats = chats.filter(chat =>
            activeTab === 'personal' ? !chat.is_community_message : chat.is_community_message
        );

        container.innerHTML = filteredChats.length ? filteredChats.map(chat => `
            <div class="chat-item ${currentChat?.id === chat.chat_id ? 'active' : ''}" 
                 onclick="openChat('${chat.chat_id}', '${chat.chat_name}')">
                <div class="chat-info">
                    <div class="chat-name">${chat.chat_name || 'Unknown'}</div>
                    <div class="chat-preview">${chat.last_message_content?.substring(0, 30) || 'No messages yet'}...</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${new Date(chat.last_message_time).toLocaleTimeString()}</div>
                    ${chat.unread_count > 0 ? `<div class="unread-badge">${chat.unread_count}</div>` : ''}
                </div>
            </div>
        `).join('') : '<div class="no-chats">No chats available</div>';
    } catch (error) {
        console.error('Error loading chat list:', error);
        container.innerHTML = '<div class="error-message">Error loading chats</div>';
    }
}

async function openChat(chatId, chatName) {
    currentChat = { id: chatId, name: chatName };
    const messagesContainer = document.getElementById('chat-messages');
    const inputArea = document.getElementById('chat-input-area');

    if (!messagesContainer || !inputArea) return;

    try {
        // Clear any existing polling
        if (window.chatPollInterval) {
            clearInterval(window.chatPollInterval);
        }

        // Load initial messages
        const response = await fetch(`/api/messages/${chatId}/${currentUser.id}`);
        const messages = await response.json();
        if (!response.ok) throw new Error(messages.error || 'Failed to load messages');

        messagesContainer.innerHTML = messages.map(message => `
            <div class="message ${message.sender_id === currentUser.id ? 'sent' : 'received'}">
                <div class="message-header">
                    <span class="sender">${message.sender_username}</span>
                    <span class="time">${new Date(message.sent_at).toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${message.content}</div>
                ${message.sender_id === currentUser.id ? `
                    <div class="message-status">
                        ${message.is_read ? '✓✓ Read' : '✓ Delivered'}
                    </div>
                    <button class="btn-small" onclick="deleteMessage(${message.id})">Delete</button>
                ` : ''}
            </div>
        `).join('') || '<div class="no-messages">No messages yet</div>';

        inputArea.style.display = 'flex';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Mark messages as read
        await fetch(`/api/messages/read/${chatId}/${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        // Update chat list to reflect read status
        await loadChatList();
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = '<div class="error-message">Error loading messages</div>';
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message || !currentChat) {
        if (currentChat && currentChat.id.startsWith('community:')) {
            return; // Skip alert for community chat
        }
        alert('Please enter a message and select a chat');
        return;
    }
    // if (!input || !input.value.trim() || !currentChat) {
    //     alert('Please enter a message and select a chat');
    //     return;
    // }

    try {
        const isCommunityMessage = currentChat.id.startsWith('community:');
        const messageData = {
            senderId: currentUser.id,
            recipientId: isCommunityMessage ? null : currentChat.id.split(':')[1],
            communityId: isCommunityMessage ? currentChat.id.split(':')[1] : null,
            content: input.value.trim(),
            isCommunityMessage
        };

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                data: messageData
            }));
            input.value = '';
            await openChat(currentChat.id, currentChat.name); // Refresh chat immediately
        } else {
            throw new Error('WebSocket not connected');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message: WebSocket not connected');
    }
}

async function deleteMessage(messageId) {
    try {
        const response = await fetch(`/api/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete message');
        }
        alert(data.message);
        await openChat(currentChat.id, currentChat.name);
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message: ' + error.message);
    }
}

async function handleNewChat(e) {
    e.preventDefault();
    const username = document.getElementById('chat-username').value.trim();
    if (!username) {
        alert('Please enter a username or community name');
        return;
    }

    try {
        // First, check if it's a community
        const communityResponse = await fetch('/api/communities');
        const communities = await communityResponse.json();
        if (!communityResponse.ok) {
            throw new Error(communities.error || 'Failed to fetch communities');
        }

        const community = communities.find(c => c.name.toLowerCase() === username.toLowerCase());
        if (community) {
            // Check if user is a member of the community
            const isMemberResponse = await fetch(`/api/communities/user/${currentUser.id}`);
            const userCommunities = await isMemberResponse.json();
            if (!isMemberResponse.ok) {
                throw new Error(userCommunities.error || 'Failed to fetch user communities');
            }

            if (!userCommunities.some(c => c.id === community.id)) {
                alert('You must be a member of the community to start a chat');
                return;
            }

            // Open community chat
            await openChat(`community:${community.id}`, community.name);
        } else {
            // Check if it's a valid user
            const userResponse = await fetch(`/api/check-username/${username}`);
            const userData = await userResponse.json();
            if (userData.available) {
                throw new Error('User not found');
            }

            // Fetch recipient user ID
            const usersResponse = await fetch('/api/users'); // Assuming an endpoint to list users
            const users = await usersResponse.json();
            if (!usersResponse.ok) {
                throw new Error(users.error || 'Failed to fetch users');
            }

            const recipient = users.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (!recipient) {
                throw new Error('User not found');
            }

            if (recipient.id === currentUser.id) {
                alert('You cannot start a chat with yourself');
                return;
            }

            // Open private chat
            await openChat(`private:${recipient.id}`, recipient.username);
        }

        hideModal('new-chat-modal');
        document.getElementById('new-chat-form').reset();
    } catch (error) {
        console.error('Error starting new chat:', error);
        alert(`Failed to start chat: ${error.message}`);
    }
}

// Transaction Management
async function loadTransactionHistory() {
    const container = document.getElementById('transaction-list');
    if (!container) return;

    try {
        const response = await fetch(`/api/transactions/${currentUser.id}`);
        const transactions = await response.json();
        if (!response.ok) {
            throw new Error(transactions.error || 'Failed to load transactions');
        }

        container.innerHTML = transactions.length ? transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon">
                    ${transaction.sender_id === currentUser.id ? '↑' : '↓'}
                </div>
                <div class="transaction-details">
                    <div class="transaction-purpose">${transaction.purpose}</div>
                    <div class="transaction-party">
                        ${transaction.sender_id === currentUser.id ?
                `To: ${transaction.recipient_username}` :
                `From: ${transaction.sender_username}`}
                    </div>
                    <div class="transaction-time">
                        ${new Date(transaction.created_at).toLocaleString()}
                    </div>
                </div>
                <div class="transaction-amount ${transaction.sender_id === currentUser.id ? 'outgoing' : 'incoming'}">
                    ${transaction.sender_id === currentUser.id ? '-' : '+'}${transaction.amount.toFixed(2)} AGNOS
                </div>
            </div>
        `).join('') : '<div class="no-transactions">No transactions yet</div>';
    } catch (error) {
        console.error('Error loading transactions:', error);
        container.innerHTML = '<div class="error-message">Error loading transaction history</div>';
    }
}

async function handleSendAgnos(e) {
    e.preventDefault();
    const recipient = document.getElementById('agnos-recipient').value.trim();
    const amount = parseFloat(document.getElementById('agnos-amount').value);
    const purpose = document.getElementById('agnos-purpose').value;

    if (!recipient || !amount || amount <= 0 || !purpose) {
        alert('All fields are required and amount must be positive');
        return;
    }

    if (recipient.toLowerCase() === currentUser.username.toLowerCase()) {
        alert('You cannot send AGNOS to yourself');
        return;
    }

    try {
        const recipientCheck = await fetch(`/api/check-username/${recipient}`);
        const recipientData = await recipientCheck.json();
        if (recipientData.available) {
            throw new Error('Recipient not found');
        }

        const userResponse = await fetch(`/api/user/${currentUser.id}`);
        const user = await userResponse.json();
        if (user.agnos_balance < amount) {
            throw new Error('Insufficient balance');
        }

        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: currentUser.id,
                recipientUsername: recipient,
                amount,
                purpose
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send AGNOS');
        }

        alert(`Successfully sent ${amount.toFixed(2)} AGNOS to ${recipient}`);
        hideModal('send-agnos-modal');
        document.getElementById('send-agnos-form').reset();
        await updateBalanceDisplay();
        await loadTransactionHistory();
    } catch (error) {
        console.error('Error sending AGNOS:', error);
        alert(`Transaction failed: ${error.message}`);
    }
}

// Join Request Management
async function loadJoinRequests() {
    const container = document.getElementById('join-requests-list');
    const requestsContainer = document.getElementById('requests-container');

    try {
        const response = await fetch(`/api/community-requests/${currentUser.id}`);
        const requests = await response.json();

        if (requests.length) {
            container.innerHTML = requests.map(request => `
                <div class="request-card">
                    <h4>${request.community_name}</h4>
                    <div class="request-meta">
                        <span>Status: ${request.status}</span>
                        <span>Submitted: ${new Date(request.created_at).toLocaleString()}</span>
                    </div>
                    ${request.status === 'Pending' ? `
                        <div class="request-actions">
                            <button class="btn-secondary" onclick="cancelJoinRequest(${request.id})">
                                Cancel Request
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
            requestsContainer.classList.add('active');
        } else {
            container.innerHTML = '<div class="no-requests">No join requests found</div>';
            requestsContainer.classList.remove('active');
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        container.innerHTML = '<div class="no-requests">Error loading requests</div>';
    }
}

async function loadAdminRequests() {
    const container = document.getElementById('admin-requests-list');
    const requestsContainer = document.getElementById('requests-container');

    try {
        const response = await fetch(`/api/community-requests/admin/${currentUser.id}`);
        const requests = await response.json();

        if (requests.length) {
            container.innerHTML = requests.map(request => `
                <div class="request-card">
                    <h4>${request.username} wants to join ${request.community_name}</h4>
                    <div class="request-meta">
                        <span>Requested on: ${new Date(request.created_at).toLocaleString()}</span>
                    </div>
                    <div class="request-actions">
                        <button class="btn-success" 
                                onclick="approveJoinRequest(${request.id}, ${request.community_id})">
                            Approve
                        </button>
                        <button class="btn-danger" 
                                onclick="rejectJoinRequest(${request.id}, ${request.community_id})">
                            Reject
                        </button>
                    </div>
                </div>
            `).join('');
            requestsContainer.classList.add('active');
        } else {
            container.innerHTML = '<div class="no-requests">No pending requests</div>';
            requestsContainer.classList.remove('active');
        }
    } catch (error) {
        console.error('Error loading admin requests:', error);
        container.innerHTML = '<div class="no-requests">Error loading requests</div>';
    }
}

async function cancelJoinRequest(requestId) {
    try {
        const response = await fetch(`/api/community-requests/${requestId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to cancel join request');
        }
        alert(data.message);
        await loadJoinRequests();
        await loadAllCommunities();
    } catch (error) {
        console.error('Error canceling join request:', error);
        alert('Failed to cancel join request: ' + error.message);
    }
}

// async function approveJoinRequest(requestId, communityId) {
//     try {
//         const response = await fetch(`/api/community-requests/approve/${requestId}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ userId: currentUser.id, communityId })
//         });
//         const data = await response.json();
//         if (!response.ok) {
//             throw new Error(data.error || 'Failed to approve join request');
//         }
//         alert(data.message);
//         await loadAdminRequests();
//         await loadAllCommunities();
//         await loadUserCommunities();
//     } catch (error) {
//         console.error('Error approving join request:', error);
//         alert('Failed to approve join request: ' + error.message);
//     }
// }


// Replace the approveJoinRequest function in app.js
async function approveJoinRequest(requestId, communityId) {
    try {
        const response = await fetch(`/api/community-requests/approve/${requestId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, communityId })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to approve join request');
        }
        alert(data.message);
        await loadAdminRequests();
        await loadAllCommunities();
        await loadUserCommunities();
        await loadCommunityMembers(communityId);
    } catch (error) {
        console.error('Error approving join request:', error);
        alert('Failed to approve join request: ' + error.message);
    }
}



// async function rejectJoinRequest(requestId, communityId) {
//     try {
//         const response = await fetch(`/api/community-requests/reject/${requestId}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ userId: currentUser.id, communityId })
//         });
//         const data = await response.json();
//         if (!response.ok) {
//             throw new Error(data.error || 'Failed to reject join request');
//         }
//         alert(data.message);
//         await loadAdminRequests();
//         await loadAllCommunities();
//     } catch (error) {
//         console.error('Error rejecting join request:', error);
//         alert('Failed to reject join request: ' + error.message);
//     }
// }







// Replace the rejectJoinRequest function in app.js
async function rejectJoinRequest(requestId, communityId) {
    try {
        const response = await fetch(`/api/community-requests/reject/${requestId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, communityId })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to reject join request');
        }
        alert(data.message);
        await loadAdminRequests();
        await loadAllCommunities();
        await loadCommunityMembers(communityId);
    } catch (error) {
        console.error('Error rejecting join request:', error);
        alert('Failed to reject join request: ' + error.message);
    }
}

// async function openCommunity(communityId) {
//     try {
//         const membershipResponse = await fetch(`/api/community-members/${communityId}/${currentUser.id}`);
//         const membership = await membershipResponse.json();
//         if (!membershipResponse.ok || !membership) {
//             throw new Error('You must be a member to access this community');
//         }

//         const communityResponse = await fetch(`/api/communities/${communityId}`);
//         const community = await communityResponse.json();
//         if (!communityResponse.ok) throw new Error(community.error || 'Failed to load community');

//         document.getElementById('community-header').textContent = community.name;
//         document.getElementById('community-description').textContent = community.description;
//         showPage('community-page');

//         await loadCommunityChat(communityId);
//         await loadCommunityFiles(communityId);
//         await loadCommunityServices(communityId);
//         await loadCommunityMembers(communityId);
//     } catch (error) {
//         console.error('Error opening community:', error);
//         alert(`Failed to open community: ${error.message}`);
//     }
// }

async function loadCommunityChat(communityId) {
    currentChat = { id: `community:${communityId}`, name: 'Community Chat' };
    await openChat(currentChat.id, currentChat.name);
}






// async function loadCommunityFiles(communityId) {
//     try {
//         const response = await fetch(`/api/files/community/${communityId}`);
//         const files = await response.json();
//         if (!response.ok) throw new Error(files.error || 'Failed to load files');

//         const container = document.getElementById('community-files');
//         container.innerHTML = files.length ? `
//             <h3>Community Files</h3>
//             <div class="files-grid">
//                 ${files.map(file => `
//                     <div class="file-card">
//                         <h4>${file.title}</h4>
//                         <p>${file.description || 'No description'}</p>
//                         <div class="file-meta">
//                             <span>${file.category}</span>
//                             <span>${(file.file_size / (1024 * 1024)).toFixed(2)} MB</span>
//                         </div>
//                         <div class="file-actions">
//                             ${file.price > 0 ? `
//                                 <button class="btn-primary" 
//                                         onclick="buyFile(${file.id}, ${file.price}, '${file.uploader_username}')">
//                                     Buy (${file.price.toFixed(2)} AGNOS)
//                                 </button>
//                             ` : `
//                                 <button class="btn-primary" 
//                                         onclick="downloadFile('${file.file_path}')">
//                                     Download
//                                 </button>
//                             `}
//                         </div>
//                     </div>
//                 `).join('')}
//             </div>
//         ` : '<p>No files shared in this community yet</p>';
//     } catch (error) {
//         console.error('Error loading community files:', error);
//         document.getElementById('community-files').innerHTML = '<p>Error loading files</p>';
//     }
// }






async function loadCommunityServices(communityId) {
    try {
        const response = await fetch(`/api/services/community/${communityId}`);
        const services = await response.json();
        if (!response.ok) throw new Error(services.error || 'Failed to load services');

        const container = document.getElementById('community-services');
        container.innerHTML = services.length ? `
            <h3>Community Services</h3>
            <div class="services-grid">
                ${services.map(service => `
                    <div class="service-card">
                        <h4>${service.title}</h4>
                        <p>${service.description}</p>
                        <div class="service-meta">
                            <span>${service.category}</span>
                            <span class="price">${service.price.toFixed(2)} AGNOS</span>
                        </div>
                        <div class="service-actions">
                            <button class="btn-primary" 
                                    onclick="contactProvider('${service.provider_username}')">
                                Contact
                            </button>
                            <button class="btn-secondary" 
                                    onclick="buyService(${service.id}, ${service.price}, '${service.provider_username}')">
                                Purchase
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<p>No services offered in this community yet</p>';
    } catch (error) {
        console.error('Error loading community services:', error);
        document.getElementById('community-services').innerHTML = '<p>Error loading services</p>';
    }
}











// Replace the loadCommunityMembers function in app.js
async function loadCommunityMembers(communityId) {
    try {
        const response = await fetch(`/api/community-members/${communityId}`);
        const members = await response.json();
        if (!response.ok) throw new Error(members.error || 'Failed to load members');

        const container = document.getElementById('community-members');
        container.innerHTML = members.length ? `
            <h3>Community Members</h3>
            <div class="members-list">
                ${members.map(member => `
                    <div class="member-item">
                        <span class="username">${member.username}</span>
                        <span class="role ${member.role.toLowerCase()}">${member.role}</span>
                    </div>
                `).join('')}
            </div>
        ` : '<p>No members found</p>';
    } catch (error) {
        console.error('Error loading community members:', error);
        document.getElementById('community-members').innerHTML = '<p>Error loading members</p>';
    }
}








// async function loadCommunityMembers(communityId) {
//     try {
//         const response = await fetch(`/api/community-members/${communityId}`);
//         const members = await response.json();
//         if (!response.ok) throw new Error(members.error || 'Failed to load members');

//         const container = document.getElementById('community-members');
//         container.innerHTML = members.length ? `
//             <h3>Community Members</h3>
//             <div class="members-list">
//                 ${members.map(member => `
//                     <div class="member-item">
//                         <span class="username">${member.username}</span>
//                         <span class="role ${member.role.toLowerCase()}">${member.role}</span>
//                     </div>
//                 `).join('')}
//             </div>
//         ` : '<p>No members found</p>';
//     } catch (error) {
//         console.error('Error loading community members:', error);
//         document.getElementById('community-members').innerHTML = '<p>Error loading members</p>';
//     }
// }

// Form Handlers
async function handleCreateCommunity(e) {
    e.preventDefault();
    const name = document.getElementById('community-name').value.trim();
    const description = document.getElementById('community-description').value.trim();
    const category = document.getElementById('community-category').value;
    const isPrivate = document.getElementById('community-is-private').checked;

    if (!name || !description || !category) {
        alert('All fields are required');
        return;
    }

    try {
        const response = await fetch('/api/communities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                description,
                category,
                isPrivate,
                creatorId: currentUser.id
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create community');
        }

        alert(`Community "${name}" created successfully!`);
        hideModal('create-community-modal');
        document.getElementById('create-community-form').reset();
        await loadUserCommunities();
        await loadAllCommunities();
    } catch (error) {
        console.error('Error creating community:', error);
        alert('Failed to create community');
    }
}

// async function handleFileUpload(e) {
//     e.preventDefault();
//     const communityId = document.getElementById('file-community-id').value || null; // Get ID (or null if empty)
//     console.log("Uploading to Community ID:", communityId); // Debug log

//     console.log('File upload form submitted');

//     try {
//         const fileInput = document.getElementById('file-upload');
//         const title = document.getElementById('file-title').value.trim();
//         const description = document.getElementById('file-description').value.trim();
//         const category = document.getElementById('file-category').value;
//         const price = parseFloat(document.getElementById('file-price').value) || 0;
//         const communityId = document.getElementById('file-community-id').value || null;

//         if (!fileInput.files[0] || !title || !category) {
//             alert('File, title, and category are required');
//             return;
//         }

//         const formData = new FormData();
//         formData.append('file', fileInput.files[0]);
//         formData.append('userId', currentUser.id);
//         formData.append('title', title);
//         formData.append('description', description);
//         formData.append('category', category);
//         formData.append('price', price);
//         if (communityId) formData.append('communityId', communityId);
//         else formData.append('communityId', '');

//         const response = await fetch('/api/upload-file', {
//             method: 'POST',
//             body: formData
//         });
//         const data = await response.json();

//         if (!response.ok) {
//             throw new Error(data.error || 'File upload failed');
//         }

//         console.log('File uploaded successfully:', data.file.title);
//         alert(`File "${title}" uploaded successfully!`);

//         hideModal('upload-file-modal');
//         document.getElementById('upload-file-form').reset();
//         await loadUserFiles();
//         await loadAllFiles();
//     } catch (error) {
//         console.error('File upload error:', error);
//         alert('File upload failed: ' + error.message);
//     }
// }





async function handleFileUpload(e) {
    e.preventDefault();
    console.log('File upload form submitted');

    const fileInput = document.getElementById('file-upload');
    const title = document.getElementById('file-title').value.trim();
    const description = document.getElementById('file-description').value.trim();
    const category = document.getElementById('file-category').value;
    const price = parseFloat(document.getElementById('file-price').value) || 0;
    const communityId = document.getElementById('file-community-id').value || null;

    if (!fileInput.files[0] || !title || !category) {
        alert('File, title, and category are required');
        return;
    }

    // Show progress bar
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressText = document.getElementById('upload-progress-text');
    const completeMessage = document.getElementById('upload-complete-message');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = 'Uploading: 0%';
    completeMessage.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('userId', currentUser.id);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('price', price);
        if (communityId) formData.append('communityId', communityId);
        else formData.append('communityId', '');

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload-file', true);

            // Track upload progress
            xhr.upload.onprogress = function (event) {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    progressBar.style.width = percentComplete + '%';
                    progressText.textContent = `Uploading: ${Math.round(percentComplete)}%`;
                }
            };

            // Handle completion
            xhr.onload = function () {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    progressBar.style.width = '100%';
                    progressText.style.display = 'none';
                    completeMessage.style.display = 'block';
                    setTimeout(() => {
                        hideModal('upload-file-modal');
                        document.getElementById('upload-file-form').reset();
                        progressContainer.style.display = 'none';
                        loadUserFiles();
                        loadAllFiles();
                        alert(`File "${title}" uploaded successfully!`);
                        resolve(data);
                    }, 1000); // Delay to show completion message
                } else {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || 'File upload failed'));
                }
            };

            xhr.onerror = function () {
                reject(new Error('File upload failed'));
            };

            xhr.send(formData);
        });
    } catch (error) {
        console.error('File upload error:', error);
        alert('File upload failed: ' + error.message);
        progressContainer.style.display = 'none';
    }
}

async function handleCreateService(e) {
    e.preventDefault();
    const title = document.getElementById('service-title').value.trim();
    const description = document.getElementById('service-description').value.trim();
    const category = document.getElementById('service-category').value;
    const price = parseFloat(document.getElementById('service-price').value);
    const communityId = document.getElementById('service-community-id').value || null;

    if (!title || !description || !category || !price || price <= 0) {
        alert('All fields are required and price must be positive');
        return;
    }

    try {
        const response = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                title,
                description,
                category,
                price,
                communityId
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create service');
        }

        alert(`Service "${title}" created successfully!`);
        hideModal('create-service-modal');
        document.getElementById('create-service-form').reset();
        await loadUserServices();
        await loadAllServices();
    } catch (error) {
        console.error('Error creating service:', error);
        alert('Failed to create service');
    }
}

// Filter Functions
async function filterCommunities() {
    const filter = document.getElementById('community-filter').value;
    await loadAllCommunities(filter);
}

async function filterFiles() {
    const filter = document.getElementById('file-filter').value;
    await loadAllFiles(filter);
}

async function filterServices() {
    const filter = document.getElementById('service-filter').value;
    await loadAllServices(filter);
}

// Section and Tab Management
function switchSection(sectionId) {
    try {
        console.log('Switching to section:', sectionId);

        document.querySelectorAll('.sidebar-item').forEach(item => {
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        document.querySelectorAll('.content-section').forEach(section => {
            if (section.id === sectionId + '-section') {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('Error switching section:', error);
    }
}

function switchTab(tabId) {
    try {
        const parentSection = document.querySelector('.content-section.active');
        if (!parentSection) return;

        parentSection.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        parentSection.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        if (tabId === 'my-requests') {
            loadJoinRequests();
        } else if (tabId === 'admin-requests') {
            loadAdminRequests();
        } else if (tabId === 'user-communities') loadUserCommunities();
        else if (tabId === 'all-communities') loadAllCommunities();
        else if (tabId === 'user-files') loadUserFiles();
        else if (tabId === 'all-files') loadAllFiles();
        else if (tabId === 'user-services') loadUserServices();
        else if (tabId === 'all-services') loadAllServices();
    } catch (error) {
        console.error('Error switching tab:', error);
    }
}

function switchChatTab(tabId) {
    try {
        document.querySelectorAll('.chat-tab-btn').forEach(btn => {
            if (btn.dataset.chatTab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        loadChatList();
    } catch (error) {
        console.error('Error switching chat tab:', error);
    }
}






// communitiesssssssssssssssssss





// Community Page Functions
let currentCommunityId = null;

function switchCommunityTab(tabId) {
    document.querySelectorAll('.community-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.community-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `community-${tabId}`);
    });

    // Load content when tab is switched
    if (tabId === 'chat') {
        loadCommunityChat(currentCommunityId);
    } else if (tabId === 'files') {
        loadCommunityFiles(currentCommunityId);
    } else if (tabId === 'services') {
        loadCommunityServices(currentCommunityId);
    } else if (tabId === 'members') {
        loadCommunityMembers(currentCommunityId);
    }
}

async function openCommunity(communityId) {
    try {
        currentCommunityId = communityId;

        // Check membership
        const membershipResponse = await fetch(`/api/community-members/${communityId}/${currentUser.id}`);
        const membership = await membershipResponse.json();
        if (!membershipResponse.ok || !membership) {
            throw new Error('You must be a member to access this community');
        }

        // Load community info
        const communityResponse = await fetch(`/api/communities/${communityId}`);
        const community = await communityResponse.json();
        if (!communityResponse.ok) throw new Error(community.error || 'Failed to load community');

        document.getElementById('community-header').textContent = community.name;
        document.getElementById('community-description').textContent = community.description;

        showPage('community-page');
        switchCommunityTab('chat');

    } catch (error) {
        console.error('Error opening community:', error);
        alert(`Failed to open community: ${error.message}`);
    }
}

async function loadCommunityChat(communityId) {
    currentChat = { id: `community:${communityId}`, name: 'Community Chat' };

    const messagesContainer = document.getElementById('community-chat-messages');
    if (!messagesContainer) return;

    try {
        const response = await fetch(`/api/messages/community:${communityId}/${currentUser.id}`);
        const messages = await response.json();
        if (!response.ok) throw new Error(messages.error || 'Failed to load messages');

        messagesContainer.innerHTML = messages.map(message => `
            <div class="message ${message.sender_id === currentUser.id ? 'sent' : 'received'}">
                <div class="message-header">
                    <span class="sender">${message.sender_username}</span>
                    <span class="time">${new Date(message.sent_at).toLocaleTimeString()}</span>
                </div>
                <div class="message-content">${message.content}</div>
                ${message.sender_id === currentUser.id ? `
                    <div class="message-status">
                        ${message.is_read ? '✓✓ Read' : '✓ Delivered'}
                    </div>
                ` : ''}
            </div>
        `).join('') || '<div class="no-messages">No messages yet</div>';

        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Mark messages as read
        await fetch(`/api/messages/read/community:${communityId}/${currentUser.id}`, {
            method: 'POST'
        });

    } catch (error) {
        console.error('Error loading community chat:', error);
        messagesContainer.innerHTML = '<div class="error-message">Error loading chat</div>';
    }
}

async function sendCommunityMessage() {
    const input = document.getElementById('community-chat-input');
    const message = input.value.trim();

    if (!message || !currentCommunityId) {
        return;
    }

    try {
        const messageData = {
            senderId: currentUser.id,
            recipientId: null,
            communityId: currentCommunityId,
            content: message,
            isCommunityMessage: true
        };

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                data: messageData
            }));
            input.value = '';
            await loadCommunityChat(currentCommunityId);
        } else {
            throw new Error('WebSocket not connected');
        }
    } catch (error) {
        console.error('Error sending community message:', error);
        alert('Failed to send message');
    }
}

async function loadCommunityFiles(communityId) {
    const container = document.getElementById('community-files-list');
    if (!container) return;

    try {
        const response = await fetch(`/api/files/community/${communityId}`);
        const files = await response.json();
        if (!response.ok) throw new Error(files.error || 'Failed to load files');

        // Get user transactions to check purchases
        const transactionsResponse = await fetch(`/api/transactions/${currentUser.id}`);
        const transactions = await transactionsResponse.json();

        container.innerHTML = files.length ? files.map(file => {
            const isUploader = file.user_id === currentUser.id;
            const isPurchased = transactions.some(t =>
                t.purpose === 'File Purchase' && t.file_id === file.id
            );

            return `
                <div class="community-item">
                    <h4>${file.title}</h4>
                    <p>${file.description || 'No description'}</p>
                    <div class="file-meta">
                        <span>${file.category}</span>
                        <span>${(file.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span class="price-tag">${file.price.toFixed(2)} AGNOS</span>
                    </div>
                    <div class="file-actions">
                        ${isUploader || isPurchased ? `
                            <button class="btn-success" onclick="downloadFile('${file.file_path}', '${file.title}')">
                                Download
                            </button>
                        ` : `
                            <button class="btn-primary" 
                                    onclick="buyFile(${file.id}, ${file.price}, '${file.uploader_username}')">
                                Buy
                            </button>
                        `}

                        ${isUploader ? `
                            <button class="btn-danger" onclick="deleteFile(${file.id}, '${file.title}')">
                                Delete
                            </button>
                        ` : ''}


                    </div>
                </div>
            `;
        }).join('') : '<div class="no-items">No files shared in this community yet</div>';
    } catch (error) {
        console.error('Error loading community files:', error);
        container.innerHTML = '<div class="error-message">Error loading files</div>';
    }
}

async function loadCommunityServices(communityId) {
    const container = document.getElementById('community-services-list');
    if (!container) return;

    try {
        const response = await fetch(`/api/services/community/${communityId}`);
        const services = await response.json();
        if (!response.ok) throw new Error(services.error || 'Failed to load services');

        // Get user transactions to check purchases
        const transactionsResponse = await fetch(`/api/transactions/${currentUser.id}`);
        const transactions = await transactionsResponse.json();

        container.innerHTML = services.length ? services.map(service => {
            const isProvider = service.user_id === currentUser.id;
            const isPurchased = transactions.some(t =>
                t.purpose === 'Service Payment' && t.service_id === service.id
            );

            return `
                <div class="community-item">
                    <h4>${service.title}</h4>
                    <p>${service.description}</p>
                    <div class="service-meta">
                        <span>${service.category}</span>
                        <span class="price-tag">${service.price.toFixed(2)} AGNOS</span>
                    </div>
                    <div class="service-actions">
                        ${isProvider ? `
                            <button class="btn-success" disabled>Your Service</button>
                        ` : `
                            <button class="btn-primary" 
                                    onclick="contactProvider('${service.provider_username}')">
                                Contact
                            </button>
                            ${isPurchased ? `
                                <button class="btn-success" 
                                        onclick="accessService(${service.id}, '${service.provider_username}')">
                                    Access
                                </button>
                            ` : `
                                <button class="btn-secondary" 
                                        onclick="buyService(${service.id}, ${service.price}, '${service.provider_username}')">
                                    Buy
                                </button>
                            `}
                        `}
                    </div>
                </div>
            `;
        }).join('') : '<div class="no-items">No services offered in this community yet</div>';
    } catch (error) {
        console.error('Error loading community services:', error);
        container.innerHTML = '<div class="error-message">Error loading services</div>';
    }
}

async function loadCommunityMembers(communityId) {
    const container = document.getElementById('community-members-list');
    if (!container) return;

    try {
        const response = await fetch(`/api/community-members/${communityId}`);
        const members = await response.json();
        if (!response.ok) throw new Error(members.error || 'Failed to load members');

        container.innerHTML = members.length ? members.map(member => `
            <div class="member-card">
                <div class="member-avatar">👤</div>
                <div class="member-info">
                    <div class="member-name">${member.username}</div>
                    <div class="member-role ${member.role}">${member.role}</div>
                </div>
            </div>
        `).join('') : '<div class="no-items">No members found</div>';
    } catch (error) {
        console.error('Error loading community members:', error);
        container.innerHTML = '<div class="error-message">Error loading members</div>';
    }
}


// Delete file function
async function deleteFile(fileId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
        const response = await fetch('/api/delete-file', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, userId: currentUser.id })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete file');
        }

        console.log(`File "${title}" deleted successfully`);
        alert(`File "${title}" deleted successfully!`);
        await loadUserFiles();
        await loadAllFiles();
        if (currentCommunityId) {
            await loadCommunityFiles(currentCommunityId);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file: ' + error.message);
    }
}