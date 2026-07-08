/* ================================================================
   PGMS 2.0 — TRACKING PAGE
   Loads complaints from Firebase Firestore
================================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyARUCovi6he0lYE6pikBB_doz72Nae2-h0",
  authDomain: "grievance-form-39f6a.firebaseapp.com",
  projectId: "grievance-form-39f6a",
  storageBucket: "grievance-form-39f6a.firebasestorage.app",
  messagingSenderId: "149185682282",
  appId: "1:149185682282:web:785c21c17d3470592ca313",
  measurementId: "G-9V6SPFXDV0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* ── CITIZEN ID — read from localStorage (set by script.js on submit) ── */
const CITIZEN_ID = (function () {
  try { return localStorage.getItem('Aadhaar'); } catch (e) { return null; }
})();

/* ── DEMO / FALLBACK DATA ── */
const DEMO_COMPLAINTS = [];

/* ── IN-MEMORY DB — starts with demo data, gets replaced/augmented by Firebase ── */
const DB = { complaints: [...DEMO_COMPLAINTS] };

/* ================================================================
   FIELD MAPPING — convert Firestore (admin) doc shape
   → tracking.js complaint shape
================================================================ */
const PRIORITY_MAP = { 'High': 3, 'Medium': 2, 'Low': 1 };
const CAT_SLUG_TO_LABEL = {
  roads: 'Road', water: 'Water', electricity: 'Electricity',
  sanitation: 'Sanitation', healthcare: 'Healthcare', education: 'Education',
  police: 'Police', corruption: 'Corruption', other: 'General'
};

function firestoreDocToComplaint(doc) {
  const d = doc;
  const raisedAt = d.submittedAt || d.raisedAt || new Date().toISOString();
  const updatedAt = d.updatedAt || raisedAt;
  const catLabel = d.categoryName || CAT_SLUG_TO_LABEL[d.category] || d.category || 'General';
  const priNum = PRIORITY_MAP[d.priority] || 2;

  // Build a basic timeline if none stored
  const timeline = d.timeline && d.timeline.length
    ? d.timeline
    : [{ status: 'Submitted', changedAt: raisedAt, changedBy: 'System', note: 'Grievance registered' }];

  // If admin updated the status, append it to the timeline if not already there
  const lastTlStatus = timeline[timeline.length - 1].status;
  if (d.status && d.status !== 'Submitted' && d.status !== lastTlStatus) {
    timeline.push({ status: d.status, changedAt: updatedAt, changedBy: 'Admin', note: `Status updated to ${d.status}` });
  }

  const location = d.lat && d.lng ? {
    lat: parseFloat(d.lat), lng: parseFloat(d.lng),
    address: [d.locality, d.city, d.district].filter(Boolean).join(', ') || d.city || '',
    ward: d.ward || '',
    pincode: d.pincode || ''
  } : (d.pincode ? {
    lat: null, lng: null,
    address: [d.locality, d.city, d.district].filter(Boolean).join(', ') || '',
    ward: d.ward || '',
    pincode: d.pincode || ''
  } : null);

  return {
    id: d.id || doc._docId || 'GRV-???',
    citizenId: d.aadhaar || d.citizenId || CITIZEN_ID,
    title: d.title || d.subject || '(No title)',
    description: d.description || '',
    category: catLabel,
    department: d.department || '',
    status: d.status || 'Submitted',
    priority: priNum,
    location: location,
    attachments: d.attachments || [],
    timeline: timeline,
    assignedTo: d.assignedTo || null,
    raisedAt: raisedAt,
    updatedAt: updatedAt,
    resolvedAt: d.resolvedAt || (d.status === 'Resolved' ? updatedAt : null),
    expectedBy: d.expectedBy || (() => {
      const d7 = new Date(raisedAt);
      d7.setDate(d7.getDate() + 7);
      return d7.toISOString();
    })()
  };
}

