'use strict';

/* ================================================================
   PGMS 2.0 — CITIZEN PORTAL SCRIPT
   Uses Firebase Firestore for persistent cross-device storage
================================================================ */

/* ================================================================
   1. DATA: Districts per State
================================================================ */
const DISTRICTS = {
  AN: ['South Andaman', 'North and Middle Andaman', 'Nicobar'],
  AP: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool', 'Nellore', 'Kakinada', 'Rajahmundry'],
  AR: ['Itanagar', 'Naharlagun', 'Tawang', 'Bomdila', 'Pasighat', 'Ziro'],
  AS: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Tezpur', 'Nagaon', 'Tinsukia'],
  BR: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Purnia', 'Darbhanga', 'Nalanda'],
  CH: ['Chandigarh'],
  CT: ['Raipur', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Korba', 'Jagdalpur'],
  DH: ['Dadra and Nagar Haveli', 'Daman', 'Diu'],
  DL: ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
  GA: ['North Goa', 'South Goa'],
  GJ: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Junagadh', 'Bhavnagar', 'Jamnagar', 'Anand'],
  HR: ['Gurugram', 'Faridabad', 'Hisar', 'Rohtak', 'Ambala', 'Karnal', 'Panipat', 'Sonipat'],
  HP: ['Shimla', 'Dharamsala', 'Mandi', 'Solan', 'Kullu', 'Una', 'Hamirpur'],
  JK: ['Jammu', 'Srinagar', 'Anantnag', 'Baramulla', 'Kupwara', 'Kathua', 'Udhampur'],
  JH: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih'],
  KA: ['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Kalaburagi', 'Davangere'],
  KL: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Malappuram', 'Alappuzha', 'Kannur'],
  LA: ['Leh', 'Kargil'],
  LD: ['Lakshadweep'],
  MP: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Rewa', 'Sagar', 'Satna'],
  MH: ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
  MN: ['Imphal West', 'Imphal East', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  ML: ['East Khasi Hills', 'Ri Bhoi', 'West Khasi Hills', 'East Jaintia Hills', 'East Garo Hills'],
  MZ: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib'],
  NL: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Mon'],
  OD: ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Rourkela', 'Sambalpur', 'Puri', 'Balasore'],
  PY: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'],
  PB: ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Gurdaspur'],
  RJ: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Alwar', 'Bharatpur'],
  SK: ['East Sikkim', 'West Sikkim', 'North Sikkim', 'South Sikkim'],
  TN: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'],
  TG: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Nalgonda'],
  TR: ['West Tripura', 'South Tripura', 'Gomati', 'Dhalai', 'North Tripura'],
  UP: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Noida', 'Meerut', 'Ghaziabad', 'Mathura', 'Bareilly'],
  UK: ['Dehradun', 'Haridwar', 'Nainital', 'Almora', 'Pauri Garhwal', 'Tehri Garhwal', 'Uttarkashi'],
  WB: ['Kolkata', 'Howrah', 'Hooghly', 'North 24 Parganas', 'South 24 Parganas', 'Darjeeling', 'Malda', 'Murshidabad'],
};

const DEPARTMENTS = {
  roads: ['Public Works Department (PWD)', 'National Highways Authority of India (NHAI)', 'Municipal Corporation – Roads Division', 'Urban Local Body (ULB)'],
  water: ['Water Supply & Sanitation Department', 'Jal Jeevan Mission', 'Municipal Water Works', 'Ground Water Authority'],
  electricity: ['State Electricity Distribution Company', 'Central Electricity Authority', 'DISCOMS / Power Distribution Unit'],
  sanitation: ['Municipal Corporation – Sanitation Wing', 'Swachh Bharat Mission (Urban/Rural)', 'Urban Local Body – Waste Management'],
  healthcare: ['State Health Department', 'District Hospital Administration', 'National Health Mission (NHM)', 'Primary Health Centre (PHC)'],
  education: ['State School Education Department', 'District Education Office', 'Samagra Shiksha Abhiyan', 'Higher Education Department'],
  police: ['State Police Headquarters', 'District Superintendent of Police (SP)', 'Commissioner of Police (Urban)', 'Internal Complaints Committee'],
  corruption: ['Central Vigilance Commission (CVC)', 'Lokayukta / Jan Lokpal', 'Central Bureau of Investigation (CBI)', 'State Anti-Corruption Bureau (ACB)'],
  other: ["District Collector / DM Office", "Chief Minister's Helpline (State)", "Prime Minister's Office (PMO)", 'Concerned Line Department'],
};

/* ================================================================
   PRIORITY MAP — category-based baseline (always used as fallback)
================================================================ */
const PRIORITY_MAP = {
  corruption: 'High',
  police: 'High',
  healthcare: 'High',
  electricity: 'Medium',
  water: 'Medium',
  roads: 'Medium',
  sanitation: 'Low',
  education: 'Low',
  other: 'Low'
};

/* ================================================================
   AI PRIORITY — completely silent, runs in the background.
   Calls /api/priority on our Node proxy so the Gemini key
   never appears in any frontend file or on GitHub.
   Also factors in how many times the issue was previously reported.
   Falls back gracefully to PRIORITY_MAP if AI/server is unavailable.
================================================================ */
async function getAIPriority(category, categoryName, title, description, stillUnresolved, reportedBefore, timesReported) {
  const baseline = PRIORITY_MAP[category] || 'Medium';
  try {
    const response = await fetch('/api/priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: categoryName, title, description, stillUnresolved, reportedBefore, timesReported })
    });
    if (!response.ok) throw new Error(`Proxy ${response.status}`);
    const data = await response.json();
    const priority = ['High', 'Medium', 'Low'].includes(data.priority) ? data.priority : baseline;
    return { priority, reason: data.reason || '', setBy: 'AI' };
  } catch (err) {
    console.warn('AI priority unavailable, using category baseline:', err.message);
    return { priority: baseline, reason: `Category-based priority (${categoryName})`, setBy: 'AI' };
  }
}

/* ================================================================
   2. STATE
================================================================ */
let currentStep = 1;
const TOTAL_STEPS = 4;
let uploadedPhotos = [];

/* ================================================================
   3. HELPERS
================================================================ */
function el(id) { return document.getElementById(id); }

function showToast(msg, duration = 3500) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function setError(inputId, message) {
  const input = el(inputId);
  const errSpan = el(inputId + '-err');
  if (!input) return;
  if (message) {
    input.classList.add('error');
    input.classList.remove('valid');
    input.setAttribute('aria-invalid', 'true');
    if (errSpan) errSpan.textContent = message;
  } else {
    input.classList.remove('error');
    input.classList.add('valid');
    input.removeAttribute('aria-invalid');
    if (errSpan) errSpan.textContent = '';
  }
}

function setSpanError(spanId, message) {
  const span = el(spanId);
  if (span) span.textContent = message;
}

/* ================================================================
   4. ERROR BANNER
================================================================ */
function showErrorBanner(stepNum, errors) {
  const section = el('form-step-' + stepNum);
  if (!section) return;
  const old = section.querySelector('.err-banner');
  if (old) old.remove();

  const banner = document.createElement('div');
  banner.className = 'err-banner';
  banner.setAttribute('role', 'alert');
  banner.innerHTML =
    `<div class="err-banner-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
     <div class="err-banner-body"><strong>Please fix the following before continuing:</strong><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul></div>
     <button type="button" class="err-banner-close" aria-label="Dismiss">&times;</button>`;

  const heading = section.querySelector('.section-heading');
  if (heading) heading.insertAdjacentElement('afterend', banner);
  else section.insertBefore(banner, section.firstChild);

  banner.querySelector('.err-banner-close').addEventListener('click', () => banner.remove());
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearBanner(stepNum) {
  const section = el('form-step-' + stepNum);
  if (!section) return;
  const banner = section.querySelector('.err-banner');
  if (banner) banner.remove();
}

/* ================================================================
   5. VALIDATION
================================================================ */
function validateStep1() {
  const errors = [];
  const name = el('full-name').value.trim();
  if (!name) { setError('full-name', 'Full name is required.'); errors.push('Full name is required.'); }
  else if (name.length < 3) { setError('full-name', 'Name must be at least 3 characters.'); errors.push('Full name must be at least 3 characters.'); }
  else if (!/^[a-zA-Z\s.,''`-]+$/.test(name)) { setError('full-name', 'Name may only contain letters and spaces.'); errors.push('Full name contains invalid characters.'); }
  else { setError('full-name', ''); }

  const mobile = el('mobile').value.trim();
  if (!mobile) { setError('mobile', 'Mobile number is required.'); errors.push('Mobile number is required.'); }
  else if (!/^[6-9]\d{9}$/.test(mobile)) { setError('mobile', 'Must be 10 digits starting with 6, 7, 8 or 9.'); errors.push('Mobile number must be 10 digits starting with 6–9.'); }
  else { setError('mobile', ''); }

  const email = el('email').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', 'Enter a valid email address.'); errors.push('Email address is invalid.'); }
  else { setError('email', ''); }

  const aadhaarEl = el('aadhaar');
  const aadhaarRaw = aadhaarEl.dataset.raw || aadhaarEl.value.replace(/[\sX]/gi, '');
  if (aadhaarRaw && !/^\d{12}$/.test(aadhaarRaw)) { setError('aadhaar', 'Aadhaar must be exactly 12 digits.'); errors.push('Aadhaar number must be 12 digits.'); }
  else { setError('aadhaar', ''); }
  return errors;
}

function validateStep2() {
  const errors = [];
  if (!el('state').value) { setError('state', 'Please select your state.'); errors.push('State is required.'); } else { setError('state', ''); }
  if (!el('district').value) { setError('district', 'Please select district.'); errors.push('District is required.'); } else { setError('district', ''); }
  if (!el('city').value.trim()) { setError('city', 'City / Town is required.'); errors.push('City / Town is required.'); } else { setError('city', ''); }
  const pin = el('pincode').value.trim();
  if (!pin) { setError('pincode', 'Pincode is required.'); errors.push('Pincode is required.'); }
  else if (!/^\d{6}$/.test(pin)) { setError('pincode', 'Pincode must be 6 digits.'); errors.push('Pincode must be 6 digits.'); }
  else { setError('pincode', ''); }
  if (!el('locality').value.trim()) { setError('locality', 'Area / Locality is required.'); errors.push('Area / Locality is required.'); } else { setError('locality', ''); }
  return errors;
}

function validateStep3() {
  const errors = [];
  if (!el('category').value) { setError('category', 'Please select a grievance category.'); errors.push('Grievance category is required.'); } else { setError('category', ''); }
  if (!el('department').value) { setError('department', 'Please select the department.'); errors.push('Department is required.'); } else { setError('department', ''); }
  const title = el('title').value.trim();
  if (!title) { setError('title', 'Grievance title is required.'); errors.push('Grievance title is required.'); }
  else if (title.length < 10) { setError('title', 'Title must be at least 10 characters.'); errors.push('Grievance title needs at least 10 characters.'); }
  else { setError('title', ''); }
  const desc = el('description').value.trim();
  if (!desc) { setError('description', 'Detailed description is required.'); errors.push('Description is required.'); }
  else if (desc.length < 50) { setError('description', `Minimum 50 characters required. Currently: ${desc.length}.`); errors.push(`Description is too short (${desc.length}/50 chars min).`); }
  else { setError('description', ''); }
  const dateVal = el('incident-date').value;
  if (!dateVal) { setError('incident-date', 'Date of incident is required.'); errors.push('Date of incident is required.'); }
  else if (new Date(dateVal) > new Date()) { setError('incident-date', 'Date cannot be in the future.'); errors.push('Date of incident cannot be in the future.'); }
  else { setError('incident-date', ''); }
  const stillUnresolved = document.querySelector('input[name="stillUnresolved"]:checked');
  if (!stillUnresolved) { setSpanError('unresolved-err', 'Please select Yes or No.'); errors.push('Please indicate if the issue is still unresolved.'); } else { setSpanError('unresolved-err', ''); }
  const reportedBefore = document.querySelector('input[name="reportedBefore"]:checked');
  if (!reportedBefore) { setSpanError('reported-err', 'Please select Yes or No.'); errors.push('Please indicate if you have reported this before.'); } else { setSpanError('reported-err', ''); }
  return errors;
}

function validateStep4() {
  const errors = [];
  if (!el('consent-truth').checked) { setSpanError('consent-truth-err', 'You must confirm the declaration.'); errors.push('Please confirm the declaration of truth.'); } else { setSpanError('consent-truth-err', ''); }
  if (!el('consent-contact').checked) { setSpanError('consent-contact-err', 'You must consent to be contacted.'); errors.push('Please consent to being contacted.'); } else { setSpanError('consent-contact-err', ''); }
  return errors;
}

/* ================================================================
   6. STEP NAVIGATION
================================================================ */
function showStep(stepNum) {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const sec = el('form-step-' + i);
    if (sec) {
      sec.style.display = (i === stepNum) ? 'block' : 'none';
      if (i === stepNum) sec.classList.remove('hidden');
      else sec.classList.add('hidden');
    }
  }
  currentStep = stepNum;
  updateProgressUI(stepNum);
  const target = el('form-step-' + stepNum);
  if (target) {
    const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top, behavior: 'smooth' });
  }
  if (stepNum === 4) buildReview();
}

function updateProgressUI(activeStep) {
  const fill = el('progress-fill');
  if (fill) fill.style.width = ((activeStep / TOTAL_STEPS) * 100) + '%';
  const bar = el('progress-bar');
  if (bar) bar.setAttribute('aria-valuenow', activeStep);

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const stepEl = el('step-nav-' + i);
    if (!stepEl) continue;
    const numEl = stepEl.querySelector('.step-num');
    stepEl.classList.remove('active', 'completed');
    stepEl.removeAttribute('aria-current');
    if (i === activeStep) {
      stepEl.classList.add('active');
      stepEl.setAttribute('aria-current', 'step');
      if (numEl) numEl.textContent = i;
    } else if (i < activeStep) {
      stepEl.classList.add('completed');
      if (numEl) numEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else {
      if (numEl) numEl.textContent = i;
    }
  }
}

document.addEventListener('click', function (e) {
  const nextBtn = e.target.closest('[data-next]');
  if (nextBtn) {
    const toStep = parseInt(nextBtn.dataset.next, 10);
    const fromStep = toStep - 1;
    handleNext(fromStep, toStep);
    return;
  }
  const prevBtn = e.target.closest('[data-prev]');
  if (prevBtn) {
    clearBanner(currentStep);
    showStep(parseInt(prevBtn.dataset.prev, 10));
  }
});

function handleNext(fromStep, toStep) {
  let errors = [];
  if (fromStep === 1) errors = validateStep1();
  else if (fromStep === 2) errors = validateStep2();
  else if (fromStep === 3) errors = validateStep3();

  if (errors.length > 0) {
    showErrorBanner(fromStep, errors);
    const section = el('form-step-' + fromStep);
    if (section) {
      const firstBad = section.querySelector('input.error, select.error, textarea.error');
      if (firstBad) setTimeout(() => firstBad.focus(), 300);
    }
  } else {
    clearBanner(fromStep);
    showStep(toStep);
  }
}

/* ================================================================
   7. STATE → DISTRICT
================================================================ */
el('state').addEventListener('change', function () {
  const code = this.value;
  const distEl = el('district');
  distEl.innerHTML = '<option value="">-- Select District --</option>';
  if (code && DISTRICTS[code]) {
    DISTRICTS[code].forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      distEl.appendChild(opt);
    });
    distEl.disabled = false;
  } else {
    distEl.disabled = true;
  }
  setError('state', '');
  setError('district', '');
});

/* ================================================================
   8. CATEGORY → DEPARTMENT
================================================================ */
el('category').addEventListener('change', function () {
  const cat = this.value;
  const deptEl = el('department');
  if (cat && DEPARTMENTS[cat]) {
    deptEl.innerHTML = '<option value="">-- Select Department --</option>';
    DEPARTMENTS[cat].forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      deptEl.appendChild(opt);
    });
  } else {
    deptEl.innerHTML = '<option value="">-- Select category first --</option>';
  }
  setError('category', '');
  setError('department', '');
});

/* ================================================================
   9. CHARACTER COUNTERS
================================================================ */
function updateCounter(inputEl, counterEl, max) {
  const len = inputEl.value.length;
  counterEl.textContent = len + ' / ' + max;
  counterEl.classList.remove('warning', 'limit');
  if (len >= max) counterEl.classList.add('limit');
  else if (len >= Math.floor(max * 0.85)) counterEl.classList.add('warning');
}
el('title').addEventListener('input', function () { updateCounter(this, el('title-count'), 100); });
el('description').addEventListener('input', function () {
  updateCounter(this, el('description-count'), 2000);
  if (this.value.trim().length >= 50) setError('description', '');
});

/* ================================================================
   10. MOBILE INPUT
================================================================ */
el('mobile').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 10); });
el('mobile').addEventListener('blur', function () {
  const v = this.value.trim();
  if (!v) return;
  if (!/^[6-9]\d{9}$/.test(v)) setError('mobile', 'Must be 10 digits starting with 6, 7, 8 or 9.');
  else setError('mobile', '');
});

/* ================================================================
   11. PINCODE
================================================================ */
el('pincode').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 6); });

/* ================================================================
   12. AADHAAR MASK
================================================================ */
const aadhaarEl = el('aadhaar');
aadhaarEl.addEventListener('input', function () {
  const digits = this.value.replace(/\D/g, '').slice(0, 12);
  this.dataset.raw = digits;
  this.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
});
aadhaarEl.addEventListener('blur', function () {
  const raw = this.dataset.raw || '';
  if (raw.length === 12) this.value = 'XXXX XXXX ' + raw.slice(8);
});
aadhaarEl.addEventListener('focus', function () {
  const raw = this.dataset.raw || '';
  if (raw) this.value = raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
});

/* ================================================================
   13. PHOTO UPLOAD
================================================================ */
const MAX_PHOTOS = 3, MAX_PHOTO_MB = 5;
el('photo-drop-zone').addEventListener('click', () => el('photo-upload').click());
el('photo-drop-zone').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el('photo-upload').click(); } });
el('photo-drop-zone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
el('photo-drop-zone').addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
el('photo-drop-zone').addEventListener('drop', e => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); handlePhotoFiles(e.dataTransfer.files); });
el('photo-upload').addEventListener('change', function () { handlePhotoFiles(this.files); this.value = ''; });

function handlePhotoFiles(files) {
  const errEl = el('photo-err');
  const msgs = [];
  Array.from(files).forEach(file => {
    if (uploadedPhotos.length >= MAX_PHOTOS) { msgs.push(`Max ${MAX_PHOTOS} photos allowed.`); return; }
    if (!['image/jpeg', 'image/png'].includes(file.type)) { msgs.push(`"${file.name}" must be JPG or PNG.`); return; }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { msgs.push(`"${file.name}" exceeds ${MAX_PHOTO_MB}MB.`); return; }
    uploadedPhotos.push(file);
    addPhotoPreview(file, uploadedPhotos.length - 1);
  });
  if (errEl) errEl.textContent = msgs.join(' ');
}

function addPhotoPreview(file, index) {
  const reader = new FileReader();
  reader.onload = ev => {
    const wrap = document.createElement('div');
    wrap.className = 'image-preview-item';
    wrap.dataset.index = index;
    const img = document.createElement('img');
    img.src = ev.target.result;
    img.alt = 'Photo ' + (index + 1);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'remove-btn'; btn.innerHTML = '&times;';
    btn.setAttribute('aria-label', 'Remove photo');
    btn.addEventListener('click', () => { uploadedPhotos.splice(index, 1); wrap.remove(); el('photo-err').textContent = ''; });
    wrap.appendChild(img); wrap.appendChild(btn);
    el('image-previews').appendChild(wrap);
  };
  reader.readAsDataURL(file);
}

/* ================================================================
   14. VIDEO UPLOAD
================================================================ */
const MAX_VIDEO_MB = 50;
el('video-drop-zone').addEventListener('click', () => el('video-upload').click());
el('video-drop-zone').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el('video-upload').click(); } });
el('video-drop-zone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
el('video-drop-zone').addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
el('video-drop-zone').addEventListener('drop', e => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); if (e.dataTransfer.files[0]) processVideoFile(e.dataTransfer.files[0]); });
el('video-upload').addEventListener('change', function () { if (this.files[0]) processVideoFile(this.files[0]); });

function processVideoFile(file) {
  const errEl = el('video-err');
  const nameEl = el('video-name-display');
  errEl.textContent = '';
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    errEl.textContent = `Video exceeds ${MAX_VIDEO_MB}MB. Please compress or shorten it.`;
    nameEl.classList.add('hidden');
    return;
  }
  const mb = (file.size / 1024 / 1024).toFixed(1);
  nameEl.innerHTML = `🎬 ${file.name} <span style="color:var(--clr-text-muted)">(${mb} MB)</span>`;
  nameEl.classList.remove('hidden');
}

/* ================================================================
   15. REVIEW SUMMARY
================================================================ */
function buildReview() {
  const grid = el('review-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const aEl = el('aadhaar');
  const aRaw = aEl.dataset.raw || '';
  const aDisplay = aRaw.length === 12 ? 'XXXX XXXX ' + aRaw.slice(8) : (aRaw ? aEl.value : '— Not provided');
  const stateEl = el('state');
  const stateName = stateEl.selectedIndex > 0 ? stateEl.options[stateEl.selectedIndex].text : '—';
  const catEl = el('category');
  const catName = catEl.selectedIndex > 0 ? catEl.options[catEl.selectedIndex].text : '—';
  const dateRaw = el('incident-date').value;
  const dateFmt = dateRaw ? new Date(dateRaw + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const uEl = document.querySelector('input[name="stillUnresolved"]:checked');
  const rEl = document.querySelector('input[name="reportedBefore"]:checked');

  const pairs = [
    ['Full Name', el('full-name').value.trim() || '—'],
    ['Mobile Number', '+91 ' + (el('mobile').value.trim() || '—')],
    ['Email', el('email').value.trim() || '— Not provided'],
    ['Aadhaar', aDisplay],
    ['State', stateName],
    ['District', el('district').value || '—'],
    ['City / Town', el('city').value.trim() || '—'],
    ['Pincode', el('pincode').value.trim() || '—'],
    ['Locality', el('locality').value.trim() || '—'],
    ['Landmark', el('landmark').value.trim() || '— Not provided'],
    ['Category', catName],
    ['Department', el('department').value || '—'],
    ['Date of Incident', dateFmt],
    ['Still Unresolved?', uEl ? (uEl.value === 'yes' ? 'Yes' : 'No') : '—'],
    ['Reported Before?', rEl ? (rEl.value === 'yes' ? 'Yes' : 'No') : '—'],
    ['Photos Attached', uploadedPhotos.length > 0 ? uploadedPhotos.length + ' photo(s)' : 'None'],
  ];
  const fullSpan = [
    ['Grievance Title', el('title').value.trim() || '—'],
    ['Description', el('description').value.trim() || '—'],
  ];
  pairs.forEach(p => addReviewItem(grid, p[0], p[1], false));
  fullSpan.forEach(p => addReviewItem(grid, p[0], p[1], true));
}

function addReviewItem(grid, key, val, wide) {
  const div = document.createElement('div');
  div.className = 'review-item' + (wide ? ' full-span' : '');
  const k = document.createElement('span'); k.className = 'review-key'; k.textContent = key;
  const v = document.createElement('span'); v.className = 'review-val'; v.textContent = val;
  div.appendChild(k); div.appendChild(v);
  grid.appendChild(div);
}

/* ================================================================
   16. CONSENT
================================================================ */
function checkConsent() {
  el('submit-btn').disabled = !(el('consent-truth').checked && el('consent-contact').checked);
}
el('consent-truth').addEventListener('change', checkConsent);
el('consent-contact').addEventListener('change', checkConsent);

/* ================================================================
   17. FORM SUBMIT → FIREBASE
================================================================ */
el('grievance-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errors = validateStep4();
  if (errors.length > 0) { showErrorBanner(4, errors); return; }

  const btn = el('submit-btn');
  btn.disabled = true;

  if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }
  const spinnerSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.8s linear infinite;flex-shrink:0"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;

  btn.innerHTML = `${spinnerSVG} Submitting…`;

  try {
    await submitToFirebase(btn, spinnerSVG);
  } catch (err) {
    console.error('Submit error:', err);
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> Submit Grievance`;
    showErrorBanner(4, ['Could not save grievance. Check your Firebase config and internet connection.']);
  }
});

async function submitToFirebase(btn, spinnerSVG) {
  const now = new Date();
  const stateCode = el('state').value || 'XX';
  const catVal = el('category').value || 'other';
  const catCode = catVal.slice(0, 3).toUpperCase();
  const rnd = Math.floor(10000000 + Math.random() * 90000000);
  const refId = `PGMS/${now.getFullYear()}/${stateCode}/${catCode}/${rnd}`;

  const stateEl = el('state');
  const stateName = stateEl.selectedIndex > 0 ? stateEl.options[stateEl.selectedIndex].text : stateCode;
  const catEl = el('category');
  const catName = catEl.selectedIndex > 0 ? catEl.options[catEl.selectedIndex].text : catVal;

  const title = el('title').value.trim();
  const description = el('description').value.trim();
  const mobile = '+91 ' + el('mobile').value.trim();
  const uEl = document.querySelector('input[name="stillUnresolved"]:checked');
  const rEl = document.querySelector('input[name="reportedBefore"]:checked');
  const stillUnresolved = uEl ? (uEl.value === 'yes' ? 'Yes' : 'No') : 'Unknown';
  const reportedBefore = rEl ? (rEl.value === 'yes' ? 'Yes' : 'No') : 'Unknown';

  // ── COUNT HOW MANY TIMES THIS MOBILE NUMBER HAS REPORTED THIS CATEGORY BEFORE ──
  // This gives AI the "times reported" signal to escalate repeat complaints
  let timesReported = 0;
  try {
    const prevSnap = await window.db.collection('complaints')
      .where('mobile', '==', mobile)
      .where('category', '==', catVal)
      .get();
    timesReported = prevSnap.size; // existing docs before this one
  } catch (e) {
    // non-fatal — AI will still work, just without repeat count
    console.warn('Could not fetch repeat count:', e.message);
  }

  // ── URGENT FLAG ──
  const isUrgent = document.getElementById('is-urgent')?.checked || false;

  // ── AI PRIORITY (silent — citizen sees nothing) ──
  let { priority, reason: priorityReason, setBy: prioritySetBy } = await getAIPriority(
    catVal, catName, title, description, stillUnresolved, reportedBefore, timesReported
  );

  // Override AI priority if citizen manually marks as urgent
  if (isUrgent) {
    priority = 'High';
    priorityReason = 'Citizen manually marked this grievance as URGENT (immediate risk to life/safety/infrastructure). ' + (priorityReason ? `[AI originally noted: ${priorityReason}]` : '');
    prioritySetBy = 'Citizen (Urgent Flag) + AI Override';
  }

  const complaint = {
    id: refId,
    aadhaar: el('aadhaar').dataset.raw || el('aadhaar').value.replace(/[\sX]/gi, ''),
    submittedAt: now.toISOString(),
    status: 'Pending',
    priority: priority,
    priorityReason: priorityReason,
    prioritySetBy: prioritySetBy,
    timesReported: timesReported,
    isUrgent: isUrgent,
    fullName: el('full-name').value.trim(),
    mobile: mobile,
    email: el('email').value.trim() || '—',
    state: stateName,
    stateCode: stateCode,
    district: el('district').value || '—',
    city: el('city').value.trim(),
    pincode: el('pincode').value.trim(),
    locality: el('locality').value.trim(),
    landmark: el('landmark').value.trim() || '—',
    category: catVal,
    categoryName: catName,
    department: el('department').value || '—',
    title: title,
    description: description,
    incidentDate: el('incident-date').value,
    stillUnresolved: stillUnresolved,
    reportedBefore: reportedBefore,
    photoCount: uploadedPhotos.length,
  };

  const docId = refId.replace(/\//g, '_');
  await window.db.collection('complaints').doc(docId).set(complaint);

  // ── SILENT AI ASSIGNMENT (runs in background, never shown to citizen) ──
  try {
    console.log('[ASSIGN] Calling /api/assign for', refId);
    const assignRes = await fetch('/api/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaintId: refId,
        category: catVal,
        categoryName: catName,
        title,
        description,
        priority: complaint.priority,
        district: complaint.district,
        state: complaint.state,
      }),
    });
    if (!assignRes.ok) throw new Error('Server returned ' + assignRes.status);
    const data = await assignRes.json();
    console.log('[ASSIGN] Server response:', data);
    const { assignments, workerTask } = data;
    const batch = window.db.batch();
    let hasAssignments = false;

    if (assignments && assignments.length) {
      console.log('[ASSIGN] Saving', assignments.length, 'assignments to Firestore…');
      assignments.forEach(a => {
        const aRef = window.db
          .collection('complaints').doc(docId)
          .collection('assignments').doc(a.id);
        batch.set(aRef, a);
      });
      hasAssignments = true;
    }

    if (workerTask) {
      console.log('[ASSIGN] Saving AI-assigned workerTask to Firestore tasks collection...');
      const tRef = window.db.collection('tasks').doc(workerTask.id);
      batch.set(tRef, workerTask);
      hasAssignments = true;
    }

    if (hasAssignments) {
      await batch.commit();
      console.log('[ASSIGN] SUCCESS - assignments and tasks saved');
    } else {
      console.warn('[ASSIGN] No assignments or tasks in response');
    }
  } catch (e) {
    console.error('[ASSIGN] FAILED:', e.message);
  }

  showSuccess(refId);
}

/* ================================================================
   18. SUCCESS SCREEN
================================================================ */
function showSuccess(refId) {
  el('grievance-form').style.display = 'none';
  const screen = el('success-screen');
  screen.classList.remove('hidden');
  el('ref-number').textContent = refId;
  screen.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const heading = el('success-heading');
  if (heading) setTimeout(() => heading.focus(), 400);
}

el('print-btn').addEventListener('click', () => window.print());
el('new-grievance-btn').addEventListener('click', () => window.location.reload());

/* ================================================================
   19. DATE MAX
================================================================ */
el('incident-date').setAttribute('max', new Date().toISOString().split('T')[0]);

/* ================================================================
   20. INIT
================================================================ */
(function () {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const sec = el('form-step-' + i);
    if (sec) sec.style.display = (i === 1) ? 'block' : 'none';
  }
  updateProgressUI(1);
})();