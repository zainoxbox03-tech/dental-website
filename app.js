const API_URL = window.RADIANT_SMILES_API_URL;

function getAuthHeader() {
  return {
    'Content-Type': 'application/json',
  };
}

function setMessage(elementId, message, type = 'info') {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message;
  element.className = `message ${type}`;
}

function clearMessage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = '';
  element.className = 'message';
}

async function renderPatientOptions() {
  const select = document.getElementById('patientSelect');
  if (!select) return;

  try {
    const response = await fetch(`${API_URL}/patients`);
    
    if (!response.ok) {
      select.innerHTML = '<option value="">Select your email address (API unavailable)</option>';
      return;
    }

    const patients = await response.json();
    select.innerHTML = '<option value="">Select your email address</option>';
    patients.forEach((patient) => {
      const option = document.createElement('option');
      option.value = patient.email;
      option.textContent = `${patient.first_name} ${patient.last_name} — ${patient.email}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading patients:', err);
    select.innerHTML = '<option value="">Could not load patients</option>';
  }
}

async function registerPatient(event) {
  event.preventDefault();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.trim();

  if (!firstName || !lastName || !email || !phone) {
    setMessage('registerMessage', 'Please fill in all registration fields.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ firstName, lastName, email, phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Registration error:', data);
      setMessage('registerMessage', data.error || 'Registration failed.', 'error');
      return;
    }

    console.log('Registration successful:', data);
    setMessage('registerMessage', 'Registration successful! Redirecting...', 'success');
    
    // Store email in localStorage for booking page
    localStorage.setItem('patientEmail', email);
    
    setTimeout(() => {
      console.log('Redirecting to booking.html');
      const currentPath = window.location.pathname.replace(/\/$/, '');
      const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
      window.location.href = basePath + 'booking.html';
    }, 1000);
  } catch (err) {
    console.error('Registration error:', err);
    setMessage('registerMessage', 'Network error. Please try again.', 'error');
  }
}

async function bookAppointment(event) {
  event.preventDefault();
  const patientEmail = document.getElementById('patientEmail').value.trim().toLowerCase();
  const date = document.getElementById('appointmentDate').value;
  const time = document.getElementById('appointmentTime').value;
  const service = document.getElementById('serviceType').value;
  const notes = document.getElementById('notes').value.trim();

  if (!patientEmail || !date || !time || !service) {
    setMessage('bookingMessage', 'Please enter your email and complete all appointment fields.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        patientEmail,
        date,
        time,
        service,
        notes: notes || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage('bookingMessage', data.error || 'Booking failed.', 'error');
      return;
    }

    event.target.reset();
    
    const messageEl = document.getElementById('bookingMessage');
    messageEl.className = 'message success';
    messageEl.innerHTML = `
      <div style="margin-bottom: 12px;">Appointment booked successfully!</div>
      <button type="button" class="btn btn-secondary" onclick="location.reload()" style="margin-right: 8px;">Book Another</button>
      <a href="index.html" class="btn btn-secondary" style="text-decoration: none;">Back to Home</a>
    `;
  } catch (err) {
    console.error('Booking error:', err);
    setMessage(
      'bookingMessage',
      'Cannot reach the booking server. Start it with "npm start" from the backend folder, then try again.',
      'error'
    );
  }
}

function initApp() {
  const registerForm = document.getElementById('registerForm');
  const bookingForm = document.getElementById('bookingForm');

  if (registerForm) {
    registerForm.addEventListener('submit', registerPatient);
  }
  if (bookingForm) {
    bookingForm.addEventListener('submit', bookAppointment);
    
    // Auto-fill email if returning from registration
    const storedEmail = localStorage.getItem('patientEmail');
    if (storedEmail) {
      document.getElementById('patientEmail').value = storedEmail;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
