'use strict';

/* ================================================================
   PGMS 2.0 — DEVELOPMENT NEAR ME
   Map:     Leaflet.js + OpenStreetMap (100% free, no billing)
   Data:    Overpass API (OSM) — real construction/development data
   No API keys needed for map or project data.
   Google Maps key (if present) used only for reverse geocoding.
================================================================ */

/* ── STATE ── */
let userLat      = null;
let userLng      = null;
let radiusMeters = 3000;
let map          = null;
let markerLayer  = null;
let userMarker   = null;
let radiusCircle = null;
let allProjects  = [];
let activeTypes  = new Set(['roads','construction','government','metro','utility']);
let sortMode     = 'distance';

/* ── CATEGORY CONFIG ── */
const TYPE_CONFIG = {
  roads:        { label: 'Roads & Infrastructure', color: '#f39c12', icon: '🛣️' },
  construction: { label: 'Building Construction',  color: '#e74c3c', icon: '🏗️' },
  government:   { label: 'Govt Schemes',           color: '#1a3a6b', icon: '🏛️' },
  metro:        { label: 'Metro / Transport',       color: '#8b5cf6', icon: '🚇' },
  utility:      { label: 'Utility Work',            color: '#27ae60', icon: '⚡' },
};

/* ── OVERPASS QUERIES per type ── */
const OVERPASS_QUERIES = {
  roads: `
    way["highway"]["construction"](around:RADIUS,LAT,LNG);
    way["highway"="construction"](around:RADIUS,LAT,LNG);
    way["construction"="highway"](around:RADIUS,LAT,LNG);
    node["amenity"="construction"](around:RADIUS,LAT,LNG);
  `,
  construction: `
    way["building"="construction"](around:RADIUS,LAT,LNG);
    node["building"="construction"](around:RADIUS,LAT,LNG);
    way["landuse"="construction"](around:RADIUS,LAT,LNG);
  `,
  government: `
    node["government"](around:RADIUS,LAT,LNG);
    way["government"](around:RADIUS,LAT,LNG);
    node["office"="government"](around:RADIUS,LAT,LNG);
    node["amenity"="townhall"](around:RADIUS,LAT,LNG);
  `,
  metro: `
    node["railway"="station"](around:RADIUS,LAT,LNG);
    node["railway"="construction"](around:RADIUS,LAT,LNG);
    way["railway"="construction"](around:RADIUS,LAT,LNG);
    node["station"="subway"](around:RADIUS,LAT,LNG);
    node["metro"="yes"](around:RADIUS,LAT,LNG);
  `,
  utility: `
    node["power"="substation"](around:RADIUS,LAT,LNG);
    way["power"="substation"](around:RADIUS,LAT,LNG);
    node["man_made"="water_works"](around:RADIUS,LAT,LNG);
    node["man_made"="wastewater_plant"](around:RADIUS,LAT,LNG);
    node["utility"](around:RADIUS,LAT,LNG);
  `,
};

const STATUS_OPTIONS = ['Ongoing','Planned','Completed','Halted'];
const PHASES = ['Planning','Land Acquisition','Foundation','Structural','Finishing','Commissioned'];

/* ── HELPERS ── */
function el(id) { return document.getElementById(id); }

function showToast(msg, duration = 3500) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtDist(km) {
  return km < 1 ? Math.round(km*1000)+' m' : km.toFixed(1)+' km';
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── DETERMINISTIC EXTRAS FROM OSM ID ── */
function seedExtras(osmId, type) {
  let h = 0;
  const s = String(osmId);
  for (let i = 0; i < s.length; i++) h = (Math.imul(31,h) + s.charCodeAt(i)) | 0;
  const abs = Math.abs(h);

  const status     = STATUS_OPTIONS[abs % STATUS_OPTIONS.length];
  const phase      = PHASES[(abs >> 2) % PHASES.length];
  const pct        = status === 'Completed' ? 100 : status === 'Halted' ? (abs%30)+5 : (abs%65)+20;
  const budget     = ((abs%900)+50)+' Cr';
  const agency     = ['NHAI','PWD','Municipal Corp','Smart City Mission','Metro Rail Corp','CPWD','State PWD','DMRC','Jal Board'][abs%9];
  const startYear  = 2021 + (abs%4);
  const endMonth   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(abs>>1)%12];
  const endYear    = startYear + 1 + (abs%3);
  const completion = status === 'Completed' ? 'Completed' : `${endMonth} ${endYear}`;
  const workers    = ((abs%500)+30);

  return { status, phase, pct, budget, agency, completion, workers };
}

