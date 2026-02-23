// auth.js - Authentication and Role Management

// Initialize users in localStorage if not exists
if (!localStorage.getItem('users')) {
    // Start with EMPTY users array - NO STATIC DATA
    localStorage.setItem('users', JSON.stringify([]));
}

// Get all users from localStorage
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Register new user (called when adding staff)
function registerUser(userData) {
    try {
        const users = getAllUsers();
        
        // Check if username already exists
        const existingUser = users.find(u => u.username === userData.username);
        if (existingUser) {
            console.log('Username already exists:', userData.username);
            return false;
        }
        
        const newUser = {
            id: userData.id,
            username: userData.username,
            password: userData.password,
            role: userData.role.toLowerCase(),
            name: userData.name,
            email: userData.email,
            department: userData.department,
            avatar: userData.profilePhoto || `https://i.pravatar.cc/128?u=${userData.id}`
        };
        
        users.push(newUser);
        saveUsers(users);
        console.log('User registered successfully:', newUser);
        return newUser;
    } catch (error) {
        console.error('Error registering user:', error);
        return false;
    }
}

// Check authentication on page load
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (isLoggedIn !== 'true') {
        if (currentPage !== 'index.html') {
            window.location.href = 'index.html';
        }
        return false;
    }
    
    // Role-based access control
    const user = getCurrentUser();
    if (user) {
        // Admin has access to all pages
        if (user.role === 'admin') {
            return true;
        }
        
        // Non-admin users (teacher/accountant) can ONLY access attendance.html
        const allowedPages = ['attendance.html', 'index.html'];
        if (!allowedPages.includes(currentPage)) {
            window.location.href = 'attendance.html';
            return false;
        }
    }
    
    return true;
}

// Get current logged in user
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if current user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'Admin');
}

// Get current teacher ID (for filtering)
function getCurrentTeacherId() {
    const user = getCurrentUser();
    return user ? user.id : null;
}

// Filter teachers based on role (for attendance page)
function filterTeachersByRole(teachers) {
    const user = getCurrentUser();
    if (!user) return [];
    
    if (user.role === 'admin' || user.role === 'Admin') {
        return teachers; // Admin sees all teachers
    } else {
        // Teacher/accountant sees only their own record
        return teachers.filter(t => t.id === user.id);
    }
}

// Login function
function login(username, password) {
    const users = getAllUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Remove password before storing in session
        const { password, ...userWithoutPassword } = user;
        
        // Normalize role to lowercase for consistency
        userWithoutPassword.role = userWithoutPassword.role.toLowerCase();
        
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('user', JSON.stringify(userWithoutPassword));
        
        // Update shared.js admin data if needed
        if (window.appData && userWithoutPassword.role === 'admin') {
            window.appData.data.admin = {
                id: user.id,
                name: user.name,
                role: 'Super Admin',
                email: user.email,
                avatar: user.avatar
            };
            window.appData.save();
        }
        
        // Redirect based on role
        if (userWithoutPassword.role === 'admin') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'attendance.html';
        }
        
        return true;
    }
    return false;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// Update header with user info
function updateHeaderWithUser() {
    const user = getCurrentUser();
    if (!user) return;
    
    const nameEl = document.getElementById('header-name');
    const roleEl = document.getElementById('header-role');
    const avatarEl = document.getElementById('header-avatar');
    
    if (nameEl) {
        nameEl.textContent = user.name || 'User';
    }
    if (roleEl) {
        let roleDisplay = user.role;
        if (user.role === 'admin' || user.role === 'Admin') roleDisplay = 'Administrator';
        else if (user.role === 'teacher' || user.role === 'Teacher') roleDisplay = 'Teacher';
        else if (user.role === 'accountant' || user.role === 'Accountant') roleDisplay = 'Accountant';
        roleEl.textContent = roleDisplay;
    }
    if (avatarEl) {
        avatarEl.src = user.avatar || 'https://i.pravatar.cc/128?u=' + user.id;
    }
}

// Handle sidebar visibility based on role
function setupSidebarByRole() {
    const user = getCurrentUser();
    
    if (user && (user.role === 'admin' || user.role === 'Admin')) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'flex';
            el.style.visibility = 'visible';
            el.classList.remove('hidden');
        });
    } else {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
            el.classList.add('hidden');
        });
    }
}

// Run on every page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    updateHeaderWithUser();
    setupSidebarByRole();
});

// Also run after page load
window.addEventListener('load', function() {
    setupSidebarByRole();
});

// Run after delays to be safe
setTimeout(setupSidebarByRole, 100);
setTimeout(setupSidebarByRole, 500);