'use strict';

/* ================================================================
   PGMS 2.0 — ADMIN DASHBOARD SCRIPT
   Real-time sync with Firebase Firestore
================================================================ */

/* ── STATE ── */
let complaints   = [];
let sortCol      = 'submittedAt';
let sortDir      = 'desc';
let activeId     = null;
let toastTimer   = null;
let unsubscribe  = null;   // Firestore real-time listener handle

/* ── BADGE HTML ── */
function priorityBadgeHTML(priority, reason, setBy) {
  const cls = { High:'priority-High', Medium:'priority-Medium', Low:'priority-Low' }[priority] || 'priority-Low';
  const icon    = setBy === 'Admin' ? '✏️' : '🤖';
  const byLabel = setBy === 'Admin' ? 'Set by Admin' : 'AI assessed';
  const tooltip = reason ? `${icon} ${byLabel}: ${reason}` : `${icon} ${byLabel}`;
  // data-tooltip is read by CSS/JS for the hover card
  return `<span class="badge-priority ${cls}" data-tooltip="${tooltip.replace(/"/g,'&quot;')}" tabindex="0">
    <span class="dot"></span>${priority}
    <span class="priority-info-icon">${icon}</span>
  </span>`;
}

function statusBadgeHTML(status) {
  const key = (status || '').replace(/\s+/g,'');
  const cls = { Pending:'status-Pending', InReview:'status-InReview', Resolved:'status-Resolved', Rejected:'status-Rejected' }[key] || 'status-Pending';
  return `<span class="badge-status ${cls}">${status}</span>`;
}

/* ── ESCAPE HTML ── */
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── TOAST ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── RENDER STATS ── */
function renderStats() {
  document.getElementById('stat-total').textContent    = complaints.length;
  document.getElementById('stat-pending').textContent  = complaints.filter(c => c.status === 'Pending').length;
  document.getElementById('stat-high').textContent     = complaints.filter(c => c.priority === 'High').length;
  document.getElementById('stat-resolved').textContent = complaints.filter(c => c.status === 'Resolved').length;
}

/* ── FILTER + SORT ── */
function getFiltered() {
  const q       = document.getElementById('search-input').value.toLowerCase().trim();
  const fCat    = document.getElementById('filter-cat').value;
  const fPri    = document.getElementById('filter-pri').value;
  const fStatus = document.getElementById('filter-status').value;

  let result = complaints.filter(c => {
    if (q) {
      const hay = [c.id, c.fullName, c.title, c.city, c.district, c.mobile, c.categoryName, c.status].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (fCat    && c.category !== fCat)    return false;
    if (fPri    && c.priority !== fPri)    return false;
    if (fStatus && c.status   !== fStatus) return false;
    return true;
  });

  result.sort((a, b) => {
    const av = String(a[sortCol] || '').toLowerCase();
    const bv = String(b[sortCol] || '').toLowerCase();
    const d  = sortDir === 'asc' ? 1 : -1;
    return av < bv ? -d : av > bv ? d : 0;
  });
  return result;
}

/* ── RENDER TABLE ── */
function renderTable() {
  const filtered = getFiltered();
  const tbody    = document.getElementById('table-body');
  const emptyEl  = document.getElementById('empty-state');
  const errorEl  = document.getElementById('error-state');
  const table    = document.getElementById('complaints-table');
  const count    = document.getElementById('results-count');

  if (errorEl) errorEl.style.display = 'none';

  count.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${complaints.length}</strong> complaint${complaints.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    table.style.display = 'none';
    emptyEl.style.display = 'block';
    if (complaints.length === 0) {
      document.getElementById('empty-title').textContent = 'No complaints submitted yet';
      document.getElementById('empty-sub').textContent   = 'Submit a grievance from the Citizen Portal — it will appear here in real-time.';
    } else {
      document.getElementById('empty-title').textContent = 'No results match your filters';
      document.getElementById('empty-sub').textContent   = 'Try adjusting the search or filter criteria.';
    }
    return;
  }

  table.style.display  = '';
  emptyEl.style.display = 'none';

  tbody.innerHTML = filtered.map(c => {
    const parts   = c.id ? c.id.split('/') : [];
    const shortId = parts.length >= 5
      ? parts.slice(0,3).join('/') + '/\u2026/' + parts[parts.length-1]
      : (c.id || '—');
    const dateStr = c.submittedAt
      ? new Date(c.submittedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
      : '—';
    const loc = [c.city, c.district].filter(Boolean).join(', ');
    return `<tr>
      <td><div class="td-id" title="${esc(c.id)}">${esc(shortId)}</div></td>
      <td class="td-date">${dateStr}</td>
      <td><div class="td-name">${esc(c.fullName)}</div><div class="td-mobile">${esc(c.mobile)}</div></td>
      <td class="td-cat">${esc(c.categoryName || c.category)}</td>
      <td class="td-loc">${esc(loc)}</td>
      <td>${priorityBadgeHTML(c.priority, c.priorityReason, c.prioritySetBy)}</td>
      <td>${statusBadgeHTML(c.status)}</td>
      <td style="text-align:center"><button class="view-btn" data-id="${esc(c.id)}">View</button></td>
    </tr>`;
  }).join('');
}

function renderAll() {
  renderStats();
  renderTable();
}

/* ── SORT HEADERS ── */
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', function() {
    const col = this.getAttribute('data-col');
    if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortCol = col; sortDir = 'desc'; }
    document.querySelectorAll('th.sortable').forEach(t => {
      t.classList.remove('sort-active');
      const icon = t.querySelector('.sort-icon');
      if (icon) icon.textContent = '↕';
    });
    this.classList.add('sort-active');
    const myIcon = this.querySelector('.sort-icon');
    if (myIcon) myIcon.textContent = sortDir === 'asc' ? '↑' : '↓';
    renderTable();
  });
});

