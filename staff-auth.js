const API_URL = window.RADIANT_SMILES_API_URL;

function getToken() {
  return localStorage.getItem('dental_staff_token');
}

function setToken(token) {
  localStorage.setItem('dental_staff_token', token);
}

function clearToken() {
  localStorage.removeItem('dental_staff_token');
}

function isAuthenticated() {
  return !!getToken();
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('staffUsername').value.trim();
  const password = document.getElementById('staffPassword').value;
  const messageEl = document.getElementById('loginMessage');

  if (!username || !password) {
    messageEl.textContent = 'Please enter both username and password.';
    messageEl.className = 'message error';
    messageEl.style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      messageEl.textContent = data.error || 'Login failed.';
      messageEl.className = 'message error';
      messageEl.style.display = 'block';
      return;
    }

    setToken(data.token);
    messageEl.textContent = 'Login successful! Redirecting...';
    messageEl.className = 'message success';
    messageEl.style.display = 'block';
    
    setTimeout(() => {
      window.location.href = 'staff-dashboard.html';
    }, 1000);
  } catch (err) {
    console.error('Login error:', err);
    messageEl.textContent = 'Network error. Please try again.';
    messageEl.className = 'message error';
    messageEl.style.display = 'block';
  }
}

async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
  clearToken();
  window.location.href = 'staff-login.html';
}

function checkAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'staff-login.html';
  }
}

// Handle login form if on login page
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}
