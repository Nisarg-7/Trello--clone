const API_BASE_URL = 'http://localhost:8000';

// Switch between login and register
function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    clearErrors();
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    clearErrors();
}

function clearErrors() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
}

// Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const btnText = document.getElementById('loginBtnText');
    const loading = document.getElementById('loginLoading');

    btnText.style.display = 'none';
    loading.style.display = 'block';
    errorDiv.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append("username", email);   // VERY IMPORTANT
        formData.append("password", password);

        const response = await fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            body: formData      // DO NOT SET HEADERS
        });

        if (response.ok) {
            const data = await response.json();

            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('userId', data.user_id);  
            localStorage.setItem('userName', data.user_name || email.split('@')[0]);  
            localStorage.setItem('userEmail', email);

            window.location.href = '../dashboard/dashboard.html';
        } else {
            const error = await response.json();
            showError('loginError', error.detail || 'Invalid email or password');
        }
    } catch (err) {
        console.error(err);
        showError('loginError', 'Something went wrong');
    } finally {
        btnText.style.display = 'inline';
        loading.style.display = 'none';
    }
}


// Register
async function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    const btnText = document.getElementById('registerBtnText');
    const loading = document.getElementById('registerLoading');

    btnText.style.display = 'none';
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email_address: email,
                password
            })
        });

        if (response.ok) {
            successDiv.textContent = 'Account created! Redirecting...';
            successDiv.style.display = 'block';
            setTimeout(() => showLogin(), 2000);
        } else {
            const error = await response.json();
            showError('registerError', error.detail || 'Registration failed');
        }
    } catch {
        successDiv.textContent = 'Demo mode: Account created.';
        successDiv.style.display = 'block';
        setTimeout(() => showLogin(), 2000);
    } finally {
        btnText.style.display = 'inline';
        loading.style.display = 'none';
    }
}

function showError(id, msg) {
    const div = document.getElementById(id);
    div.textContent = msg;
    div.style.display = 'block';
}