/* ── FILTERS ── */
document.getElementById('search-input').addEventListener('input', function() {
  document.getElementById('search-clear').style.display = this.value ? 'block' : 'none';
  renderTable();
});
document.getElementById('search-clear').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').style.display = 'none';
  renderTable();
});
document.getElementById('filter-cat').addEventListener('change', renderTable);
document.getElementById('filter-pri').addEventListener('change', renderTable);
document.getElementById('filter-status').addEventListener('change', renderTable);
document.getElementById('reset-btn').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').style.display = 'none';
  document.getElementById('filter-cat').value    = '';
  document.getElementById('filter-pri').value    = '';
  document.getElementById('filter-status').value = '';
  renderTable();
});

/* ── VIEW BUTTON ── */
document.getElementById('table-body').addEventListener('click', e => {
  const btn = e.target.closest('.view-btn');
  if (btn) openModal(btn.getAttribute('data-id'));
});

/* ── MODAL ── */
function openModal(id) {
  const c = complaints.find(x => x.id === id);
  if (!c) return;
  activeId = id;

  document.getElementById('modal-id').textContent = c.id;
  document.getElementById('modal-priority-badge').innerHTML = priorityBadgeHTML(c.priority, c.priorityReason, c.prioritySetBy);
  document.getElementById('modal-status-badge').innerHTML   = statusBadgeHTML(c.status);
  document.getElementById('modal-date').textContent = c.submittedAt ? new Date(c.submittedAt).toLocaleString('en-IN') : '—';
  document.getElementById('modal-status-select').value   = c.status;
  document.getElementById('modal-priority-select').value = c.priority || 'Medium';

  // Show AI reason if available
  const reasonEl = document.getElementById('modal-priority-reason');
  if (reasonEl) {
    const setBy = c.prioritySetBy === 'Admin' ? '✏️ Set by Admin' : '🤖 AI assessed';
    reasonEl.innerHTML = c.priorityReason
      ? `<span style="font-size:11px;color:#718096">${setBy}: ${c.priorityReason}</span>`
      : `<span style="font-size:11px;color:#718096">🤖 AI assessed</span>`;
  }

  const body = document.getElementById('modal-body');
  body.innerHTML =
    section('Citizen Information',
      row('Full Name', c.fullName) + row('Mobile', c.mobile) + row('Email', c.email)) +
    section('Location',
      row('State', c.state) + row('District', c.district) + row('City', c.city) +
      row('Pincode', c.pincode) + row('Locality', c.locality) + row('Landmark', c.landmark)) +
    section('Grievance Details',
      row('Category', c.categoryName) + row('Department', c.department) +
      row('Incident Date', c.incidentDate) +
      row('Still Unresolved', c.stillUnresolved === 'Yes' || c.stillUnresolved === 'yes' ? 'Yes' : 'No') +
      row('Reported Before',  c.reportedBefore  === 'Yes' || c.reportedBefore  === 'yes' ? 'Yes' : 'No') +
      row('Times Previously Reported', c.timesReported > 0 ? `${c.timesReported} time(s)` : 'First complaint') +
      row('Photos Attached',  c.photoCount > 0 ? `${c.photoCount} photo(s)` : 'None')) +
    `<div style="margin-bottom:16px">
       <div class="modal-row-label">Grievance Title</div>
       <div class="modal-row-val" style="font-size:14px;font-weight:600">${esc(c.title||'—')}</div>
     </div>
     <div>
       <div class="modal-row-label">Description</div>
       <div class="modal-desc-box">${esc(c.description||'—')}</div>
     </div>`;

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-save-btn').disabled = false;
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
}