/* ================================================================
   FIREBASE REAL-TIME LISTENER
   Merges Firestore complaints into DB, then re-renders.
================================================================ */
(function connectFirebase() {
  // Show a loading indicator in the My Complaints list
  const mcList = document.getElementById('mc-list');
  if (mcList) {
    mcList.innerHTML = `<div class="empty-state">
      <div class="icon" style="animation:spin 1s linear infinite;display:inline-block">⏳</div>
      <h3>Loading from Firebase…</h3>
      <p>Fetching live grievances…</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
  }

  const q = query(collection(db, 'complaints'), orderBy('submittedAt', 'desc'));

  onSnapshot(q,
    snapshot => {
      // Start fresh from demo data, then overlay Firestore docs
      DB.complaints = [...DEMO_COMPLAINTS];
      snapshot.docs.forEach(doc => {
        const raw = { ...doc.data(), _docId: doc.id };
        const mapped = firestoreDocToComplaint(raw);
        // Replace demo entry with same ID if exists, otherwise push
        const idx = DB.complaints.findIndex(c => c.id === mapped.id);
        if (idx >= 0) DB.complaints[idx] = mapped;
        else DB.complaints.push(mapped);
      });

      // Also merge any localStorage grievances (from script.js form)
      try {
        const stored = JSON.parse(localStorage.getItem('pgms_grievances') || '[]');
        stored.forEach(g => {
          if (!DB.complaints.some(c => c.id === g.id)) DB.complaints.push(g);
        });
      } catch (e) { }

      // Re-render whichever tab is active
      renderMyComplaints();
      const activePage = document.querySelector('.page.active');
      if (activePage && activePage.id === 'page-nearby') renderNearby();
    },
    err => {
      console.warn('Firebase listener error:', err);
      // Fall back to demo data + localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('pgms_grievances') || '[]');
        stored.forEach(g => {
          if (!DB.complaints.some(c => c.id === g.id)) DB.complaints.push(g);
        });
      } catch (e) { }
      renderMyComplaints();
    }
  );
})();


const Backend = {


  getMyComplaints({ status = '', category = '', page = 1, limit = 10 } = {}) {
    let results = DB.complaints.filter(c => c.citizenId === CITIZEN_ID);
    if (status) results = results.filter(c => c.status === status);
    if (category) results = results.filter(c => c.category === category);
    results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const total = results.length;
    const data = results.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  },


  getNearbyIssues({ lat, lng, radiusKm = 2, status = '', category = '', page = 1, limit = 20 } = {}) {
    let results = DB.complaints.filter(c => {
      if (!c.location) return false;
      return haversineKm(lat, lng, c.location.lat, c.location.lng) <= radiusKm;
    });
    if (status) results = results.filter(c => c.status === status);
    if (category) results = results.filter(c => c.category === category);
    results = results.map(c => ({ ...c, distanceKm: haversineKm(lat, lng, c.location.lat, c.location.lng) }));
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    const total = results.length;
    const data = results.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  },


  getComplaintStatus(id) {
    const complaint = DB.complaints.find(c => c.id === id.trim());
    if (!complaint) return null;
    return { ...complaint, sla: computeSla(complaint) };
  },


  updateStatus(id, newStatus, changedBy = 'System', note = '') {
    const complaint = DB.complaints.find(c => c.id === id);
    if (!complaint) return null;
    const now = new Date().toISOString();
    complaint.status = newStatus;
    complaint.updatedAt = now;
    if (newStatus === 'Resolved') complaint.resolvedAt = now;
    complaint.timeline.push({ status: newStatus, changedAt: now, changedBy, note });
    return complaint;
  }
};


function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


function computeSla(complaint) {
  if (['Resolved', 'Rejected'].includes(complaint.status))
    return { breached: false, daysRemaining: null, label: 'Closed', pct: 100 };
  if (!complaint.expectedBy)
    return { breached: false, daysRemaining: null, label: 'No SLA', pct: 0 };
  const now = Date.now();
  const raised = new Date(complaint.raisedAt).getTime();
  const deadline = new Date(complaint.expectedBy).getTime();
  const total = deadline - raised;
  const elapsed = now - raised;
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const msLeft = deadline - now;
  const daysRemaining = Math.ceil(msLeft / 86400000);
  if (daysRemaining < 0)
    return { breached: true, daysRemaining: Math.abs(daysRemaining), label: `Overdue by ${Math.abs(daysRemaining)}d`, pct: 100 };
  if (daysRemaining === 0)
    return { breached: false, daysRemaining: 0, label: 'Due today', pct };
  return { breached: false, daysRemaining, label: `${daysRemaining} day(s) left`, pct };
}


function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}


function statusSlug(s) { return s.toLowerCase().replace(/\s+/g, '-'); }


function renderCard(c, showDist = false) {
  const slug = statusSlug(c.status);
  const sla = computeSla(c);
  const slaClass = sla.breached ? 'overdue' : sla.pct > 70 ? 'warn' : 'ok';
  const distBadge = showDist && c.distanceKm !== undefined
    ? `<span class="badge badge-dist">📍 ${c.distanceKm.toFixed(2)} km</span>` : '';
  const priLabel = ['', '🟢 Low', '🟡 Medium', '🔴 High'][c.priority] || '';

  return `
    <div class="complaint-card status-${slug}" onclick="openDetail('${c.id}')">
      <div class="card-top">
        <div>
          <div class="card-id">${c.id}</div>
          <div class="card-title">${c.title}</div>
        </div>
      </div>
      <div class="card-meta">
        <span class="badge badge-status-${slug}">${c.status}</span>
        <span class="badge badge-cat">${c.category}</span>
        <span class="badge badge-cat">${priLabel}</span>
        ${distBadge}
        <span class="card-date">${fmtDate(c.raisedAt)}</span>
      </div>
      ${(!['Resolved', 'Rejected'].includes(c.status)) ? `
      <div class="sla-bar">
        <div class="sla-label">
          <span>SLA Progress</span>
          <span>${sla.label}</span>
        </div>
        <div class="sla-track"><div class="sla-fill ${slaClass}" style="width:${sla.pct}%"></div></div>
      </div>` : ''}
    </div>`;
}


function openDetail(id) {
  const complaint = Backend.getComplaintStatus(id);
  if (!complaint) return;
  const sla = complaint.sla;
  const slug = statusSlug(complaint.status);

  document.getElementById('dp-title').textContent = complaint.title;

  const timelineHtml = complaint.timeline.map((t, i) => {
    const tslug = statusSlug(t.status);
    const isLast = i === complaint.timeline.length - 1;
    return `
      <div class="tl-item">
        <div class="tl-dot ${tslug} ${isLast ? 'in-progress' : ''}"></div>
        <div class="tl-status">${t.status}</div>
        <div class="tl-note">${t.note}</div>
        <div class="tl-time">${fmtDateTime(t.changedAt)} · ${t.changedBy}</div>
      </div>`;
  }).join('');

  document.getElementById('dp-body').innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Overview</div>
      <div class="info-grid">
        <div class="info-item"><label>Complaint ID</label><span>${complaint.id}</span></div>
        <div class="info-item"><label>Aadhaar No.</label><span>${complaint.citizenId}</span></div>
        <div class="info-item"><label>Category</label><span>${complaint.category}</span></div>
        <div class="info-item"><label>Department</label><span>${complaint.department}</span></div>
        <div class="info-item"><label>Priority</label><span>${['', 'Low', 'Medium', 'High'][complaint.priority]}</span></div>
        <div class="info-item"><label>Raised On</label><span>${fmtDate(complaint.raisedAt)}</span></div>
        <div class="info-item"><label>Expected By</label><span>${fmtDate(complaint.expectedBy)}</span></div>
        ${complaint.resolvedAt ? `<div class="info-item"><label>Resolved On</label><span>${fmtDate(complaint.resolvedAt)}</span></div>` : ''}
        ${complaint.assignedTo ? `<div class="info-item"><label>Assigned To</label><span>${complaint.assignedTo}</span></div>` : ''}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Current Status</div>
      <div class="info-grid">
        <div class="info-item" style="grid-column:1/-1;">
          <label>Status</label>
          <span class="badge badge-status-${slug}" style="font-size:0.85rem;padding:5px 14px;">${complaint.status}</span>
        </div>
      </div>
      ${!['Resolved', 'Rejected'].includes(complaint.status) ? `
      <div class="sla-bar" style="margin-top:12px">
        <div class="sla-label"><span>SLA</span><span>${sla.label}</span></div>
        <div class="sla-track"><div class="sla-fill ${sla.breached ? 'overdue' : sla.pct > 70 ? 'warn' : 'ok'}" style="width:${sla.pct}%"></div></div>
      </div>` : ''}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Description</div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;font-size:0.875rem;color:var(--muted);line-height:1.6;">
        ${complaint.description}
      </div>
    </div>

    ${complaint.location ? `
    <div class="detail-section">
      <div class="detail-section-title">Location</div>
      <div class="info-item">
        <label>Address</label>
        <span>${complaint.location.address}</span>
      </div>
      <div class="info-grid" style="margin-top:10px;">
        <div class="info-item"><label>Ward</label><span>${complaint.location.ward}</span></div>
        <div class="info-item"><label>Pincode</label><span>${complaint.location.pincode}</span></div>
      </div>
    </div>` : ''}

    <div class="detail-section">
      <div class="detail-section-title">Timeline</div>
      <div class="timeline">${timelineHtml}</div>
    </div>
  `;

  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}


let mcPage = 1;
function renderMyComplaints(page = 1) {
  mcPage = page;
  const status = document.getElementById('mc-status').value;
  const category = document.getElementById('mc-category').value;
  const result = Backend.getMyComplaints({ status, category, page: mcPage, limit: 5 });
  const list = document.getElementById('mc-list');

  if (!result.data.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📭</div><h3>No complaints found</h3><p>Try different filters or raise a new grievance.</p></div>`;
  } else {
    list.innerHTML = result.data.map(c => renderCard(c)).join('');
  }
  renderPagination('mc-pagination', result.pages, mcPage, renderMyComplaints);
}


let nbPage = 1;
function renderNearby(page = 1) {
  nbPage = page;
  const lat = parseFloat(document.getElementById('nb-lat').value);
  const lng = parseFloat(document.getElementById('nb-lng').value);
  const radius = parseFloat(document.getElementById('nb-radius').value);
  const status = document.getElementById('nb-status').value;
  const category = document.getElementById('nb-category').value;
  const list = document.getElementById('nb-list');

  if (isNaN(lat) || isNaN(lng)) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📡</div><h3>Enter your location</h3><p>Use "Use My Location" or enter coordinates above.</p></div>`;
    return;
  }

  const result = Backend.getNearbyIssues({ lat, lng, radiusKm: radius, status, category, page: nbPage, limit: 10 });

  if (!result.data.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><h3>No issues found nearby</h3><p>Try expanding the search radius.</p></div>`;
  } else {
    list.innerHTML = result.data.map(c => renderCard(c, true)).join('');
  }

  initNearbyMap();
  renderPagination('nb-pagination', result.pages, nbPage, renderNearby);
}

function locateMe() {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('nb-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('nb-lng').value = pos.coords.longitude.toFixed(6);

      const pincodeEl = document.getElementById('nb-pincode');
      const matchedPincode = findPincodeForCoords(pos.coords.latitude, pos.coords.longitude);
      if (matchedPincode) pincodeEl.value = matchedPincode;
      else pincodeEl.value = '';
      renderNearby();
    },
    () => alert('Location permission denied. Please enter a pincode manually.')
  );
}


function lookupStatus() {
  const id = document.getElementById('st-id').value.trim();
  const result = document.getElementById('st-result');

  if (!id) {
    result.innerHTML = `<div class="empty-state"><div class="icon">🔎</div><h3>Enter a Complaint ID</h3></div>`;
    return;
  }

  const complaint = Backend.getComplaintStatus(id);

  if (!complaint) {
    result.innerHTML = `<div class="empty-state"><div class="icon">❌</div><h3>Complaint not found</h3><p>Check the ID and try again.</p></div>`;
    return;
  }

  result.innerHTML = renderCard(complaint);

  openDetail(id);
}


document.getElementById('st-id').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupStatus();
});


function renderPagination(containerId, pages, current, callback) {
  const el = document.getElementById(containerId);
  if (pages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="${callback.name}(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}


document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const pageName = tab.dataset.page;
    document.getElementById('page-' + pageName).classList.add('active');


    if (pageName === "nearby") {
      initNearbyMap();
    }
  });
});


function closePanel() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}
document.getElementById('closePanel').addEventListener('click', closePanel);
document.getElementById('overlay').addEventListener('click', closePanel);


const PINCODE_COORDS = {
  // Delhi & NCR
  '110001': { lat: 28.6139, lng: 77.2090, label: 'Connaught Place, New Delhi' },
  '110002': { lat: 28.6200, lng: 77.2100, label: 'Darya Ganj, New Delhi' },
  '110003': { lat: 28.6100, lng: 77.2050, label: 'Civil Lines, New Delhi' },
  '110004': { lat: 28.6020, lng: 77.2070, label: 'President Estate, New Delhi' },
  '110005': { lat: 28.6340, lng: 77.2180, label: 'Kamla Nagar, New Delhi' },
  '110006': { lat: 28.6545, lng: 77.2250, label: 'Delhi University, New Delhi' },
  '110007': { lat: 28.6670, lng: 77.2160, label: 'Model Town, New Delhi' },
  '110008': { lat: 28.6528, lng: 77.1979, label: 'Patel Nagar, New Delhi' },
  '110009': { lat: 28.6415, lng: 77.2020, label: 'Paharganj, New Delhi' },
  '110010': { lat: 28.5900, lng: 77.2090, label: 'Pragati Maidan, New Delhi' },
  '110011': { lat: 28.5991, lng: 77.1900, label: 'Moti Bagh, New Delhi' },
  '110016': { lat: 28.5700, lng: 77.1800, label: 'Hauz Khas, New Delhi' },
  '110020': { lat: 28.5672, lng: 77.2100, label: 'Nehru Place, New Delhi' },
  '110025': { lat: 28.5400, lng: 77.2500, label: 'Okhla, New Delhi' },
  '110044': { lat: 28.5600, lng: 77.2800, label: 'Sarita Vihar, New Delhi' },
  '110048': { lat: 28.5494, lng: 77.1850, label: 'Saket, New Delhi' },
  '110049': { lat: 28.5615, lng: 77.1860, label: 'Green Park, New Delhi' },
  '110058': { lat: 28.6256, lng: 77.0945, label: 'Janakpuri, New Delhi' },
  '110065': { lat: 28.5170, lng: 77.2520, label: 'Kalkaji, New Delhi' },
  '110075': { lat: 28.5823, lng: 77.0500, label: 'Dwarka, New Delhi' },
  '110085': { lat: 28.7256, lng: 77.1205, label: 'Rohini, New Delhi' },
  '110092': { lat: 28.6538, lng: 77.2990, label: 'Shahdara, New Delhi' },

  // Mumbai & Maharashtra
  '400001': { lat: 18.9388, lng: 72.8354, label: 'Fort, Mumbai' },
  '400020': { lat: 18.9322, lng: 72.8264, label: 'Churchgate, Mumbai' },
  '400050': { lat: 19.0640, lng: 72.8400, label: 'Bandra West, Mumbai' },
  '400051': { lat: 19.0558, lng: 72.8526, label: 'Bandra East, Mumbai' },
  '400053': { lat: 19.1136, lng: 72.8348, label: 'Andheri West, Mumbai' },
  '400076': { lat: 19.1176, lng: 72.9060, label: 'Powai, Mumbai' },
  '400092': { lat: 19.2288, lng: 72.8541, label: 'Borivali West, Mumbai' },
  '411001': { lat: 18.5204, lng: 73.8567, label: 'Pune GPO' },

  // Hyderabad & Telangana
  '500001': { lat: 17.3850, lng: 78.4867, label: 'Hyderabad GPO' },
  '500032': { lat: 17.4401, lng: 78.3489, label: 'Gachibowli, Hyderabad' },
  '500033': { lat: 17.4156, lng: 78.4347, label: 'Banjara Hills, Hyderabad' },
  '500034': { lat: 17.4300, lng: 78.4063, label: 'Jubilee Hills, Hyderabad' },
  '500081': { lat: 17.4435, lng: 78.3772, label: 'HITEC City, Hyderabad' },

  // Bangalore & Karnataka
  '560001': { lat: 12.9716, lng: 77.5946, label: 'Bangalore GPO' },
  '560004': { lat: 12.9406, lng: 77.5738, label: 'Basavanagudi, Bangalore' },
  '560011': { lat: 12.9250, lng: 77.5938, label: 'Jayanagar, Bangalore' },
  '560034': { lat: 12.9279, lng: 77.6271, label: 'Koramangala, Bangalore' },
  '560037': { lat: 12.9591, lng: 77.7126, label: 'Marathahalli, Bangalore' },
  '560038': { lat: 12.9784, lng: 77.6408, label: 'Indiranagar, Bangalore' },
  '560066': { lat: 12.9698, lng: 77.7499, label: 'Whitefield, Bangalore' },

  // Others
  '600001': { lat: 13.0827, lng: 80.2707, label: 'Chennai GPO' },
  '700001': { lat: 22.5726, lng: 88.3639, label: 'Kolkata GPO' },
  '302001': { lat: 26.9124, lng: 75.7873, label: 'Jaipur GPO' },
  '226001': { lat: 26.8467, lng: 80.9462, label: 'Lucknow GPO' },
  '380001': { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad GPO' },
};

function findPincodeForCoords(lat, lng) {
  let bestPincode = null;
  let bestDist = Infinity;
  for (const [pin, coords] of Object.entries(PINCODE_COORDS)) {
    const d = haversineKm(lat, lng, coords.lat, coords.lng);
    if (d < bestDist) { bestDist = d; bestPincode = pin; }
  }
  return bestDist < 15 ? bestPincode : null;
}

function searchByPincode() {
  const pincode = document.getElementById('nb-pincode').value.trim();
  if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    alert('Please enter a valid 6-digit Indian pincode.');
    return;
  }
  const coords = PINCODE_COORDS[pincode];
  if (!coords) {
    alert('Pincode not found in our database. Try using "Use My Location" for GPS-based search.');
    return;
  }
  document.getElementById('nb-lat').value = coords.lat;
  document.getElementById('nb-lng').value = coords.lng;
  renderNearby();
}



let nearbyMap = null;
let markersLayer = null;

function initNearbyMap() {
  const lat = parseFloat(document.getElementById('nb-lat').value);
  const lng = parseFloat(document.getElementById('nb-lng').value);

  if (isNaN(lat) || isNaN(lng)) {

    return;
  }


  if (!nearbyMap) {
    nearbyMap = L.map("map").setView([lat, lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(nearbyMap);
  } else {
    nearbyMap.setView([lat, lng], 14);
  }


  if (markersLayer) {
    nearbyMap.removeLayer(markersLayer);
  }
  markersLayer = L.layerGroup().addTo(nearbyMap);


  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `<div style="
            width: 18px; height: 18px;
            background: #1a3a6b;
            border: 3px solid #fff;
            border-radius: 50%;
            box-shadow: 0 0 0 3px rgba(26,58,107,0.3), 0 2px 8px rgba(0,0,0,0.25);
        "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
  L.marker([lat, lng], { icon: userIcon })
    .addTo(markersLayer)
    .bindPopup('<strong>📍 Your Location</strong>');


  const statusColors = {
    'Submitted': '#718096',
    'Under Review': '#d4770b',
    'In Progress': '#1a3a6b',
    'Resolved': '#006937',
    'Rejected': '#c0392b'
  };


  const radius = parseFloat(document.getElementById('nb-radius').value) || 2;
  DB.complaints.forEach(c => {
    if (!c.location) return;
    const dist = haversineKm(lat, lng, c.location.lat, c.location.lng);
    if (dist > radius) return;

    const color = statusColors[c.status] || '#718096';
    const markerIcon = L.divIcon({
      className: 'complaint-marker',
      html: `<div style="
                width: 14px; height: 14px;
                background: ${color};
                border: 2.5px solid #fff;
                border-radius: 50%;
                box-shadow: 0 1px 6px rgba(0,0,0,0.3);
                cursor: pointer;
            "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    L.marker([c.location.lat, c.location.lng], { icon: markerIcon })
      .addTo(markersLayer)
      .bindPopup(`
                <div style="font-family:'DM Sans',sans-serif;min-width:180px;">
                    <strong style="font-size:0.9rem;">${c.title}</strong><br/>
                    <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;color:#fff;background:${color};">${c.status}</span><br/>
                    <span style="font-size:0.78rem;color:#4a5568;margin-top:3px;display:block;">${c.category} · ${c.location.address}</span>
                    <span style="font-size:0.72rem;color:#718096;">${dist.toFixed(2)} km away</span>
                </div>
            `);
  });


  const bounds = markersLayer.getLayers().map(l => l.getLatLng && l.getLatLng()).filter(Boolean);
  if (bounds.length > 1) {
    nearbyMap.fitBounds(L.latLngBounds(bounds).pad(0.1));
  }

  setTimeout(() => nearbyMap.invalidateSize(), 150);
}

/* ================================================================
   EXPORT FUNCTIONS TO GLOBAL SCOPE
   Since this is a type="module", HTML onclick handlers won't find 
   these functions natively.
================================================================ */
window.renderMyComplaints = renderMyComplaints;
window.renderNearby = renderNearby;
window.locateMe = locateMe;
window.searchByPincode = searchByPincode;
window.lookupStatus = lookupStatus;
window.openDetail = openDetail;

/* NOTE: Initial render is triggered by the Firebase onSnapshot callback above.
   If Firebase is unavailable, the error handler also calls renderMyComplaints(). */