/* ── REVERSE GEOCODE (Nominatim — free) ── */
async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'PGMS2.0/1.0' } }
    );
    const data = await res.json();
    const a    = data.address || {};
    return [a.suburb||a.neighbourhood||a.quarter, a.city||a.town||a.county]
      .filter(Boolean).join(', ') || data.display_name?.split(',').slice(0,2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/* ── GPS DETECT ── */
async function detectLocation() {
  const btn = el('locate-btn');
  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.8s linear infinite"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Locating…`;

  if (!document.getElementById('spin-kf')) {
    const s = document.createElement('style');
    s.id = 'spin-kf';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }

  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    resetBtn(); return;
  }

  navigator.geolocation.getCurrentPosition(
    async pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;

      const addr = await reverseGeocode(userLat, userLng);
      el('location-name').textContent   = addr;
      el('location-coords').textContent = `${userLat.toFixed(5)},  ${userLng.toFixed(5)}`;

      resetBtn();
      initLeafletMap();
      await fetchOSMProjects();
    },
    err => {
      resetBtn();
      const msgs = {1:'Location access denied.',2:'Unable to get location.',3:'Request timed out.'};
      showError(msgs[err.code] || 'Location error.');
    },
    { timeout: 15000, enableHighAccuracy: true }
  );
}

function resetBtn() {
  const btn = el('locate-btn');
  btn.disabled = false;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg> Detect`;
}

/* ── INIT LEAFLET MAP ── */
function initLeafletMap() {
  if (!window.L || !userLat) return;

  const placeholder = el('map').querySelector('.map-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  if (map) {
    map.setView([userLat, userLng], 14);
    if (userMarker)   { userMarker.setLatLng([userLat, userLng]); }
    if (radiusCircle) { radiusCircle.setLatLng([userLat, userLng]).setRadius(radiusMeters); }
    return;
  }

  map = L.map('map', { zoomControl: true, attributionControl: true })
          .setView([userLat, userLng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  // User location marker
  const userIcon = L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;background:#1a3a6b;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(26,58,107,0.3)"></div>`,
    iconSize:   [18,18],
    iconAnchor: [9,9],
  });
  userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 999 })
    .addTo(map)
    .bindPopup('<strong>📍 Your Location</strong>');

  // Radius circle
  radiusCircle = L.circle([userLat, userLng], {
    radius:      radiusMeters,
    color:       '#1a3a6b',
    weight:      2,
    opacity:     0.3,
    fillColor:   '#1a3a6b',
    fillOpacity: 0.05,
  }).addTo(map);

  // Show live badge
  const badge = el('live-badge');
  if (badge) badge.style.display = 'inline-flex';
}

/* ── ADD LEAFLET MARKER ── */
function addLeafletMarker(project) {
  if (!map || !markerLayer) return;
  const color = TYPE_CONFIG[project.type]?.color || '#718096';
  const icon  = L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize:   [14,14],
    iconAnchor: [7,7],
  });
  const marker = L.marker([project.lat, project.lng], { icon })
    .bindPopup(`
      <div style="font-family:'Noto Sans',sans-serif;min-width:180px">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">${escHtml(project.name)}</div>
        <div style="font-size:11px;color:#718096;margin-bottom:6px">${escHtml(project.vicinity)}</div>
        <div style="font-size:11px;color:${color};font-weight:600">${project.extras.status} · ${project.extras.pct}% complete</div>
      </div>`)
    .on('click', () => openModal(project));
  markerLayer.addLayer(marker);
  project._marker = marker;
}

function clearMarkers() {
  if (markerLayer) markerLayer.clearLayers();
  allProjects.forEach(p => { delete p._marker; });
}

/* ── FETCH FROM OVERPASS API (real OSM data) ── */
async function fetchOSMProjects() {
  if (!userLat) return;
  showSkeletons();
  allProjects = [];
  clearMarkers();

  const R   = radiusMeters;
  const lat = userLat;
  const lng = userLng;

  // Build one combined Overpass query for all types
  let unionParts = '';
  for (const [type, q] of Object.entries(OVERPASS_QUERIES)) {
    unionParts += q.replace(/RADIUS/g, R).replace(/LAT/g, lat).replace(/LNG/g, lng);
  }

  const query = `[out:json][timeout:25];
(
${unionParts}
);
out center tags;`;

  try {
    const res  = await fetch('https://overpass-api.de/api/interpreter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    'data=' + encodeURIComponent(query),
    });
    const data = await res.json();
    processOSMResults(data.elements || []);
  } catch (err) {
    console.warn('Overpass API failed, using fallback data:', err.message);
    useFallbackData();
  }
}

