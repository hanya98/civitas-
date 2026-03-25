'use strict';

/* ================================================================
   PGMS 2.0 — ADMIN DASHBOARD SCRIPT
   Complaints + AI Assignment tracking
================================================================ */

/* ── STATE ── */
let complaints = [];
let allAssignments = [];   // flat list: { ...assignment, complaintId, complaintTitle }
let sortCol = 'submittedAt';
let sortDir = 'desc';
let activeId = null;
let toastTimer = null;
let unsubscribe = null;
let activeTab = 'complaints';
let auditTarget = null;   // assignment being viewed in audit modal
let reassignTarget = null;   // assignment being reassigned

/* ── HELPERS ── */
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN');
}
function daysLeft(deadlineIso) {
  if (!deadlineIso) return null;
  const diff = new Date(deadlineIso) - new Date();
  return Math.ceil(diff / 86400000);
}
function roleClass(role) {
  return 'role-' + (role || '').replace(/\s+/g, '');
}
function statusClass(status) {
  return 'astatus-' + (status || 'Assigned').replace(/\s+/g, '');
}

/* ── TOAST ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── BADGE HTML ── */
function priorityBadgeHTML(priority, reason, setBy) {
  const cls = { High: 'priority-High', Medium: 'priority-Medium', Low: 'priority-Low' }[priority] || 'priority-Low';
  const icon = setBy === 'Admin' ? '✏️' : '🤖';
  const byLabel = setBy === 'Admin' ? 'Set by Admin' : 'AI assessed';
  const tooltip = reason ? `${icon} ${byLabel}: ${reason}` : `${icon} ${byLabel}`;
  return `<span class="badge-priority ${cls}" data-tooltip="${tooltip.replace(/"/g, '&quot;')}" tabindex="0">
    <span class="dot"></span>${priority}
    <span class="priority-info-icon">${icon}</span>
  </span>`;
}
function statusBadgeHTML(status) {
  const key = (status || '').replace(/\s+/g, '');
  const cls = { Pending: 'status-Pending', InReview: 'status-InReview', Resolved: 'status-Resolved', Rejected: 'status-Rejected' }[key] || 'status-Pending';
  return `<span class="badge-status ${cls}">${status}</span>`;
}

/* ══════════════════════════════════════════════════════════════
   COMPLAINTS TAB
══════════════════════════════════════════════════════════════ */

function renderStats() {
  document.getElementById('stat-total').textContent = complaints.length;
  document.getElementById('stat-pending').textContent = complaints.filter(c => c.status === 'Pending').length;
  document.getElementById('stat-high').textContent = complaints.filter(c => c.priority === 'High').length;
  document.getElementById('stat-resolved').textContent = complaints.filter(c => c.status === 'Resolved').length;
  document.getElementById('tab-complaints-count').textContent = complaints.length;
}

function getFiltered() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  const fCat = document.getElementById('filter-cat').value;
  const fPri = document.getElementById('filter-pri').value;
  const fStatus = document.getElementById('filter-status').value;
  let result = complaints.filter(c => {
    if (q) {
      const hay = [c.id, c.fullName, c.title, c.city, c.district, c.mobile, c.categoryName, c.status].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (fCat && c.category !== fCat) return false;
    if (fPri && c.priority !== fPri) return false;
    if (fStatus && c.status !== fStatus) return false;
    return true;
  });
  result.sort((a, b) => {
    const av = String(a[sortCol] || '').toLowerCase();
    const bv = String(b[sortCol] || '').toLowerCase();
    const d = sortDir === 'asc' ? 1 : -1;
    return av < bv ? -d : av > bv ? d : 0;
  });
  return result;
}

