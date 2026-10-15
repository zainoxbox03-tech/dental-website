function getToken() {
  return localStorage.getItem('dental_staff_token');
}

function getAuthHeader() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

function checkAuth() {
  if (!localStorage.getItem('dental_staff_token')) {
    window.location.href = 'staff-login.html';
  }
}

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  // Show selected tab
  const tabEl = document.getElementById(tabName);
  if (tabEl) {
    tabEl.classList.add('active');
  }

  // Mark button active
  const activeBtn = document.querySelector(`button[onclick="switchTab('${tabName}')"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Load data for tab
  if (tabName === 'appointments') loadAppointments();
  if (tabName === 'patients') loadPatients();
  if (tabName === 'analytics') loadAnalytics();
  if (tabName === 'audit') loadAuditLog();
}

async function loadAppointments() {
  const tbody = document.querySelector('#appointmentsTable tbody');
  const messageEl = document.getElementById('appointmentsMessage');

  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/appointments`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) throw new Error('Failed to load appointments');

    const appointments = await response.json();
    tbody.innerHTML = '';

    if (appointments.length === 0) {
      messageEl.textContent = 'No appointments booked.';
      return;
    }

    messageEl.textContent = '';

    appointments.forEach((appt) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${appt.appointment_date}</td>
        <td>${appt.appointment_time}</td>
        <td>${appt.first_name} ${appt.last_name}</td>
        <td>${appt.email}</td>
        <td>${appt.phone || 'N/A'}</td>
        <td>${appt.service_type}</td>
        <td>${appt.notes || '—'}</td>
        <td><button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="deleteAppointment(${appt.id})">Cancel</button></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading appointments:', err);
    messageEl.textContent = 'Failed to load appointments.';
  }
}

async function deleteAppointment(id) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;

  try {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    if (!response.ok) throw new Error('Failed to delete appointment');

    loadAppointments();
  } catch (err) {
    console.error('Error deleting appointment:', err);
    alert('Failed to cancel appointment.');
  }
}

async function loadPatients() {
  const tbody = document.querySelector('#patientsTable tbody');
  const messageEl = document.getElementById('patientsMessage');

  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/patients`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) throw new Error('Failed to load patients');

    const patients = await response.json();
    tbody.innerHTML = '';

    if (patients.length === 0) {
      messageEl.textContent = 'No registered patients.';
      return;
    }

    messageEl.textContent = '';

    patients.forEach((patient) => {
      const registered = new Date(patient.created_at).toLocaleDateString();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${patient.first_name} ${patient.last_name}</td>
        <td>${patient.email}</td>
        <td>${patient.phone}</td>
        <td>${registered}</td>
        <td>—</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading patients:', err);
    messageEl.textContent = 'Failed to load patients.';
  }
}

async function loadAnalytics() {
  const cardsContainer = document.getElementById('analyticsCards');
  cardsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading...</div>';

  try {
    const response = await fetch(`${API_URL}/analytics`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) throw new Error('Failed to load analytics');

    const data = await response.json();
    cardsContainer.innerHTML = '';

    const cards = [
      { label: 'Registered Patients', value: data.totalPatients },
      { label: 'Total Appointments', value: data.totalAppointments },
      { label: 'Upcoming Appointments', value: data.upcomingAppointments },
    ];

    cards.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'summary-card';
      cardEl.innerHTML = `<h4>${card.label}</h4><p>${card.value}</p>`;
      cardsContainer.appendChild(cardEl);
    });

    // Service breakdown
    const serviceChart = document.getElementById('serviceChart');
    serviceChart.innerHTML = '';

    data.serviceBreakdown.forEach((item) => {
      const chartCard = document.createElement('div');
      chartCard.className = 'summary-card';
      chartCard.innerHTML = `<h4>${item.service_type}</h4><p>${item.count} appointments</p>`;
      serviceChart.appendChild(chartCard);
    });

    // Load upcoming appointments
    loadUpcomingAppointments();
  } catch (err) {
    console.error('Error loading analytics:', err);
    cardsContainer.innerHTML = '<div style="grid-column: 1/-1; color: #a12d2d;">Failed to load analytics.</div>';
  }
}

async function loadUpcomingAppointments() {
  const upcomingTbody = document.querySelector('#upcomingTable tbody');

  try {
    const response = await fetch(`${API_URL}/appointments`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) throw new Error('Failed to load appointments');

    const appointments = await response.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const upcomingAppts = appointments
      .filter((a) => {
        const apptDate = new Date(a.appointment_date);
        return apptDate >= today && apptDate <= weekFromNow;
      })
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    upcomingTbody.innerHTML = '';

    if (upcomingAppts.length === 0) {
      const row = upcomingTbody.insertRow();
      row.innerHTML = '<td colspan="4" style="text-align: center; color: #586173;">No appointments in the next 7 days</td>';
    } else {
      upcomingAppts.forEach((appt) => {
        const row = upcomingTbody.insertRow();
        row.innerHTML = `
          <td>${appt.appointment_date}</td>
          <td>${appt.appointment_time}</td>
          <td>${appt.first_name}</td>
          <td>${appt.service_type}</td>
        `;
      });
    }
  } catch (err) {
    console.error('Error loading upcoming appointments:', err);
  }
}

async function loadAuditLog() {
  const tbody = document.querySelector('#auditTable tbody');

  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_URL}/audit`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) throw new Error('Failed to load audit log');

    const auditLog = await response.json();
    tbody.innerHTML = '';

    if (auditLog.length === 0) {
      const row = tbody.insertRow();
      row.innerHTML = '<td colspan="4" style="text-align: center;">No audit events</td>';
      return;
    }

    auditLog.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const row = tbody.insertRow();
      row.innerHTML = `
        <td style="font-size: 0.9rem;">${timestamp}</td>
        <td><strong>${log.action}</strong></td>
        <td>${log.details}</td>
        <td>${log.staff || 'system'}</td>
      `;
    });
  } catch (err) {
    console.error('Error loading audit log:', err);
  }
}

function initDashboard() {
  checkAuth();
  const token = localStorage.getItem('dental_staff_token');
  // Decode token to get username (basic JWT decode)
  const payload = JSON.parse(atob(token.split('.')[1]));
  document.getElementById('staffUsername').textContent = `Logged in as: ${payload.username} (${payload.role})`;
  loadAppointments();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
