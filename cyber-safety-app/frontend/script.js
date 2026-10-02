/**
 * Cyber Safety Incident Reporting Portal - Client Controller
 */

// Dynamically determine backend API base URL
const API_BASE = window.location.origin.includes(':3000') || window.location.origin.includes(':5000')
  ? ''
  : ''; // Same origin proxy or relative path

let currentAdminKey = '';

document.addEventListener('DOMContentLoaded', () => {
  setupIncidentForm();
  setupTrackingForm();
  setupAdminSection();
  setDefaultDate();
});

function setDefaultDate() {
  const dateInput = document.getElementById('incident_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
}

// -----------------------------------------------------------------------------
// 1. Complaint Submission Handling
// -----------------------------------------------------------------------------
function setupIncidentForm() {
  const form = document.getElementById('complaintForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const alertBanner = document.getElementById('alertBanner');
  const formContainer = document.getElementById('formContainer');
  const successCard = document.getElementById('successCard');
  const displayComplaintId = document.getElementById('displayComplaintId');
  const returnHomeBtn = document.getElementById('returnHomeBtn');
  const trackThisBtn = document.getElementById('trackThisBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const category = document.getElementById('category').value;
    const subject = document.getElementById('subject').value.trim();
    const incidentDate = document.getElementById('incident_date').value;
    const description = document.getElementById('description').value.trim();
    const evidence = document.getElementById('evidence').value.trim();

    // Client-Side Validation
    let hasError = false;

    if (!name) {
      showFieldError('nameError', 'Please enter your full legal name.');
      hasError = true;
    }

    if (!email || !isValidEmail(email)) {
      showFieldError('emailError', 'Please enter a valid email address.');
      hasError = true;
    }

    if (!phone || !isValidPhone(phone)) {
      showFieldError('phoneError', 'Please enter a valid contact phone number.');
      hasError = true;
    }

    if (!category) {
      showFieldError('categoryError', 'Please select a cyber issue category.');
      hasError = true;
    }

    if (!subject) {
      showFieldError('subjectError', 'Please enter a brief subject headline.');
      hasError = true;
    }

    if (!incidentDate) {
      showFieldError('dateError', 'Please select the incident date.');
      hasError = true;
    }

    if (!description || description.length < 15) {
      showFieldError('descriptionError', 'Please provide at least 15 characters describing the incident.');
      hasError = true;
    }

    if (hasError) {
      showAlert('Please correct the highlighted validation errors above.', 'error');
      return;
    }

    // Submit payload
    const payload = {
      name,
      email,
      phone,
      category,
      subject,
      description,
      incident_date: incidentDate,
      evidence,
    };

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      let result;
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error('Server returned unexpected response format.');
        }
      }

      if (response.ok && result.success) {
        // Display Success Screen
        formContainer.classList.add('hidden');
        successCard.classList.remove('hidden');
        displayComplaintId.textContent = result.complaint_id;

        // If email delivery had a notice, show quiet hint
        if (result.message && result.message.includes('could not be delivered')) {
          showAlert('Incident securely recorded in database (SMTP notification pending credentials).', 'info');
        } else {
          hideAlert();
        }

        form.reset();
        setDefaultDate();

        // Scroll to success card smoothly
        successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error(result.message || 'Submission was rejected by the server.');
      }
    } catch (err) {
      showAlert(err.message || 'Network error occurred while submitting your complaint.', 'error');
    } finally {
      setSubmitting(false);
    }
  });

  returnHomeBtn.addEventListener('click', () => {
    successCard.classList.add('hidden');
    formContainer.classList.remove('hidden');
    hideAlert();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  trackThisBtn.addEventListener('click', () => {
    const cid = displayComplaintId.textContent;
    const trackSection = document.getElementById('track-section');
    const trackIdInput = document.getElementById('trackId');
    if (trackIdInput) trackIdInput.value = cid;
    if (trackSection) trackSection.scrollIntoView({ behavior: 'smooth' });
  });

  function setSubmitting(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnSpinner.classList.remove('hidden');
    } else {
      btnSpinner.classList.add('hidden');
    }
  }
}