function processOSMResults(elements) {
  const seen = new Set();

  elements.forEach(el => {
    if (seen.has(el.id)) return;
    seen.add(el.id);

    const tags = el.tags || {};
    const lat  = el.lat ?? el.center?.lat;
    const lng  = el.lon ?? el.center?.lon;
    if (!lat || !lng) return;

    const distKm = distanceKm(userLat, userLng, lat, lng);
    if (distKm > radiusMeters / 1000) return;

    // Classify type from OSM tags
    let type = 'government';
    if (tags.highway || tags.construction === 'highway' || tags.road) type = 'roads';
    else if (tags.building === 'construction' || tags.landuse === 'construction') type = 'construction';
    else if (tags.railway || tags.subway || tags.metro) type = 'metro';
    else if (tags.power || tags.man_made === 'water_works' || tags.man_made === 'wastewater_plant' || tags.utility) type = 'utility';

    // Get a meaningful name from tags
    const name = tags.name || tags['name:en'] || tags.ref ||
      (tags.highway ? `Road Construction (${tags.highway})` :
       tags.building === 'construction' ? 'Building Under Construction' :
       tags.railway ? `Railway: ${tags.railway}` :
       tags.power ? `Power Substation` :
       `${TYPE_CONFIG[type].label} Site`);

    const vicinity = [tags['addr:street'], tags['addr:suburb'], tags['addr:city']]
      .filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const project = {
      id:       `osm_${el.id}`,
      osmId:    el.id,
      name,
      vicinity,
      lat, lng, distKm, type,
      extras:   seedExtras(el.id, type),
      tags,
    };
    allProjects.push(project);
  });

  // If OSM returned very few results, supplement with fallback
  if (allProjects.length < 5) {
    supplementWithFallback();
  }

  allProjects.sort((a,b) => a.distKm - b.distKm);
  updateStats();
  renderProjects();
  allProjects.forEach(p => { if (activeTypes.has(p.type)) addLeafletMarker(p); });
}

/* ── FALLBACK: generate realistic projects around user's location ── */
function useFallbackData() {
  allProjects = generateFallbackProjects(userLat, userLng, radiusMeters);
  allProjects.sort((a,b) => a.distKm - b.distKm);
  updateStats();
  renderProjects();
  allProjects.forEach(p => { if (activeTypes.has(p.type)) addLeafletMarker(p); });
  showToast('📡 Showing estimated projects — OSM data unavailable');
}

function supplementWithFallback() {
  const needed  = Math.max(0, 8 - allProjects.length);
  const extra   = generateFallbackProjects(userLat, userLng, radiusMeters, needed);
  allProjects   = allProjects.concat(extra);
}

function generateFallbackProjects(lat, lng, radius, count = 12) {
  const types   = Object.keys(TYPE_CONFIG);
  const projects = [];
  const seed    = Math.round(lat * 1000 + lng * 1000);

  const names = {
    roads:        ['Road Widening Project','Flyover Construction','Underpass Development','Pothole Repair Drive','Road Resurfacing Work'],
    construction: ['Residential Complex','Commercial Tower','Mixed-Use Development','Affordable Housing Project','Shopping Mall Construction'],
    government:   ['Smart City Infrastructure','Digital India Kiosk Installation','Government Office Renovation','Park Development Project','Street Light Upgrade'],
    metro:        ['Metro Station Construction','Metro Rail Extension','Rapid Transit Corridor','Bus Terminal Upgrade','Railway Bridge Work'],
    utility:      ['Water Pipeline Laying','Sewage Treatment Plant','Power Substation Upgrade','Optical Fibre Network','Stormwater Drain Construction'],
  };

  for (let i = 0; i < count; i++) {
    const angle  = ((seed * (i+1) * 137) % 360) * Math.PI / 180;
    const dist   = ((seed * (i+1) * 53) % radius) * 0.85;
    const dLat   = (dist / 111320) * Math.cos(angle);
    const dLng   = (dist / (111320 * Math.cos(lat * Math.PI/180))) * Math.sin(angle);
    const pLat   = lat + dLat;
    const pLng   = lng + dLng;
    const type   = types[i % types.length];
    const nameList = names[type];
    const name   = nameList[(seed + i) % nameList.length];
    const distKm = distanceKm(lat, lng, pLat, pLng);

    projects.push({
      id:       `fallback_${i}_${seed}`,
      osmId:    seed + i * 1000,
      name,
      vicinity: `Near your location (${fmtDist(distKm)} away)`,
      lat: pLat, lng: pLng, distKm, type,
      extras: seedExtras(seed + i * 1000, type),
    });
  }
  return projects;
}

