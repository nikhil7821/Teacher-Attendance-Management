// shared.js - Single source of truth for all pages
window.appData = (function() {
    const STORAGE_KEY = 'attendanceAppData';
    
    // Default data structure - EMPTY, NO STATIC DATA
    const defaultData = {
        admin: {
            id: '',
            name: '',
            role: '',
            email: '',
            phone: '',
            avatar: '',
            gender: '',
            dob: '',
            address: ''
        },
        teachers: [],  // EMPTY - no static teachers
        attendanceHistory: [],  // EMPTY - no static history
        activityLog: [],  // EMPTY - no static logs
        departments: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Computer Science"] // Keep departments as they're constants
    };
    
    // Load from localStorage or use default (which is now empty)
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;
    
    // If loading from localStorage for first time, ensure data structure is complete
    if (!data.departments) data.departments = defaultData.departments;
    if (!data.teachers) data.teachers = [];
    if (!data.attendanceHistory) data.attendanceHistory = [];
    if (!data.activityLog) data.activityLog = [];
    if (!data.admin) data.admin = defaultData.admin;
    
    // Save to localStorage
    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Trigger update events
        window.dispatchEvent(new CustomEvent('appDataUpdated', { detail: data }));
    }
    
    // Add activity log
    function addActivity(teacherId, teacherName, action) {
        if (!data.activityLog) data.activityLog = [];
        data.activityLog.unshift({
            teacherId,
            teacherName,
            action,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0]
        });
        if (data.activityLog.length > 20) data.activityLog.pop();
        save();
    }
    
    // Get next teacher ID (auto-increment)
    function getNextTeacherId() {
        if (data.teachers.length === 0) return "T001";
        
        const maxId = data.teachers.reduce((max, t) => {
            const num = parseInt(t.id.replace('T', ''));
            return num > max ? num : max;
        }, 0);
        return `T${String(maxId + 1).padStart(3, '0')}`;
    }
    
    return {
        data,
        save,
        addActivity,
        getNextTeacherId
    };
})();

// Auth check function
function checkAuth() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
}

// Logout function
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// Get status color class
function getStatusColor(status) {
    switch(status) {
        case 'Present': return 'bg-emerald-100 text-emerald-700';
        case 'Absent': return 'bg-red-100 text-red-700';
        case 'Leave': return 'bg-amber-100 text-amber-700';
        case 'Late': return 'bg-orange-100 text-orange-700';
        case 'Half Day': return 'bg-blue-100 text-blue-700';
        default: return 'bg-zinc-100 text-zinc-700';
    }
}

// Show toast message
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
    toast.className = `fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-slide-up`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl"></i>
        <span class="font-medium">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Sync teacher data with auth system
function syncTeacherDataWithAuth() {
    // Use getCurrentUser from auth.js if available
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser) return;
    
    // If current user is a teacher, update their data in teachers array
    if (currentUser.role === 'teacher' || currentUser.role === 'Teacher') {
        const teacherIndex = window.appData.data.teachers.findIndex(t => t.id === currentUser.id);
        if (teacherIndex !== -1) {
            // Update teacher info from auth
            window.appData.data.teachers[teacherIndex] = {
                ...window.appData.data.teachers[teacherIndex],
                name: currentUser.name,
                email: currentUser.email,
                profilePhoto: currentUser.avatar
            };
            window.appData.save();
        }
    }
}

// Call this on pages that need teacher data sync
document.addEventListener('DOMContentLoaded', function() {
    if (window.appData) {
        syncTeacherDataWithAuth();
    }
});