// -----------------------------------------------------------------------------
// 2. Incident Tracking Handling
// -----------------------------------------------------------------------------
function setupTrackingForm() {
  const trackForm = document.getElementById('trackForm');
  const trackResult = document.getElementById('trackResult');
  const trackSubmitBtn = document.getElementById('trackSubmitBtn');

  if (!trackForm) return;

  trackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const complaintId = document.getElementById('trackId').value.trim();
    const verificationKey = document.getElementById('trackKey').value.trim();

    if (!complaintId || !verificationKey) {
      alert('Please provide both Complaint ID and Verification Key.');
      return;
    }

    trackSubmitBtn.disabled = true;
    trackSubmitBtn.textContent = 'Verifying...';

    try {
      const response = await fetch(`${API_BASE}/api/complaints/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          verification_key: verificationKey,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (response.ok && data.success) {
        const c = data.complaint;
        trackResult.classList.remove('hidden');
        trackResult.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1rem;">
            <div>
              <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-navy); font-size: 1.1rem;">${escapeHtml(c.complaint_id)}</span>
              <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.5rem;">Filed on ${escapeHtml(c.incident_date)}</span>
            </div>
            <span class="status-badge status-${c.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(c.status)}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.8125rem; margin-bottom: 1rem;">
            <div><strong style="color: #475569;">Reporter:</strong> ${escapeHtml(c.name)}</div>
            <div><strong style="color: #475569;">Category:</strong> ${escapeHtml(c.category)}</div>
            <div><strong style="color: #475569;">Contact:</strong> ${escapeHtml(c.phone)}</div>
          </div>

          <div style="font-size: 0.8125rem; margin-bottom: 0.75rem;">
            <strong style="color: #475569;">Subject:</strong> ${escapeHtml(c.subject)}
          </div>

          <div style="font-size: 0.8125rem; background: #fff; padding: 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.5;">
            ${escapeHtml(c.description)}
          </div>

          ${c.evidence ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 0.75rem;"><strong>Evidence Notes:</strong> ${escapeHtml(c.evidence)}</div>` : ''}
        `;
      } else {
        trackResult.classList.remove('hidden');
        trackResult.innerHTML = `
          <div style="color: var(--color-danger); font-size: 0.875rem;">
            ✕ ${escapeHtml(data.message || 'No matching complaint record found. Please verify details.')}
          </div>
        `;
      }
    } catch (err) {
      trackResult.classList.remove('hidden');
      trackResult.innerHTML = `<div style="color: var(--color-danger); font-size: 0.875rem;">Network request failed.</div>`;
    } finally {
      trackSubmitBtn.disabled = false;
      trackSubmitBtn.textContent = 'Verify & Track Status';
    }
  });
}

// -----------------------------------------------------------------------------
// 3. Admin SOC Section Handling
// -----------------------------------------------------------------------------
function setupAdminSection() {
  const adminApiKeyInput = document.getElementById('adminApiKey');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminAuthBlock = document.getElementById('adminAuthBlock');
  const adminPanel = document.getElementById('adminPanel');
  const adminRefreshBtn = document.getElementById('adminRefreshBtn');
  const adminStatusFilter = document.getElementById('adminStatusFilter');
  const adminSearchInput = document.getElementById('adminSearchInput');

  if (!adminLoginBtn) return;

  adminLoginBtn.addEventListener('click', async () => {
    const key = adminApiKeyInput.value.trim() || 'admin_secret_key_12345';
    currentAdminKey = key;
    loadAdminComplaints();
  });

  adminRefreshBtn?.addEventListener('click', loadAdminComplaints);
  adminStatusFilter?.addEventListener('change', loadAdminComplaints);
  adminSearchInput?.addEventListener('input', debounce(loadAdminComplaints, 300));

  async function loadAdminComplaints() {
    const tableBody = document.getElementById('complaintsTableBody');
    const statusVal = adminStatusFilter?.value || 'all';
    const searchVal = adminSearchInput?.value.trim() || '';

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading incidents...</td></tr>`;

    try {
      const url = `${API_BASE}/api/complaints?status=${encodeURIComponent(statusVal)}&search=${encodeURIComponent(searchVal)}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${currentAdminKey}` },
      });

      if (res.status === 401) {
        alert('Invalid Admin Key.');
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        adminAuthBlock.classList.add('hidden');
        adminPanel.classList.remove('hidden');

        if (data.complaints.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No complaints recorded yet.</td></tr>`;
          return;
        }

        tableBody.innerHTML = data.complaints.map(c => `
          <tr>
            <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-navy);">${escapeHtml(c.complaint_id)}</td>
            <td><strong>${escapeHtml(c.name)}</strong><br><span style="color: #64748b; font-size: 0.75rem;">${escapeHtml(c.email)}</span></td>
            <td>${escapeHtml(c.category)}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.subject)}</td>
            <td style="font-size: 0.75rem; color: #64748b;">${escapeHtml(c.incident_date)}</td>
            <td>
              <select onchange="updateComplaintStatus('${c.complaint_id}', this.value)" style="padding: 2px 6px; font-size: 0.75rem; border-radius: 4px;">
                <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Under Review" ${c.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              </select>
            </td>
            <td>
              <button type="button" class="btn btn-outline btn-sm" onclick="alert('Incident Narrative:\\n\\n${escapeJsString(c.description)}')">View</button>
            </td>
          </tr>
        `).join('');
      } else {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--color-danger);">${escapeHtml(data.message || 'Failed to load records.')}</td></tr>`;
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--color-danger);">Network failure loading admin data.</td></tr>`;
    }
  }
}

// Global status update function for table select
window.updateComplaintStatus = async function(complaintId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAdminKey}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      // Status updated successfully
    } else {
      alert(data.message || 'Failed to update status.');
    }
  } catch {
    alert('Network error while updating status.');
  }
};

// -----------------------------------------------------------------------------
// Helper Utilities
// -----------------------------------------------------------------------------
function showFieldError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  }
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}

function showAlert(message, type) {
  const banner = document.getElementById('alertBanner');
  if (banner) {
    banner.className = `alert-banner ${type}`;
    banner.textContent = message;
    banner.classList.remove('hidden');
  }
}

function hideAlert() {
  const banner = document.getElementById('alertBanner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const clean = phone.replace(/[\s\-\+\(\)]/g, '');
  return clean.length >= 7 && clean.length <= 15 && /^\d+$/.test(clean);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
