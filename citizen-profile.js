'use strict';

/* ================================================================
   PGMS 2.0 — CITIZEN PROFILE SCRIPT
   Uses Firebase Firestore to fetch grievances by mobile number
================================================================ */

function el(id) { return document.getElementById(id); }

// Wait for Firebase to be ready (it's loaded synchronously in head, but good practice)
document.addEventListener('DOMContentLoaded', () => {
    // Check if there is a saved mobile number in localStorage for persistence
    const savedMobile = localStorage.getItem('pgms_citizen_mobile');
    if (savedMobile) {
        el('login-mobile').value = savedMobile.replace('+91 ', '');
        loadProfile(savedMobile);
    }
});

/* ================================================================
   1. LOGIN HANDLER
================================================================ */
el('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const mobileInput = el('login-mobile').value.trim();
    const errorEl = el('login-error');
    const btn = el('login-btn');

    if (!mobileInput) {
        errorEl.textContent = 'Please enter your mobile number.';
        return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileInput)) {
        errorEl.textContent = 'Must be 10 digits starting with 6, 7, 8 or 9.';
        return;
    }

    errorEl.textContent = '';
    const formattedMobile = '+91 ' + mobileInput;

    // Save to localStorage
    localStorage.setItem('pgms_citizen_mobile', formattedMobile);

    // Load profile
    loadProfile(formattedMobile);
});

el('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('pgms_citizen_mobile');
    el('login-mobile').value = '';
    el('dashboard-section').classList.add('hidden');
    el('login-section').classList.remove('hidden');
});

/* ================================================================
   2. DATA FETCHING & RENDERING
================================================================ */
async function loadProfile(mobileStr) {
    el('login-section').classList.add('hidden');
    el('dashboard-section').classList.remove('hidden');

    el('profile-mobile').textContent = mobileStr;
    const historyList = el('history-list');

    try {
        const snapshot = await window.db.collection('complaints')
            .where('mobile', '==', mobileStr)
            .orderBy('submittedAt', 'desc')
            .get();

        renderDashboard(snapshot);
    } catch (err) {
        console.error("Error fetching grievances:", err);
        // If index is missing, firestore throws an error. We can fallback to fetching all for this demo or just alerting
        if (err.message.includes('requires an index')) {
            console.warn("Firestore index missing. Falling back to un-ordered query.");
            try {
                const fallbackSnap = await window.db.collection('complaints')
                    .where('mobile', '==', mobileStr)
                    .get();

                // manual sort
                const docs = [];
                fallbackSnap.forEach(doc => docs.push(doc));
                docs.sort((a, b) => new Date(b.data().submittedAt) - new Date(a.data().submittedAt));

                renderDashboardFallback(docs);
            } catch (fallbackErr) {
                historyList.innerHTML = `<div class="empty-state">
                    <p style="color:#ef4444">Error loading data. Check console.</p>
                 </div>`;
            }
        } else {
            historyList.innerHTML = `<div class="empty-state">
                <p style="color:#ef4444">Could not load grievances. Please try again later.</p>
            </div>`;
        }
    }
}

function renderDashboard(snapshot) {
    const docs = [];
    snapshot.forEach(doc => docs.push(doc));
    renderDashboardFallback(docs);
}

function renderDashboardFallback(docs) {
    const historyList = el('history-list');

    if (docs.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
                <h4>No grievances found</h4>
                <p>We couldn't find any complaints linked to this mobile number.</p>
                <a href="citizen.html" class="btn btn-primary" style="display:inline-flex; width:auto; margin-top:16px;">Submit a Grievance</a>
            </div>
        `;
        el('profile-name').textContent = 'Citizen User';
        el('stat-total').textContent = '0';
        el('stat-pending').textContent = '0';
        el('stat-resolved').textContent = '0';
        return;
    }

    // Set Name from the latest complaint
    const latestDoc = docs[0].data();
    el('profile-name').textContent = latestDoc.fullName || 'Citizen User';

    // Calculate Stats
    let pending = 0;
    let resolved = 0;

    let html = '';

    docs.forEach(docSnap => {
        const data = docSnap.data();

        // Count stats
        if (data.status === 'Resolved' || data.status === 'Rejected') resolved++;
        else pending++;

        // Formatting
        const dateObj = new Date(data.submittedAt);
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        let statusClass = 'status-Pending';
        if (data.status === 'In Review') statusClass = 'status-Review';
        if (data.status === 'Resolved') statusClass = 'status-Resolved';
        if (data.status === 'Rejected') statusClass = 'status-Rejected';

        html += `
            <div class="history-item">
                <div class="history-item-header">
                    <div>
                        <div class="history-id">${data.id}</div>
                        <span class="history-date">Submitted: ${dateStr}</span>
                    </div>
                    <span class="history-status ${statusClass}">${data.status}</span>
                </div>
                <div>
                    <div class="history-title">${data.title}</div>
                    <div class="history-cat">${data.categoryName} • ${data.department !== '—' ? data.department : data.city}</div>
                </div>
                <div class="history-desc">
                    ${data.description}
                </div>
            </div>
        `;
    });

    // Update stats DOM
    el('stat-total').textContent = docs.length;
    el('stat-pending').textContent = pending;
    el('stat-resolved').textContent = resolved;

    historyList.innerHTML = html;
}