function section(title, content) {
  return `<div class="modal-section"><div class="modal-section-title">${title}</div><div class="modal-grid">${content}</div></div>`;
}
function row(label, val) {
  return `<div class="modal-row"><div class="modal-row-label">${label}</div><div class="modal-row-val">${esc(val||'—')}</div></div>`;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  activeId = null;
}

document.getElementById('modal-close-top').addEventListener('click', closeModal);
document.getElementById('modal-close-bottom').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

document.getElementById('modal-save-btn').addEventListener('click', async function() {
  if (!activeId) return;
  const newStatus   = document.getElementById('modal-status-select').value;
  const newPriority = document.getElementById('modal-priority-select').value;

  const current = complaints.find(c => c.id === activeId);
  const oldPriority = current?.priority;

  this.disabled    = true;
  this.textContent = 'Saving…';

  try {
    const docId  = activeId.replace(/\//g,'_');
    const update = { status: newStatus, priority: newPriority };

    // If admin changed priority, note that it was manually overridden
    if (newPriority !== oldPriority) {
      update.prioritySetBy  = 'Admin';
      update.priorityReason = `Manually changed from ${oldPriority} to ${newPriority} by admin`;
    }

    await window.db.collection('complaints').doc(docId).update(update);
    complaints = complaints.map(c => c.id === activeId ? { ...c, ...update } : c);
    showToast(`✅ Saved — Status: ${newStatus}, Priority: ${newPriority}`);
    closeModal();
    renderAll();
  } catch(err) {
    console.error('Save error:', err);
    showToast('❌ Failed to save. Check connection.');
    this.disabled    = false;
    this.textContent = 'Save Changes';
  }
});

/* ── FIREBASE REAL-TIME LISTENER ── */
function startRealtimeListener() {
  const countEl = document.getElementById('results-count');

  // Show loading
  countEl.innerHTML = `<span class="loading-dot"></span> Connecting to Firebase…`;

  // Stop any previous listener
  if (unsubscribe) unsubscribe();

  unsubscribe = window.db.collection('complaints')
    .orderBy('submittedAt', 'desc')
    .onSnapshot(
      snapshot => {
        complaints = snapshot.docs.map(doc => doc.data());
        renderAll();

        // Show real-time badge
        const badge = document.getElementById('realtime-indicator');
        if (badge) badge.style.display = 'inline-flex';
      },
      error => {
        console.error('Firestore listener error:', error);
        showFirebaseError(error);
      }
    );
}

function showFirebaseError(error) {
  const container = document.getElementById('table-container');
  container.innerHTML = `
    <div class="error-state">
      <div class="error-box">
        <div class="error-title">⚠️ Firebase Connection Error</div>
        <div class="error-msg">
          Could not connect to Firestore. Please check:<br><br>
          • Your <strong>Firebase config</strong> in admin-dashboard.html is correct<br>
          • Your <strong>Firestore Rules</strong> allow read/write access<br>
          • You have an <strong>active internet connection</strong>
        </div>
        <div class="error-code">${error.code || error.message || 'Unknown error'}</div>
      </div>
    </div>`;
}

/* ── REFRESH BUTTON ── */
document.getElementById('refresh-btn').addEventListener('click', () => {
  showToast('Refreshing data…');
  startRealtimeListener();
});

/* ── INIT ── */
startRealtimeListener();