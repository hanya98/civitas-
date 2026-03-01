'use strict';

/* ================================================================
   PGMS 2.0 — ADMIN PROFILE SCRIPT
   Provides a view of an individual officer's performance
================================================================ */

function el(id) { return document.getElementById(id); }

let allOfficerAssignments = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check if there is a saved officer name in localStorage
    const savedOfficer = localStorage.getItem('pgms_officer_name');
    if (savedOfficer) {
        el('officer-search').value = savedOfficer;
        loadOfficerProfile(savedOfficer);
    }

    // Quick select buttons
    document.querySelectorAll('.qs-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            el('officer-search').value = name;
            loadOfficerProfile(name);
        });
    });
});

/* ================================================================
   1. OFFICER SELECTION
================================================================ */
el('load-officer-btn').addEventListener('click', () => {
    const name = el('officer-search').value.trim();
    if (!name) {
        alert("Please enter an officer's name.");
        return;
    }
    loadOfficerProfile(name);
});

el('change-officer-btn').addEventListener('click', () => {
    localStorage.removeItem('pgms_officer_name');
    el('profile-dashboard').classList.add('hidden');
    el('officer-selector').classList.remove('hidden');
    el('officer-search').value = '';
});

/* ================================================================
   2. DATA FETCHING
================================================================ */
async function loadOfficerProfile(officerName) {
    el('officer-selector').classList.add('hidden');
    el('profile-dashboard').classList.remove('hidden');

    // Save to localStorage
    localStorage.setItem('pgms_officer_name', officerName);

    // Set basic UI
    el('profile-name').textContent = officerName;
    el('avatar-initials').textContent = getInitials(officerName);

    const listEl = el('assignments-list');
    listEl.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Searching records for ${officerName}...</p></div>`;

    try {
        // In Firestore, assignments are stored in a subcollection 'assignments' under each complaint doc.
        // We can do a collectionGroup query to find all assignments matching the officer name.
        const snapshot = await window.db.collectionGroup('assignments')
            .where('assignedTo', '==', officerName)
            .get();

        processOfficerData(snapshot, officerName);
    } catch (err) {
        console.error("Error fetching assignments:", err);
        if (err.message.includes('requires an index')) {
            // Fallback: This is expensive in a real app, but for this demo without indexes:
            console.warn("CollectionGroup Index missing. Querying might fail. In a real scenario, click the link in the console to create it.");
            listEl.innerHTML = `<div class="empty-state">
                <p style="color:#ef4444">Firestore Index missing. Please create a collectionGroup index for 'assignments' on 'assignedTo'. Check console for the exact link.</p>
             </div>`;
        } else {
            listEl.innerHTML = `<div class="empty-state">
                <p style="color:#ef4444">Could not load assignments. Please try again later.</p>
             </div>`;
        }
    }
}

function processOfficerData(snapshot, officerName) {
    allOfficerAssignments = [];

    let totalAssigned = 0;
    let active = 0;
    let resolved = 0;

    let roleStr = "Officer";
    let deptStr = "Department";

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        allOfficerAssignments.push(data);

        totalAssigned++;

        if (data.status === 'Completed' || data.status === 'Resolved') {
            resolved++;
        } else {
            active++;
        }

        // Grab the role and department from the latest assignment
        if (data.role) roleStr = data.role;
        if (data.department) deptStr = data.department;
    });

    // Sort array by assignedAt desc
    allOfficerAssignments.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

    // Update Stats UI
    el('profile-role').textContent = roleStr;
    el('profile-dept').textContent = deptStr;

    el('stat-total').textContent = totalAssigned;
    el('stat-active').textContent = active;
    el('stat-resolved').textContent = resolved;

    if (resolved > 0) {
        // Mock average time for demo purposes (e.g. 3.2 Days)
        el('stat-avg-time').textContent = (Math.random() * 5 + 1).toFixed(1) + ' Days';
    } else {
        el('stat-avg-time').textContent = '—';
    }

    renderAssignmentsList('all');
}

/* ================================================================
   3. RENDERING LIST
================================================================ */
el('assignment-filter').addEventListener('change', (e) => {
    renderAssignmentsList(e.target.value);
});

function renderAssignmentsList(filter) {
    const listEl = el('assignments-list');

    let filteredList = allOfficerAssignments;
    if (filter === 'active') {
        filteredList = allOfficerAssignments.filter(a => a.status === 'Assigned' || a.status === 'In Progress');
    } else if (filter === 'completed') {
        filteredList = allOfficerAssignments.filter(a => a.status === 'Completed' || a.status === 'Resolved' || a.status === 'Escalated');
    }

    if (filteredList.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 16px;">📂</div>
                <h4>No Assignments Found</h4>
                <p>No matching assignments for this officer under the selected filter.</p>
            </div>
        `;
        return;
    }

    let html = '';
    filteredList.forEach(a => {
        const dateObj = new Date(a.assignedAt);
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' ' + dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        let statusClass = 'status-Assigned';
        if (a.status === 'In Progress') statusClass = 'status-Progress';
        if (a.status === 'Completed' || a.status === 'Resolved') statusClass = 'status-Completed';
        if (a.status === 'Escalated') statusClass = 'status-Escalated';

        // Since we only query the assignment doc, we don't have the full complaint details. 
        // We use the ID and whatever is stored in the assignment doc itself.
        const compId = a.complaintId || a.id.split('_').slice(0, -1).join('/'); // Fallback if complaintId isn't stored explicitly

        html += `
            <div class="assignment-card">
                <div>
                    <div class="ac-header">
                        <span class="ac-complaint-id">${compId}</span>
                        <span>Assigned: ${dateStr}</span>
                    </div>
                    <div class="ac-title">Task Instruction: ${a.instruction || 'Review Complaint'}</div>
                </div>
                
                <div class="ac-meta">
                    <span>Role: <strong>${a.role || 'Officer'}</strong></span>
                    <span>Dept: <strong>${a.department || '—'}</strong></span>
                </div>
                
                <div style="text-align: right;">
                    <span class="ac-status-badge ${statusClass}">${a.status || 'Assigned'}</span>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

/* ================================================================
   4. HELPERS
================================================================ */
function getInitials(name) {
    const parts = name.replace(/^(Sh\.|Smt\.|Dr\.)\s*/i, '').trim().split(' ');
    if (parts.length === 0) return 'O';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
