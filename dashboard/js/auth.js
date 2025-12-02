// Authentication Functions

function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        window.location.href = '../login/index.html';
        return false;
    }
    
    currentUser = { id: userId, token: token };
    loadUserData();
    return true;
}

function loadUserData() {
    const userName = localStorage.getItem('userName') || 'User';
    document.getElementById('userInitials').textContent = userName.charAt(0).toUpperCase();
    loadBoards();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        window.location.href = '../login/index.html';
    }
}

// Initialize on load
if (checkAuth()) {
    console.log('User authenticated');
}