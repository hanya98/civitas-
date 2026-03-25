'use strict';

/* ================================================================
   manager.js — Command Centre Manager Dashboard
   Firebase Firestore + localStorage fallback for demo
================================================================ */

/* ── DEMO WORKERS ── */
const DEMO_WORKERS = [
    { mobile: '9000000001', name: 'Ramesh Kumar', area: 'Ward 5', tasksAssigned: 3, tasksCompleted: 2, status: 'active', lastActive: '2026-03-25T10:30:00Z' },
    { mobile: '9000000002', name: 'Sunita Devi', area: 'Sector 12', tasksAssigned: 5, tasksCompleted: 4, status: 'active', lastActive: '2026-03-25T09:15:00Z' },
    { mobile: '9000000003', name: 'Amit Sharma', area: 'Zone B', tasksAssigned: 2, tasksCompleted: 2, status: 'active', lastActive: '2026-03-24T17:00:00Z' },
    { mobile: '9000000004', name: 'Priya Singh', area: 'Ward 9', tasksAssigned: 1, tasksCompleted: 0, status: 'blocked', lastActive: '2026-03-20T08:00:00Z' },
    { mobile: '9000000005', name: 'Vijay Rao', area: 'Sector 3', tasksAssigned: 4, tasksCompleted: 3, status: 'active', lastActive: '2026-03-25T11:45:00Z' },
];

/* ── STATE ── */
let allTasks = [];
let allComplaints = [];
let workers = [...DEMO_WORKERS];
let activeTab = 'tasks';
let toastTimer = null;
let blockTarget = null;

/* ── HELPERS ── */
function toast(msg) {
    const t = document.getElementById('mgr-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(task) {
    if (!task.dueDate || task.status === 'Completed') return false;
    return new Date(task.dueDate) < new Date();
}

function statusClass(status) {
    return 'tstatus-' + (status || 'Assigned').replace(/\s+/g, '');
}

function initials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ── LOAD TASKS from Firebase ── */
function loadTasks() {
    if (!window.db) return;

    // Listen for live updates from Firestore
    window.db.collection('tasks').orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
            allTasks = snap.docs.map(d => d.data());
            saveTasks(); // Sync to localStorage so offline workers have a baseline
            renderTasks();
            renderStats();
        }, err => {
            console.warn('Tasks load error:', err.message);
            // Fallback to local storage if Firebase fails or offline
            const stored = localStorage.getItem('civitas_tasks');
            if (stored) {
                allTasks = JSON.parse(stored);
                renderTasks();
                renderStats();
            }
        });
}

function saveTasks() {
    localStorage.setItem('civitas_tasks', JSON.stringify(allTasks));
}