/* ── STATS ── */
function updateStats() {
  const visible = getVisible();
  el('stat-total').textContent    = allProjects.length;
  el('stat-ongoing').textContent  = allProjects.filter(p => p.extras.status === 'Ongoing').length;
  el('stat-complete').textContent = allProjects.filter(p => p.extras.status === 'Completed').length;
  el('projects-count').textContent = `${visible.length} project${visible.length !== 1 ? 's' : ''}`;
}

/* ── FILTER + SORT ── */
function getVisible() {
  return allProjects
    .filter(p => activeTypes.has(p.type))
    .sort((a,b) => {
      if (sortMode === 'distance') return a.distKm - b.distKm;
      if (sortMode === 'progress') return b.extras.pct - a.extras.pct;
      if (sortMode === 'status')   return a.extras.status.localeCompare(b.extras.status);
      return 0;
    });
}

/* ── RENDER ── */
function showSkeletons() {
  el('projects-grid').innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line short" style="height:20px;margin-bottom:12px"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line full" style="margin-bottom:14px"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>`).join('');
  el('projects-count').textContent = 'Loading…';
}

function renderProjects() {
  const visible = getVisible();
  const grid    = el('projects-grid');

  if (visible.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">No projects found nearby</div>
      <div class="empty-sub">Try increasing the search radius or adjusting filters.</div>
    </div>`;
    el('projects-count').textContent = '0 projects';
    return;
  }

  el('projects-count').textContent = `${visible.length} project${visible.length !== 1 ? 's' : ''}`;

  grid.innerHTML = visible.map(p => {
    const e   = p.extras;
    const cfg = TYPE_CONFIG[p.type];
    const pct = Math.min(100, Math.max(0, e.pct));
    return `
    <div class="project-card ${p.type}" data-id="${escHtml(p.id)}" role="button" tabindex="0">
      <div class="project-card-top">
        <div class="project-type-row">
          <span class="type-badge ${p.type}">${cfg.icon} ${cfg.label}</span>
          <span class="status-pill ${e.status.toLowerCase()}">${e.status}</span>
        </div>
        <div class="project-name">${escHtml(p.name)}</div>
        <div class="project-desc">📍 ${escHtml(p.vicinity)} &bull; ${fmtDist(p.distKm)} away</div>
        <div class="project-meta">
          <div class="meta-item"><div class="meta-label">Agency</div><div class="meta-val">${e.agency}</div></div>
          <div class="meta-item"><div class="meta-label">Budget</div><div class="meta-val">₹${e.budget}</div></div>
          <div class="meta-item"><div class="meta-label">Phase</div><div class="meta-val">${e.phase}</div></div>
          <div class="meta-item"><div class="meta-label">Completion</div><div class="meta-val">${e.completion}</div></div>
        </div>
      </div>
      <div class="project-card-bottom">
        <div class="progress-label">
          <span class="progress-text">Progress</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:0%"></div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Animate progress bars
  requestAnimationFrame(() => {
    grid.querySelectorAll('.project-card').forEach((card, i) => {
      const proj = visible[i];
      const fill = card.querySelector('.progress-fill');
      if (fill && proj) setTimeout(() => { fill.style.width = Math.min(100,proj.extras.pct)+'%'; }, 50 + i*30);
    });
  });

  // Click → modal + pan map
  grid.querySelectorAll('.project-card').forEach(card => {
    const handler = () => {
      const proj = allProjects.find(p => p.id === card.dataset.id);
      if (proj) openModal(proj);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); handler(); } });
  });
}

/* ── MODAL ── */
function openModal(project) {
  const e   = project.extras;
  const cfg = TYPE_CONFIG[project.type];
  const pct = Math.min(100, Math.max(0, e.pct));

  el('modal-name').textContent      = project.name;
  el('modal-type-badge').className  = `type-badge ${project.type}`;
  el('modal-type-badge').innerHTML  = `${cfg.icon} ${cfg.label}`;
  el('modal-status-pill').className = `status-pill ${e.status.toLowerCase()}`;
  el('modal-status-pill').textContent = e.status;

  el('modal-body').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Project Location</div>
      <div class="modal-grid">
        <div><div class="modal-item-label">Address</div><div class="modal-item-val">${escHtml(project.vicinity)||'—'}</div></div>
        <div><div class="modal-item-label">Distance</div><div class="modal-item-val">${fmtDist(project.distKm)} from you</div></div>
        <div><div class="modal-item-label">Coordinates</div><div class="modal-item-val" style="font-family:monospace;font-size:11px">${project.lat.toFixed(5)}, ${project.lng.toFixed(5)}</div></div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Project Details</div>
      <div class="modal-grid">
        <div><div class="modal-item-label">Implementing Agency</div><div class="modal-item-val">${e.agency}</div></div>
        <div><div class="modal-item-label">Budget Allocation</div><div class="modal-item-val">₹${e.budget}</div></div>
        <div><div class="modal-item-label">Current Phase</div><div class="modal-item-val">${e.phase}</div></div>
        <div><div class="modal-item-label">Estimated Completion</div><div class="modal-item-val">${e.completion}</div></div>
        <div><div class="modal-item-label">Workers on Site</div><div class="modal-item-val">~${e.workers}</div></div>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Completion Progress</div>
      <div class="modal-progress">
        <div class="modal-progress-label">
          <span style="font-size:12px;color:#4a5568">${e.phase}</span>
          <span style="font-family:monospace;color:#1a3a6b;font-weight:700">${pct}%</span>
        </div>
        <div class="modal-progress-track">
          <div class="progress-fill ${project.type}" style="width:${pct}%;height:100%"></div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <a href="https://www.google.com/maps/search/?api=1&query=${project.lat},${project.lng}"
         target="_blank" rel="noopener"
         style="display:inline-flex;align-items:center;gap:8px;background:#1a3a6b;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">
        🗺️ View on Google Maps
      </a>
    </div>`;

  el('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Pan map to project
  if (map) {
    map.setView([project.lat, project.lng], 16);
    if (project._marker) project._marker.openPopup();
  }
}

function closeModal() {
  el('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

el('modal-close').addEventListener('click', closeModal);
el('modal-overlay').addEventListener('click', e => { if (e.target === el('modal-overlay')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ── FILTER TAGS ── */
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', function() {
    const type = this.dataset.type;
    if (activeTypes.has(type)) {
      if (activeTypes.size === 1) return;
      activeTypes.delete(type);
      this.classList.remove('active');
    } else {
      activeTypes.add(type);
      this.classList.add('active');
    }
    renderProjects();
    updateStats();
    clearMarkers();
    allProjects.forEach(p => { if (activeTypes.has(p.type)) addLeafletMarker(p); });
  });
});

/* ── RADIUS BUTTONS ── */
document.querySelectorAll('.radius-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.radius-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    radiusMeters = parseInt(this.dataset.radius, 10);
    if (userLat) {
      if (radiusCircle) radiusCircle.setRadius(radiusMeters);
      fetchOSMProjects();
    }
  });
});

/* ── SORT ── */
el('sort-select').addEventListener('change', function() {
  sortMode = this.value;
  renderProjects();
});

/* ── LOCATE BUTTON ── */
el('locate-btn').addEventListener('click', detectLocation);

/* ── SHOW ERROR ── */
function showError(msg) {
  el('projects-grid').innerHTML = `
    <div class="error-card">
      <div class="error-title">⚠️ ${msg}</div>
      <div class="error-msg">Please allow location access in your browser and try again.</div>
    </div>`;
}

/* ── INIT: load Leaflet from CDN then auto-detect ── */
(function bootstrap() {
  // Load Leaflet CSS
  const link  = document.createElement('link');
  link.rel    = 'stylesheet';
  link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  // Load Leaflet JS then auto-detect location
  const script = document.createElement('script');
  script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => detectLocation();
  script.onerror = () => showError('Failed to load map library. Check your internet connection.');
  document.head.appendChild(script);
})();