function renderTable() {
  const filtered = getFiltered();
  const tbody = document.getElementById('table-body');
  const emptyEl = document.getElementById('empty-state');
  const table = document.getElementById('complaints-table');
  const count = document.getElementById('results-count');

  count.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${complaints.length}</strong> complaint${complaints.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    table.style.display = 'none';
    emptyEl.style.display = 'block';
    document.getElementById('empty-title').textContent = complaints.length === 0 ? 'No complaints submitted yet' : 'No results match your filters';
    document.getElementById('empty-sub').textContent = complaints.length === 0 ? 'Submit a grievance from the Citizen Portal.' : 'Try adjusting search or filters.';
    return;
  }

  table.style.display = '';
  emptyEl.style.display = 'none';

  tbody.innerHTML = filtered.map(c => {
    const parts = c.id ? c.id.split('/') : [];
    const shortId = parts.length >= 5
      ? parts.slice(0, 3).join('/') + '/…/' + parts[parts.length - 1]
      : (c.id || '—');
    const dateStr = c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
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

/* ── SORT ── */
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', function () {
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
document.getElementById('search-input').addEventListener('input', function () {
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
  ['filter-cat', 'filter-pri', 'filter-status'].forEach(id => document.getElementById(id).value = '');
  renderTable();
});

/* ── VIEW BTN ── */
document.getElementById('table-body').addEventListener('click', e => {
  const btn = e.target.closest('.view-btn');
  if (btn) openModal(btn.getAttribute('data-id'));
});

/* ══════════════════════════════════════════════════════════════
   COMPLAINT DETAIL MODAL
══════════════════════════════════════════════════════════════ */
function openModal(id) {
  const c = complaints.find(x => x.id === id);
  if (!c) return;
  activeId = id;

  document.getElementById('modal-id').textContent = c.id;
  document.getElementById('modal-priority-badge').innerHTML = priorityBadgeHTML(c.priority, c.priorityReason, c.prioritySetBy);
  document.getElementById('modal-status-badge').innerHTML = statusBadgeHTML(c.status);
  document.getElementById('modal-date').textContent = c.submittedAt ? new Date(c.submittedAt).toLocaleString('en-IN') : '—';
  document.getElementById('modal-status-select').value = c.status;
  document.getElementById('modal-priority-select').value = c.priority || 'Medium';

  const reasonEl = document.getElementById('modal-priority-reason');
  if (reasonEl) {
    const setBy = c.prioritySetBy === 'Admin' ? '✏️ Set by Admin' : '🤖 AI assessed';
    reasonEl.innerHTML = c.priorityReason
      ? `<span style="font-size:11px;color:#718096">${setBy}: ${esc(c.priorityReason)}</span>`
      : `<span style="font-size:11px;color:#718096">🤖 AI assessed</span>`;
  }

  const body = document.getElementById('modal-body');
  body.innerHTML =
    section('Citizen Information', row('Full Name', c.fullName) + row('Mobile', c.mobile) + row('Email', c.email)) +
    section('Location', row('State', c.state) + row('District', c.district) + row('City', c.city) + row('Pincode', c.pincode) + row('Locality', c.locality) + row('Landmark', c.landmark)) +
    section('Grievance Details',
      row('Category', c.categoryName) + row('Department', c.department) +
      row('Incident Date', c.incidentDate) +
      row('Still Unresolved', c.stillUnresolved === 'Yes' || c.stillUnresolved === 'yes' ? 'Yes' : 'No') +
      row('Reported Before', c.reportedBefore === 'Yes' || c.reportedBefore === 'yes' ? 'Yes' : 'No') +
      row('Times Previously Reported', c.timesReported > 0 ? `${c.timesReported} time(s)` : 'First complaint') +
      row('Photos Attached', c.photoCount > 0 ? `${c.photoCount} photo(s)` : 'None')) +
    `<div style="margin-bottom:16px">
       <div class="modal-row-label">Grievance Title</div>
       <div class="modal-row-val" style="font-size:14px;font-weight:600">${esc(c.title || '—')}</div>
     </div>
     <div>
       <div class="modal-row-label">Description</div>
       <div class="modal-desc-box">${esc(c.description || '—')}</div>
     </div>`;

  // Load assignments for this complaint
  loadModalAssignments(id);

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-save-btn').disabled = false;
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
}

function section(title, content) {
  return `<div class="modal-section"><div class="modal-section-title">${title}</div><div class="modal-grid">${content}</div></div>`;
}
function row(label, val) {
  return `<div class="modal-row"><div class="modal-row-label">${label}</div><div class="modal-row-val">${esc(val || '—')}</div></div>`;
}

async function loadModalAssignments(complaintId) {
  const listEl = document.getElementById('modal-assign-list');
  listEl.innerHTML = '<div class="assign-loading"><span class="loading-dot"></span> Loading…</div>';
  try {
    const docId = complaintId.replace(/\//g, '_');
    const snap = await window.db.collection('complaints').doc(docId).collection('assignments').get();
    if (snap.empty) {
      listEl.innerHTML = '<div style="font-size:12px;color:#718096;padding:6px 0">No assignments yet for this complaint.</div>';
      return;
    }
    listEl.innerHTML = snap.docs.map(d => {
      const a = d.data();
      const dl = daysLeft(a.deadlineDate);
      const dlTxt = dl === null ? '—' : dl < 0 ? `<span style="color:#c0392b">${Math.abs(dl)}d overdue</span>` : `${dl}d left`;
      return `<div class="modal-assign-row">
        <span class="modal-assign-role ${roleClass(a.role)}">${esc(a.role)}</span>
        <div style="flex:1">
          <div class="modal-assign-name">${esc(a.name)}</div>
          <div class="modal-assign-dept">${esc(a.department)}</div>
        </div>
        <span class="modal-assign-status ${statusClass(a.status)}">${esc(a.status)}</span>
        <span class="modal-assign-pct">${a.progress || 0}%</span>
        <span style="font-size:11px;color:#718096;min-width:70px;text-align:right">${dlTxt}</span>
      </div>`;
    }).join('');
  } catch (e) {
    listEl.innerHTML = '<div style="font-size:12px;color:#718096">Could not load assignments.</div>';
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  activeId = null;
}
document.getElementById('modal-close-top').addEventListener('click', closeModal);
document.getElementById('modal-close-bottom').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

/* ── SAVE CHANGES ── */
document.getElementById('modal-save-btn').addEventListener('click', async function () {
  if (!activeId) return;
  const newStatus = document.getElementById('modal-status-select').value;
  const newPriority = document.getElementById('modal-priority-select').value;
  const current = complaints.find(c => c.id === activeId);
  const oldPriority = current?.priority;

  this.disabled = true;
  this.textContent = 'Saving…';

  try {
    const docId = activeId.replace(/\//g, '_');
    const update = { status: newStatus, priority: newPriority };
    if (newPriority !== oldPriority) {
      update.prioritySetBy = 'Admin';
      update.priorityReason = `Manually changed from ${oldPriority} to ${newPriority} by admin`;
    }
    await window.db.collection('complaints').doc(docId).update(update);
    complaints = complaints.map(c => c.id === activeId ? { ...c, ...update } : c);
    showToast(`✅ Saved — Status: ${newStatus}, Priority: ${newPriority}`);
    closeModal();
    renderAll();
  } catch (err) {
    console.error('Save error:', err);
    showToast('❌ Failed to save.');
    this.disabled = false;
    this.textContent = 'Save Changes';
  }
});

/* ══════════════════════════════════════════════════════════════
   ASSIGNMENTS TAB
══════════════════════════════════════════════════════════════ */

/* Load ALL assignments across all complaints */
async function loadAllAssignments() {
  allAssignments = [];
  try {
    // Get all complaints, then their assignment subcollections
    const snap = await window.db.collection('complaints').get();
    const promises = snap.docs.map(async doc => {
      const complaint = doc.data();
      const aSnap = await window.db.collection('complaints').doc(doc.id).collection('assignments').get();
      return aSnap.docs.map(ad => ({
        ...ad.data(),
        _docId: doc.id,
        _complaintId: complaint.id,
        _complaintTitle: complaint.title || '—',
        _complaintPriority: complaint.priority,
      }));
    });
    const results = await Promise.all(promises);
    allAssignments = results.flat();
  } catch (e) {
    console.error('Load assignments error:', e);
  }
  renderAssignments();
  renderAssignStats();
  document.getElementById('tab-assignments-count').textContent = allAssignments.length;
}

function getFilteredAssignments() {
  const q = (document.getElementById('assign-search')?.value || '').toLowerCase().trim();
  const fRole = document.getElementById('assign-filter-role')?.value || '';
  const fStatus = document.getElementById('assign-filter-status')?.value || '';
  return allAssignments.filter(a => {
    if (q && !([a.name, a.role, a.department, a._complaintTitle, a._complaintId].join(' ').toLowerCase()).includes(q)) return false;
    if (fRole && a.role !== fRole) return false;
    if (fStatus && a.status !== fStatus) return false;
    return true;
  });
}

function renderAssignStats() {
  const now = new Date();
  document.getElementById('astat-total').textContent = allAssignments.length;
  document.getElementById('astat-inprogress').textContent = allAssignments.filter(a => a.status === 'In Progress').length;
  document.getElementById('astat-completed').textContent = allAssignments.filter(a => a.status === 'Completed').length;
  document.getElementById('astat-overdue').textContent = allAssignments.filter(a => {
    if (a.status === 'Completed') return false;
    return a.deadlineDate && new Date(a.deadlineDate) < now;
  }).length;
}

function renderAssignments() {
  const grid = document.getElementById('assign-grid');
  const visible = getFilteredAssignments();

  if (visible.length === 0) {
    grid.innerHTML = `<div class="assign-empty" style="grid-column:1/-1">
      <div class="assign-empty-icon">👥</div>
      <div class="assign-empty-title">${allAssignments.length === 0 ? 'No assignments yet' : 'No results match filters'}</div>
      <div class="assign-empty-sub">${allAssignments.length === 0 ? 'Submit a complaint from the Citizen Portal to auto-generate assignments.' : 'Try adjusting your search or filters.'}</div>
    </div>`;
    return;
  }

  grid.innerHTML = visible.map(a => {
    const dl = daysLeft(a.deadlineDate);
    const isOverdue = dl !== null && dl < 0 && a.status !== 'Completed';
    const dlText = dl === null ? '—' : dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d left`;
    const pct = Math.min(100, Math.max(0, a.progress || 0));
    return `
    <div class="assign-card priority-${esc(a.assignPriority || 'Secondary')}" data-assign-id="${esc(a.id)}" data-doc-id="${esc(a._docId)}">
      <div class="assign-card-header">
        <span class="assign-role-badge ${roleClass(a.role)}">${esc(a.role)}</span>
        <span class="assign-status-pill ${statusClass(a.status)}">${esc(a.status)}</span>
      </div>
      <div class="assign-card-body">
        <div class="assign-officer-name">${esc(a.name)}</div>
        <div class="assign-dept">${esc(a.department)}</div>
        <div class="assign-complaint-ref" data-id="${esc(a._complaintId)}"
             title="View complaint">📋 ${esc(a._complaintId || '—')}</div>
        <div class="assign-task">${esc(a.responsibility)}</div>
        <div class="assign-meta-row">
          <div class="assign-meta-item">
            <div class="assign-meta-label">Deadline</div>
            <div class="assign-meta-val ${isOverdue ? 'overdue' : ''}">${esc(dlText)}</div>
          </div>
          <div class="assign-meta-item">
            <div class="assign-meta-label">Due Date</div>
            <div class="assign-meta-val">${fmtDate(a.deadlineDate)}</div>
          </div>
          <div class="assign-meta-item">
            <div class="assign-meta-label">Assigned By</div>
            <div class="assign-meta-val">${esc(a.assignedBy || 'AI')}</div>
          </div>
          <div class="assign-meta-item">
            <div class="assign-meta-label">Contact</div>
            <div class="assign-meta-val" style="font-size:11px">${esc(a.contactEmail)}</div>
          </div>
        </div>
        <div class="assign-progress">
          <div class="assign-progress-top">
            <span class="assign-progress-lbl">Progress</span>
            <span class="assign-progress-pct">${pct}%</span>
          </div>
          <div class="assign-progress-track">
            <div class="assign-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="assign-card-footer">
        <button class="assign-action-btn btn-progress" data-action="progress">📊 Update</button>
        <button class="assign-action-btn btn-reassign" data-action="reassign">🔄 Reassign</button>
        <button class="assign-action-btn btn-escalate" data-action="escalate">🔺 Escalate</button>
        ${a.status !== 'Completed' ? `<button class="assign-action-btn btn-complete" data-action="complete">✅ Complete</button>` : ''}
        <button class="assign-action-btn btn-history" data-action="history">📋 History</button>
      </div>
    </div>`;
  }).join('');

  // Animate progress bars
  requestAnimationFrame(() => {
    grid.querySelectorAll('.assign-progress-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = w; }, 50);
    });
  });

  // Bind card actions
  grid.querySelectorAll('.assign-card').forEach(card => {
    const assignId = card.dataset.assignId;
    const docId = card.dataset.docId;
    const assign = allAssignments.find(a => a.id === assignId);
    if (!assign) return;

    // Complaint ref click → open complaint modal
    card.querySelector('.assign-complaint-ref')?.addEventListener('click', () => {
      switchTab('complaints');
      setTimeout(() => openModal(assign._complaintId), 100);
    });

    card.querySelectorAll('.assign-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'history') openAuditModal(assign);
        else if (action === 'reassign') openReassignModal(assign, docId, 'Reassigned');
        else if (action === 'escalate') openReassignModal(assign, docId, 'Escalated');
        else if (action === 'progress') openProgressUpdate(assign, docId);
        else if (action === 'complete') markComplete(assign, docId);
      });
    });
  });
}

/* ── ASSIGNMENT FILTER EVENTS ── */
document.getElementById('assign-search')?.addEventListener('input', renderAssignments);
document.getElementById('assign-filter-role')?.addEventListener('change', renderAssignments);
document.getElementById('assign-filter-status')?.addEventListener('change', renderAssignments);
document.getElementById('assign-reset-btn')?.addEventListener('click', () => {
  if (document.getElementById('assign-search')) document.getElementById('assign-search').value = '';
  if (document.getElementById('assign-filter-role')) document.getElementById('assign-filter-role').value = '';
  if (document.getElementById('assign-filter-status')) document.getElementById('assign-filter-status').value = '';
  renderAssignments();
});

/* ── MARK COMPLETE ── */
async function markComplete(assign, docId) {
  try {
    const now = new Date().toISOString();
    const histEntry = { action: 'Completed', by: 'Admin', at: now, note: 'Marked as completed by admin' };
    const history = [...(assign.history || []), histEntry];
    await window.db.collection('complaints').doc(docId)
      .collection('assignments').doc(assign.id)
      .update({ status: 'Completed', progress: 100, history });
    // Update in-memory
    const a = allAssignments.find(x => x.id === assign.id);
    if (a) { a.status = 'Completed'; a.progress = 100; a.history = history; }
    renderAssignments();
    renderAssignStats();
    showToast('✅ Assignment marked as completed');
  } catch (e) {
    showToast('❌ Failed to update. Check connection.');
  }
}

/* ══════════════════════════════════════════════════════════════
   AUDIT TRAIL MODAL
══════════════════════════════════════════════════════════════ */
function openAuditModal(assign) {
  auditTarget = assign;
  const docId = assign._docId;
  const body = document.getElementById('audit-body');
  const dl = daysLeft(assign.deadlineDate);
  const dlText = dl === null ? '—' : dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d left`;
  const pct = Math.min(100, assign.progress || 0);

  body.innerHTML = `
    <div class="audit-officer-info">
      <div class="audit-officer-name">${esc(assign.name)} — <span class="${roleClass(assign.role)}" style="font-size:12px">${esc(assign.role)}</span></div>
      <div class="audit-officer-dept">${esc(assign.department)} &bull; ${esc(assign.contactEmail)}</div>
    </div>

    <!-- Progress update form -->
    <div class="audit-update-form">
      <div class="audit-update-title">📊 Update Progress</div>
      <div class="audit-update-row">
        <div class="audit-input-wrap">
          <label class="audit-input-label">Progress % (current: ${pct}%)</label>
          <input type="number" class="audit-input" id="audit-progress-input" min="0" max="100" value="${pct}" />
        </div>
        <div class="audit-input-wrap">
          <label class="audit-input-label">Status</label>
          <select class="audit-input" id="audit-status-input">
            <option ${assign.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
            <option ${assign.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option ${assign.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option ${assign.status === 'Escalated' ? 'selected' : ''}>Escalated</option>
          </select>
        </div>
        <div class="audit-input-wrap" style="flex:2">
          <label class="audit-input-label">Note</label>
          <input type="text" class="audit-input" id="audit-note-input" placeholder="Optional update note…" />
        </div>
        <button class="audit-save-btn" id="audit-progress-save">Save</button>
      </div>
    </div>

    <!-- Timeline -->
    <div class="modal-section-title" style="margin-bottom:12px">Audit Trail</div>
    <div class="audit-timeline">
      ${(assign.history || []).slice().reverse().map(h => `
        <div class="audit-event">
          <div class="audit-dot action-${(h.action || '').replace(/\s+/g, '')}">
            ${{ Assigned: '📋', InProgress: '⏳', Completed: '✅', Escalated: '🔺', Reassigned: '🔄', Progress: '📊' }[h.action?.replace(/\s+/g, '')] || '•'}
          </div>
          <div class="audit-event-body">
            <div class="audit-event-title">${esc(h.action)}</div>
            <div class="audit-event-by">by ${esc(h.by)}</div>
            ${h.note ? `<div class="audit-event-note">${esc(h.note)}</div>` : ''}
            <div class="audit-event-time">${fmtDateTime(h.at)}</div>
          </div>
        </div>`).join('')}
    </div>`;

  // Progress save button
  document.getElementById('audit-progress-save').addEventListener('click', async function () {
    this.disabled = true;
    this.textContent = 'Saving…';
    const newPct = Math.min(100, Math.max(0, parseInt(document.getElementById('audit-progress-input').value) || 0));
    const newStatus = document.getElementById('audit-status-input').value;
    const note = document.getElementById('audit-note-input').value.trim() || `Progress updated to ${newPct}%`;
    const now = new Date().toISOString();
    const histEntry = { action: 'Progress', by: 'Admin', at: now, note };
    const history = [...(assign.history || []), histEntry];
    try {
      await window.db.collection('complaints').doc(docId)
        .collection('assignments').doc(assign.id)
        .update({ progress: newPct, status: newStatus, history });
      const a = allAssignments.find(x => x.id === assign.id);
      if (a) { a.progress = newPct; a.status = newStatus; a.history = history; assign.history = history; assign.progress = newPct; assign.status = newStatus; }
      renderAssignments();
      renderAssignStats();
      showToast(`✅ Progress updated to ${newPct}%`);
      closeAuditModal();
    } catch (e) {
      showToast('❌ Failed to save.');
      this.disabled = false;
      this.textContent = 'Save';
    }
  });

  document.getElementById('audit-modal-overlay').classList.add('open');
}

function closeAuditModal() {
  document.getElementById('audit-modal-overlay').classList.remove('open');
  auditTarget = null;
}
document.getElementById('audit-close').addEventListener('click', closeAuditModal);
document.getElementById('audit-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeAuditModal(); });

/* ══════════════════════════════════════════════════════════════
   REASSIGN / ESCALATE MODAL
══════════════════════════════════════════════════════════════ */
function openReassignModal(assign, docId, defaultAction) {
  reassignTarget = { assign, docId };
  document.getElementById('reassign-name').value = assign.name || '';
  document.getElementById('reassign-dept').value = assign.department || '';
  document.getElementById('reassign-reason').value = '';
  document.getElementById('reassign-action').value = defaultAction || 'Reassigned';
  document.getElementById('reassign-modal-overlay').classList.add('open');
}

function closeReassignModal() {
  document.getElementById('reassign-modal-overlay').classList.remove('open');
  reassignTarget = null;
}
document.getElementById('reassign-close').addEventListener('click', closeReassignModal);
document.getElementById('reassign-cancel').addEventListener('click', closeReassignModal);
document.getElementById('reassign-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeReassignModal(); });

document.getElementById('reassign-save').addEventListener('click', async function () {
  if (!reassignTarget) return;
  const { assign, docId } = reassignTarget;
  const newName = document.getElementById('reassign-name').value.trim();
  const newDept = document.getElementById('reassign-dept').value.trim();
  const reason = document.getElementById('reassign-reason').value.trim() || 'Reassigned by admin';
  const action = document.getElementById('reassign-action').value;
  if (!newName) { showToast('Please enter a name.'); return; }

  this.disabled = true;
  this.textContent = 'Saving…';

  const now = new Date().toISOString();
  const histEntry = { action, by: 'Admin', at: now, note: `${reason}. Reassigned to: ${newName} (${newDept})` };
  const history = [...(assign.history || []), histEntry];

  try {
    await window.db.collection('complaints').doc(docId)
      .collection('assignments').doc(assign.id)
      .update({ name: newName, department: newDept, status: action === 'Escalated' ? 'Escalated' : 'Assigned', history });
    const a = allAssignments.find(x => x.id === assign.id);
    if (a) { a.name = newName; a.department = newDept; a.status = action === 'Escalated' ? 'Escalated' : 'Assigned'; a.history = history; }
    renderAssignments();
    renderAssignStats();
    showToast(`✅ ${action} to ${newName}`);
    closeReassignModal();
  } catch (e) {
    showToast('❌ Failed to save.');
    this.disabled = false;
    this.textContent = 'Save';
  }
});

/* ── SHORTCUT: open progress update directly ── */
function openProgressUpdate(assign, docId) {
  openAuditModal(assign);
}

/* ══════════════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════════════ */
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.main-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
  if (tab === 'assignments') loadAllAssignments();
}

document.querySelectorAll('.main-tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ══════════════════════════════════════════════════════════════
   FIREBASE REAL-TIME LISTENER
══════════════════════════════════════════════════════════════ */
function startRealtimeListener() {
  const countEl = document.getElementById('results-count');
  countEl.innerHTML = `<span class="loading-dot"></span> Connecting to Firebase…`;
  if (unsubscribe) unsubscribe();

  unsubscribe = window.db.collection('complaints')
    .orderBy('submittedAt', 'desc')
    .onSnapshot(
      snapshot => {
        complaints = snapshot.docs.map(doc => doc.data());
        renderAll();
        document.getElementById('tab-complaints-count').textContent = complaints.length;
        const badge = document.getElementById('realtime-indicator');
        if (badge) badge.style.display = 'inline-flex';
        // Refresh assignments tab if it's open
        if (activeTab === 'assignments') loadAllAssignments();
      },
      error => {
        console.error('Firestore error:', error);
        showFirebaseError(error);
      }
    );
}

function showFirebaseError(error) {
  document.getElementById('table-container').innerHTML = `
    <div class="error-state">
      <div class="error-box">
        <div class="error-title">⚠️ Firebase Connection Error</div>
        <div class="error-msg">
          Could not connect to Firestore. Please check:<br><br>
          • Your <strong>Firebase config</strong> in admin.html is correct<br>
          • <strong>Firestore Rules</strong> allow read/write<br>
          • Active internet connection
        </div>
        <div class="error-code">${error.code || error.message || 'Unknown error'}</div>
      </div>
    </div>`;
}

/* ── REFRESH BUTTON ── */
document.getElementById('refresh-btn').addEventListener('click', () => {
  showToast('Refreshing…');
  startRealtimeListener();
  if (activeTab === 'assignments') loadAllAssignments();
});

/* ── INIT ── */
startRealtimeListener();

/* ══════════════════════════════════════════════════════════════
   BACKFILL — Assign officers to all unassigned complaints
══════════════════════════════════════════════════════════════ */
async function backfillAssignments() {
  const btn = document.getElementById('backfill-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Assigning…';
  showToast('Finding unassigned complaints…');

  let assigned = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Check each complaint for existing assignments
    for (const complaint of complaints) {
      const docId = (complaint.id || '').replace(/\//g, '_');
      if (!docId) continue;

      // Check if assignments subcollection already exists
      const existing = await window.db
        .collection('complaints').doc(docId)
        .collection('assignments').limit(1).get();

      if (!existing.empty) {
        skipped++;
        continue; // already assigned
      }

      // Call /api/assign for this complaint
      try {
        console.log('[BACKFILL] Assigning:', complaint.id);
        const res = await fetch('/api/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaintId: complaint.id,
            category: complaint.category,
            categoryName: complaint.categoryName,
            title: complaint.title,
            description: complaint.description,
            priority: complaint.priority,
            district: complaint.district,
            state: complaint.state,
          }),
        });

        if (!res.ok) throw new Error('Server ' + res.status);
        const data = await res.json();
        console.log('[BACKFILL] Response:', data);

        const { assignments } = data;
        if (assignments && assignments.length) {
          const batch = window.db.batch();
          assignments.forEach(a => {
            const aRef = window.db
              .collection('complaints').doc(docId)
              .collection('assignments').doc(a.id);
            batch.set(aRef, a);
          });
          await batch.commit();
          assigned++;
          showToast(`✅ Assigned ${assigned} complaint(s)… (${complaints.length - skipped - assigned} remaining)`);
        }
      } catch (err) {
        console.error('[BACKFILL] Failed for', complaint.id, ':', err.message);
        failed++;
      }

      // Small delay to avoid hammering Gemini rate limits
      await new Promise(r => setTimeout(r, 800));
    }

    showToast(`✅ Done! Assigned: ${assigned} | Already had assignments: ${skipped} | Failed: ${failed}`);

    // Reload assignments tab
    await loadAllAssignments();
    if (activeTab !== 'assignments') switchTab('assignments');

  } catch (err) {
    console.error('[BACKFILL] Fatal error:', err);
    showToast('❌ Backfill failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '⚡ Assign Unassigned';
  }
}

document.getElementById('backfill-btn').addEventListener('click', backfillAssignments);

/* ================================================================
   ANALYTICS TAB
================================================================ */

let analyticsCharts = {};

function renderAnalytics() {
  if (!window.Chart) return; // Chart.js not loaded yet

  const now = new Date();
  const OVERDUE_DAYS = 30;

  // ── Count by status ──
  const statusCounts = { Pending: 0, 'In Review': 0, Resolved: 0, Rejected: 0 };
  complaints.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

  // ── Count by category ──
  const catCounts = {};
  complaints.forEach(c => { const k = c.category?.split('/')[0] || c.category || 'Other'; catCounts[k] = (catCounts[k] || 0) + 1; });

  // ── Count by priority ──
  const priCounts = { High: 0, Medium: 0, Low: 0, Unknown: 0 };
  complaints.forEach(c => { priCounts[c.priority || 'Unknown'] = (priCounts[c.priority || 'Unknown'] || 0) + 1; });

  // ── Top 5 districts ──
  const districtCounts = {};
  complaints.forEach(c => { const d = c.district || c.city || 'Unknown'; districtCounts[d] = (districtCounts[d] || 0) + 1; });
  const topDistricts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── Escalation alerts ──
  const overdueList = complaints.filter(c => {
    if (c.status === 'Resolved' || c.status === 'Rejected') return false;
    const submittedAt = c.submittedAt ? new Date(c.submittedAt) : null;
    if (!submittedAt) return false;
    return (now - submittedAt) / (1000 * 60 * 60 * 24) > OVERDUE_DAYS;
  });

  const escDiv = document.getElementById('analytics-escalation');
  if (overdueList.length > 0) {
    escDiv.innerHTML = `<div style="background:#fdf2f2;border:1.5px solid #e74c3c;border-radius:12px;padding:16px 20px;display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:1.4rem">🔺</span>
      <div>
        <div style="font-weight:700;color:#c0392b;margin-bottom:6px">Escalation Alert — ${overdueList.length} complaint(s) overdue (&gt;30 days)</div>
        <div style="font-size:0.82rem;color:#c0392b;line-height:1.6">
          ${overdueList.slice(0, 5).map(c =>
      `<div>• <strong>${(c.id || '').split('/').pop()}</strong> — ${c.title || '—'} (${c.city || '—'}, submitted: ${fmtDate(c.submittedAt)})</div>`
    ).join('')}
          ${overdueList.length > 5 ? `<div>…and ${overdueList.length - 5} more</div>` : ''}
        </div>
      </div>
    </div>`;
  } else {
    escDiv.innerHTML = `<div style="background:#e6f4ed;border:1.5px solid #006937;border-radius:12px;padding:14px 18px;font-size:0.85rem;color:#006937;font-weight:500;">✅ No escalation alerts — all complaints are within 30-day response window.</div>`;
  }

  // ── CHART: Status (Doughnut) ──
  const ctxStatus = document.getElementById('chart-status').getContext('2d');
  if (analyticsCharts.status) analyticsCharts.status.destroy();
  analyticsCharts.status = new Chart(ctxStatus, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#FF6200', '#d4770b', '#006937', '#c0392b'], borderWidth: 2 }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Noto Sans' } } } } }
  });

  // ── CHART: Category (Bar) ──
  const catLabels = Object.keys(catCounts).slice(0, 8);
  const catVals = catLabels.map(k => catCounts[k]);
  const ctxCat = document.getElementById('chart-category').getContext('2d');
  if (analyticsCharts.category) analyticsCharts.category.destroy();
  analyticsCharts.category = new Chart(ctxCat, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{ label: 'Complaints', data: catVals, backgroundColor: '#1a3a6b', borderRadius: 6 }]
    },
    options: {
      responsive: true, indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { stepSize: 1 } } }
    }
  });

  // ── CHART: Priority (Doughnut) ──
  const ctxPri = document.getElementById('chart-priority').getContext('2d');
  if (analyticsCharts.priority) analyticsCharts.priority.destroy();
  analyticsCharts.priority = new Chart(ctxPri, {
    type: 'doughnut',
    data: {
      labels: ['High', 'Medium', 'Low', 'Unknown'],
      datasets: [{ data: [priCounts.High, priCounts.Medium, priCounts.Low, priCounts.Unknown], backgroundColor: ['#c0392b', '#FF6200', '#006937', '#a0aec0'], borderWidth: 2 }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Noto Sans' } } } } }
  });

  // ── Top Districts List ──
  const distDiv = document.getElementById('top-districts-list');
  const maxDist = topDistricts[0]?.[1] || 1;
  distDiv.innerHTML = topDistricts.length === 0
    ? '<p style="color:#718096;font-size:0.85rem">No data yet</p>'
    : topDistricts.map(([name, count]) => `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px">
          <span style="font-weight:600">${name}</span><span style="color:#718096">${count} complaint${count > 1 ? 's' : ''}</span>
        </div>
        <div style="height:6px;background:#e2e8f0;border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.round((count / maxDist) * 100)}%;background:linear-gradient(90deg,#1a3a6b,#FF6200);border-radius:4px;transition:width 0.5s"></div>
        </div>
      </div>`).join('');

  // ── Worker Performance ──
  const workerMap = {};
  allAssignments.forEach(a => {
    const key = a.assignedTo || a.name || 'Unknown';
    if (!workerMap[key]) workerMap[key] = { total: 0, completed: 0 };
    workerMap[key].total++;
    if ((a.status || '').toLowerCase().includes('complet')) workerMap[key].completed++;
  });
  const perfList = document.getElementById('worker-perf-list');
  const workers = Object.entries(workerMap).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  if (workers.length === 0) {
    perfList.innerHTML = '<p style="color:#718096;font-size:0.85rem;padding:12px 0">No assignment data yet. Use ⚡ Assign Unassigned to load assignments.</p>';
  } else {
    perfList.innerHTML = workers.map(([name, d]) => {
      const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
      return `<div class="worker-perf-row">
        <div class="worker-perf-avatar">${name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}</div>
        <div class="worker-perf-info">
          <div class="worker-perf-name">${name}</div>
          <div style="height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:5px">
            <div style="height:100%;width:${pct}%;background:#006937;border-radius:3px"></div>
          </div>
        </div>
        <div class="worker-perf-stats">
          <div style="font-weight:700;color:#1a3a6b">${d.total}</div>
          <div style="font-size:0.7rem;color:#718096">assigned</div>
        </div>
      </div>`;
    }).join('');
  }
}

// Hook analytics tab rendering when tab is clicked
document.querySelectorAll('.main-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'analytics') {
      // Small delay to let DOM be visible before Chart renders
      setTimeout(renderAnalytics, 50);
    }
  });
});