/* ── STATS ── */
function renderStats() {
    const now = new Date();
    const total = allTasks.length;
    const inProg = allTasks.filter(t => t.status === 'In Progress').length;
    const completed = allTasks.filter(t => t.status === 'Completed').length;
    const overdue = allTasks.filter(t => isOverdue(t)).length;
    const activeWk = workers.filter(w => w.status === 'active').length;

    document.getElementById('s-total-tasks').textContent = total;
    document.getElementById('s-in-progress').textContent = inProg;
    document.getElementById('s-overdue').textContent = overdue;
    document.getElementById('s-completed').textContent = completed;
    document.getElementById('s-workers').textContent = activeWk;
    document.getElementById('tc-tasks').textContent = total;
    document.getElementById('tc-workers').textContent = workers.length;

    // Escalation banner
    const overdueItems = allTasks.filter(t => isOverdue(t));
    const banner = document.getElementById('escalation-banner');
    const msg = document.getElementById('escalation-msg');
    if (overdueItems.length > 0) {
        msg.textContent = `⚠️ ${overdueItems.length} task(s) are overdue and require immediate attention: ${overdueItems.map(t => '"' + t.title + '"').slice(0, 2).join(', ')}${overdueItems.length > 2 ? ' and more…' : ''}`;
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
}

/* ── TASKS ── */
function getFilteredTasks() {
    const q = document.getElementById('task-search').value.toLowerCase().trim();
    const fPri = document.getElementById('tf-priority').value;
    const fSta = document.getElementById('tf-status').value;
    const fArea = document.getElementById('tf-area').value;
    return allTasks.filter(t => {
        if (q && !([t.title, t.workerName, t.area, t.id].join(' ').toLowerCase()).includes(q)) return false;
        if (fPri && t.priority !== fPri) return false;
        if (fArea && t.area !== fArea) return false;
        const displayStatus = isOverdue(t) ? 'Overdue' : t.status;
        if (fSta && displayStatus !== fSta) return false;
        return true;
    });
}

function renderTasks() {
    const grid = document.getElementById('tasks-grid');
    const filtered = getFilteredTasks();
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="mgr-empty">
      <div class="mgr-empty-icon">📋</div>
      <div class="mgr-empty-title">${allTasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}</div>
      <div class="mgr-empty-sub">${allTasks.length === 0 ? 'Click "+ New Task" to get started.' : 'Try adjusting your search or filters.'}</div>
    </div>`;
        return;
    }

    grid.innerHTML = filtered.map(task => {
        const overdue = isOverdue(task);
        const displayStatus = overdue ? 'Overdue' : task.status;
        const pct = task.status === 'Completed' ? 100 : task.status === 'In Progress' ? 50 : 0;
        const priIcons = { High: '🔴', Medium: '🟠', Low: '🟢' };
        const catNames = { roads: 'Roads', water: 'Water', electricity: 'Electricity', sanitation: 'Sanitation', healthcare: 'Healthcare', other: 'Other' };
        return `<div class="task-card pri-${task.priority}" data-id="${task.id}">
      <div class="task-card-top">
        <span class="task-priority-badge pri-badge-${task.priority}">${priIcons[task.priority] || ''} ${task.priority}</span>
        <span class="task-status-badge ${statusClass(displayStatus)}">${displayStatus}</span>
      </div>
      <div class="task-title">${task.title}</div>
      <div class="task-meta">
        <span>📍 ${task.area || '—'}</span>
        <span>🗓️ Due: ${fmtDate(task.dueDate)}</span>
        <span>🏷️ ${catNames[task.category] || task.category}</span>
      </div>
      <div class="task-worker">
        <div class="task-worker-avatar">${initials(task.workerName)}</div>
        <div class="task-worker-info">
          <div class="task-worker-name">${task.workerName}</div>
          <div class="task-worker-mobile">${task.workerMobile}</div>
        </div>
      </div>
      <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
      <div class="task-card-footer">
        ${task.status !== 'Completed' ? `<button class="task-action-btn" data-task-id="${task.id}" data-action="progress">📊 Update</button>` : ''}
        ${task.status !== 'Completed' ? `<button class="task-action-btn" data-task-id="${task.id}" data-action="complete">✅ Complete</button>` : ''}
        ${overdue ? `<button class="task-action-btn escalate" data-task-id="${task.id}" data-action="escalate">🔺 Escalate</button>` : ''}
        <button class="task-action-btn" data-task-id="${task.id}" data-action="delete">🗑 Delete</button>
      </div>
    </div>`;
    }).join('');

    // Populate area filter
    const areas = [...new Set(allTasks.map(t => t.area).filter(Boolean))];
    const areaFilter = document.getElementById('tf-area');
    const currentVal = areaFilter.value;
    areaFilter.innerHTML = '<option value="">All Areas</option>' + areas.map(a => `<option value="${a}" ${a === currentVal ? 'selected' : ''}>${a}</option>`).join('');
}

/* ── WORKERS ── */
function getFilteredWorkers() {
    const q = document.getElementById('worker-search').value.toLowerCase().trim();
    const fs = document.getElementById('wf-status').value;
    return workers.filter(w => {
        if (q && !([w.name, w.mobile, w.area].join(' ').toLowerCase()).includes(q)) return false;
        if (fs && w.status !== fs) return false;
        return true;
    });
}

function renderWorkers() {
    const grid = document.getElementById('workers-grid');
    const fw = getFilteredWorkers();
    if (fw.length === 0) {
        grid.innerHTML = `<div class="mgr-empty" style="grid-column:1/-1"><div class="mgr-empty-icon">👷</div><div class="mgr-empty-title">No workers found</div></div>`;
        return;
    }
    grid.innerHTML = fw.map(w => {
        const wTasks = allTasks.filter(t => t.workerMobile === w.mobile).length;
        const wDone = allTasks.filter(t => t.workerMobile === w.mobile && t.status === 'Completed').length;
        return `<div class="worker-card ${w.status === 'blocked' ? 'blocked' : ''}">
      <div class="worker-card-top">
        <div class="worker-avatar">${initials(w.name)}</div>
        <div>
          <div class="worker-name">${w.name}</div>
          <div class="worker-mobile">📱 ${w.mobile}</div>
          <span class="worker-status-badge wstatus-${w.status}">${w.status === 'active' ? '● Active' : '⊘ Blocked'}</span>
        </div>
      </div>
      <div class="worker-stats">
        <div class="worker-stat"><div class="worker-stat-val">${wTasks}</div><div class="worker-stat-label">Assigned</div></div>
        <div class="worker-stat"><div class="worker-stat-val">${wDone}</div><div class="worker-stat-label">Completed</div></div>
        <div class="worker-stat"><div class="worker-stat-val">${wTasks > 0 ? Math.round((wDone / wTasks) * 100) : 0}%</div><div class="worker-stat-label">Rate</div></div>
      </div>
      <div class="worker-card-footer">
        <button class="worker-btn" data-mobile="${w.mobile}" data-action="view-tasks">📋 Tasks</button>
        ${w.status === 'active'
                ? `<button class="worker-btn block-btn" data-mobile="${w.mobile}" data-action="block">⊘ Block</button>`
                : `<button class="worker-btn unblock-btn" data-mobile="${w.mobile}" data-action="unblock">✓ Unblock</button>`}
      </div>
    </div>`;
    }).join('');
}

/* ── GRIEVANCES ── */
function renderGrievances() {
    const list = document.getElementById('grievances-list');
    const q = document.getElementById('griev-search').value.toLowerCase().trim();
    const fPri = document.getElementById('gf-priority').value;
    const fStat = document.getElementById('gf-status').value;

    const filtered = allComplaints.filter(c => {
        if (q && !([c.id, c.fullName, c.title, c.city].join(' ').toLowerCase()).includes(q)) return false;
        if (fPri && c.priority !== fPri) return false;
        if (fStat && c.status !== fStat) return false;
        return true;
    });

    document.getElementById('tc-grievances').textContent = allComplaints.length;

    if (filtered.length === 0) {
        list.innerHTML = `<div class="mgr-empty"><div class="mgr-empty-icon">📨</div><div class="mgr-empty-title">${allComplaints.length === 0 ? 'No complaints yet' : 'No matches'}</div></div>`;
        return;
    }

    const priClr = { High: '#fdf2f2', Medium: '#fff3ec', Low: '#e6f4ed' };
    const priEmoji = { High: '🔴', Medium: '🟠', Low: '🟢' };
    list.innerHTML = filtered.slice(0, 30).map(c => {
        const statusCls = { Pending: 'tstatus-Assigned', 'In Review': 'tstatus-InProgress', Resolved: 'tstatus-Completed', Rejected: 'tstatus-Overdue' }[c.status] || 'tstatus-Assigned';
        return `<div class="griev-card">
      <div class="griev-card-priority" style="background:${priClr[c.priority] || '#e8eef8'}">${priEmoji[c.priority] || '📋'}</div>
      <div class="griev-card-body">
        <div class="griev-card-title">${c.title || '—'}</div>
        <div class="griev-card-meta">
          <span>🆔 ${(c.id || '—').split('/').pop()}</span>
          <span>👤 ${c.fullName || '—'}</span>
          <span>📍 ${c.city || '—'}, ${c.district || '—'}</span>
          <span>📅 ${c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('en-IN') : '—'}</span>
        </div>
      </div>
      <span class="griev-card-badge ${statusCls}">${c.status}</span>
      <button class="griev-assign-btn" data-complaint-id="${c.id}">Assign Worker</button>
    </div>`;
    }).join('');
}

/* ── ATTENDANCE ── */
function renderAttendance() {
    document.getElementById('attendance-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const stored = JSON.parse(localStorage.getItem('civitas_attendance') || '{}');
    const today = new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('attendance-tbody');
    tbody.innerHTML = workers.map(w => {
        const att = stored[today]?.[w.mobile];
        const status = att ? att.status : (w.status === 'blocked' ? 'absent' : 'present');
        const time = att ? att.time : (w.status === 'active' ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
        const cls = { present: 'att-present', absent: 'att-absent', late: 'att-late' }[status] || 'att-present';
        return `<tr>
      <td><strong>${w.name}</strong></td>
      <td>${w.mobile}</td>
      <td>${w.area}</td>
      <td>${time}</td>
      <td><span class="att-badge ${cls}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
    </tr>`;
    }).join('');
}

/* ── TAB SWITCH ── */
function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.mgr-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.mgr-tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
    if (tab === 'attendance') renderAttendance();
}

document.querySelectorAll('.mgr-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ── FILTER EVENTS ── */
document.getElementById('task-search').addEventListener('input', renderTasks);
document.getElementById('tf-priority').addEventListener('change', renderTasks);
document.getElementById('tf-status').addEventListener('change', renderTasks);
document.getElementById('tf-area').addEventListener('change', renderTasks);
document.getElementById('worker-search').addEventListener('input', renderWorkers);
document.getElementById('wf-status').addEventListener('change', renderWorkers);
document.getElementById('griev-search').addEventListener('input', renderGrievances);
document.getElementById('gf-priority').addEventListener('change', renderGrievances);
document.getElementById('gf-status').addEventListener('change', renderGrievances);

/* ── TASK CARD ACTIONS ── */
document.getElementById('tasks-grid').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const taskId = btn.dataset.taskId;
    const action = btn.dataset.action;
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    if (action === 'complete') {
        task.status = 'Completed';
        saveTasks();
        renderTasks();
        renderStats();
        toast('✅ Task marked as completed!');
    } else if (action === 'progress') {
        const statuses = ['Assigned', 'In Progress', 'Completed'];
        const idx = statuses.indexOf(task.status);
        task.status = statuses[Math.min(idx + 1, statuses.length - 1)];
        saveTasks();
        renderTasks();
        renderStats();
        toast(`📊 Task status → ${task.status}`);
    } else if (action === 'escalate') {
        toast(`🔺 Task "${task.title}" escalated to senior authority!`);
    } else if (action === 'delete') {
        if (confirm(`Delete task "${task.title}"?`)) {
            allTasks = allTasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
            renderStats();
            toast('🗑 Task deleted.');
        }
    }
});

/* ── WORKER CARD ACTIONS ── */
document.getElementById('workers-grid').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const mobile = btn.dataset.mobile;
    const action = btn.dataset.action;
    const w = workers.find(x => x.mobile === mobile);
    if (!w) return;

    if (action === 'view-tasks') {
        document.getElementById('task-search').value = w.name;
        switchTab('tasks');
        renderTasks();
    } else if (action === 'block' || action === 'unblock') {
        blockTarget = { worker: w, action };
        document.getElementById('block-modal-title').textContent = action === 'block' ? '⊘ Block Worker' : '✓ Unblock Worker';
        document.getElementById('block-modal-msg').textContent = action === 'block'
            ? `Are you sure you want to BLOCK ${w.name} (${w.mobile})? They will not be able to access the system.`
            : `Are you sure you want to UNBLOCK ${w.name} (${w.mobile})? They will regain access to the system.`;
        document.getElementById('block-modal-overlay').classList.add('open');
    }
});

document.getElementById('block-modal-confirm').addEventListener('click', () => {
    if (!blockTarget) return;
    blockTarget.worker.status = blockTarget.action === 'block' ? 'blocked' : 'active';
    renderWorkers();
    renderStats();
    toast(blockTarget.action === 'block' ? `⊘ ${blockTarget.worker.name} blocked.` : `✓ ${blockTarget.worker.name} unblocked.`);
    closeBlockModal();
});

function closeBlockModal() {
    document.getElementById('block-modal-overlay').classList.remove('open');
    blockTarget = null;
}
document.getElementById('block-modal-close').addEventListener('click', closeBlockModal);
document.getElementById('block-modal-cancel').addEventListener('click', closeBlockModal);
document.getElementById('block-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeBlockModal(); });

/* ── GRIEVANCES ACTIONS ── */
document.getElementById('grievances-list').addEventListener('click', e => {
    const btn = e.target.closest('.griev-assign-btn');
    if (!btn) return;
    toast('🔧 Task creation from complaint — switch to Tasks → New Task with this Complaint ID.');
});

/* ── NEW TASK MODAL ── */
function openTaskModal() {
    // Populate workers dropdown
    const sel = document.getElementById('t-worker');
    sel.innerHTML = '<option value="">-- Select Worker --</option>' +
        workers.filter(w => w.status === 'active').map(w => `<option value="${w.mobile}" data-name="${w.name}">${w.name} (${w.area})</option>`).join('');

    // Set min date
    document.getElementById('t-due').min = new Date().toISOString().split('T')[0];

    document.getElementById('task-modal-overlay').classList.add('open');
}
function closeTaskModal() {
    document.getElementById('task-modal-overlay').classList.remove('open');
}

document.getElementById('new-task-btn').addEventListener('click', openTaskModal);
document.getElementById('task-modal-close').addEventListener('click', closeTaskModal);
document.getElementById('task-modal-cancel').addEventListener('click', closeTaskModal);
document.getElementById('task-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeTaskModal(); });

document.getElementById('task-modal-save').addEventListener('click', () => {
    const title = document.getElementById('t-title').value.trim();
    const workerEl = document.getElementById('t-worker');
    const mobile = workerEl.value;
    const workerName = mobile ? workerEl.options[workerEl.selectedIndex]?.dataset.name || '' : '';
    const dueDate = document.getElementById('t-due').value;

    if (!title) { toast('❌ Task title is required.'); return; }
    if (!mobile) { toast('❌ Please select a worker.'); return; }
    if (!dueDate) { toast('❌ Due date is required.'); return; }

    const newTask = {
        id: 'TASK' + Date.now(),
        title,
        description: document.getElementById('t-desc').value.trim(),
        category: document.getElementById('t-category').value,
        priority: document.getElementById('t-priority').value,
        status: 'Assigned',
        workerMobile: mobile,
        workerName,
        area: document.getElementById('t-area').value.trim() || (workers.find(w => w.mobile === mobile)?.area || ''),
        dueDate,
        complaintId: document.getElementById('t-complaint-id').value.trim(),
        createdAt: new Date().toISOString(),
    };

    // Try saving to Firestore too (non-blocking)
    if (window.db) {
        window.db.collection('tasks').doc(newTask.id).set(newTask).catch(e => console.warn('Firestore task save:', e));
    }

    allTasks.unshift(newTask);
    saveTasks();
    renderTasks();
    renderStats();
    closeTaskModal();
    toast('✅ Task created and assigned!');

    // Reset form
    ['t-title', 't-desc', 't-area', 't-complaint-id'].forEach(id => document.getElementById(id).value = '');
});

/* ── REFRESH ── */
document.getElementById('refresh-all-btn').addEventListener('click', () => {
    loadGrievances();
    renderTasks();
    renderWorkers();
    renderStats();
    toast('⟳ Refreshed!');
});

/* ── ESCALATION CLOSE ── */
document.getElementById('escalation-close').addEventListener('click', () => {
    document.getElementById('escalation-banner').style.display = 'none';
});

/* ── LOAD GRIEVANCES FROM FIREBASE ── */
function loadGrievances() {
    if (!window.db) return;
    window.db.collection('complaints').orderBy('submittedAt', 'desc').limit(50)
        .onSnapshot(snap => {
            allComplaints = snap.docs.map(d => d.data());
            renderGrievances();
        }, err => {
            console.warn('Grievances load error:', err.message);
            renderGrievances(); // render with empty
        });
}

/* ── INIT ── */
loadTasks();
renderStats();
renderTasks();
renderWorkers();
loadGrievances();
