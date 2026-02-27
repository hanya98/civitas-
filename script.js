/**
 * ================================================================
 * CITIZEN GRIEVANCE REDRESSAL PORTAL — JAVASCRIPT
 * Government of India | PGMS 2.0
 * Complete rewrite — bulletproof navigation + clear error feedback
 * ================================================================
 */

'use strict';

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

/* ================================================================
   2. DATA: Departments per Category
================================================================ */
const DEPARTMENTS = {
  roads:       ['Public Works Department (PWD)', 'National Highways Authority of India (NHAI)', 'Municipal Corporation – Roads Division', 'Urban Local Body (ULB)'],
  water:       ['Water Supply & Sanitation Department', 'Jal Jeevan Mission', 'Municipal Water Works', 'Ground Water Authority'],
  electricity: ['State Electricity Distribution Company', 'Central Electricity Authority', 'DISCOMS / Power Distribution Unit'],
  sanitation:  ['Municipal Corporation – Sanitation Wing', 'Swachh Bharat Mission (Urban/Rural)', 'Urban Local Body – Waste Management'],
  healthcare:  ['State Health Department', 'District Hospital Administration', 'National Health Mission (NHM)', 'Primary Health Centre (PHC)'],
  education:   ['State School Education Department', 'District Education Office', 'Samagra Shiksha Abhiyan', 'Higher Education Department'],
  police:      ['State Police Headquarters', 'District Superintendent of Police (SP)', 'Commissioner of Police (Urban)', 'Internal Complaints Committee'],
  corruption:  ['Central Vigilance Commission (CVC)', 'Lokayukta / Jan Lokpal', 'Central Bureau of Investigation (CBI)', 'State Anti-Corruption Bureau (ACB)'],
  other:       ["District Collector / DM Office", "Chief Minister's Helpline (State)", "Prime Minister's Office (PMO)", 'Concerned Line Department'],
};

/* ================================================================
   3. STATE
================================================================ */
let currentStep = 1;
const TOTAL_STEPS = 4;
let uploadedPhotos = [];

/* ================================================================
   4. SHORTCUT: get element by ID
================================================================ */
function el(id) { return document.getElementById(id); }

/* ================================================================
   5. FIELD ERROR HELPERS
================================================================ */

/** Mark/clear error on an input, select, or textarea */
function setError(inputId, message) {
  var input = el(inputId);
  var errSpan = el(inputId + '-err');
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

/** Set/clear error on a plain <span> (radios, checkboxes) */
function setSpanError(spanId, message) {
  var span = el(spanId);
  if (span) span.textContent = message;
}

/* ================================================================
   6. ERROR BANNER — big visible red box inside step card
================================================================ */

function showErrorBanner(stepNum, errors) {
  var section = el('form-step-' + stepNum);
  if (!section) return;

  // Remove old banner
  var old = section.querySelector('.err-banner');
  if (old) old.remove();

  var banner = document.createElement('div');
  banner.className = 'err-banner';
  banner.setAttribute('role', 'alert');

  var listHTML = '';
  for (var i = 0; i < errors.length; i++) {
    listHTML += '<li>' + errors[i] + '</li>';
  }

  banner.innerHTML =
    '<div class="err-banner-icon">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
        '<circle cx="12" cy="12" r="10"/>' +
        '<line x1="12" y1="7" x2="12" y2="13"/>' +
        '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
      '</svg>' +
    '</div>' +
    '<div class="err-banner-body">' +
      '<strong>Please fix the following before continuing:</strong>' +
      '<ul>' + listHTML + '</ul>' +
    '</div>' +
    '<button type="button" class="err-banner-close" aria-label="Dismiss error">&times;</button>';

  // Place banner after the section heading
  var heading = section.querySelector('.section-heading');
  if (heading) {
    heading.insertAdjacentElement('afterend', banner);
  } else {
    section.insertBefore(banner, section.firstChild);
  }

  // Wire close button
  banner.querySelector('.err-banner-close').addEventListener('click', function () {
    banner.remove();
  });

  // Scroll banner into view
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearBanner(stepNum) {
  var section = el('form-step-' + stepNum);
  if (!section) return;
  var banner = section.querySelector('.err-banner');
  if (banner) banner.remove();
}

/* ================================================================
   7. VALIDATION — returns array of error strings
================================================================ */

function validateStep1() {
  var errors = [];

  /* Full Name */
  var name = el('full-name').value.trim();
  if (!name) {
    setError('full-name', 'Full name is required.');
    errors.push('Full name is required.');
  } else if (name.length < 3) {
    setError('full-name', 'Name must be at least 3 characters long.');
    errors.push('Full name must be at least 3 characters.');
  } else if (!/^[a-zA-Z\s.,''`-]+$/.test(name)) {
    setError('full-name', 'Name may only contain letters and spaces.');
    errors.push('Full name contains invalid characters.');
  } else {
    setError('full-name', '');
  }

  /* Mobile */
  var mobile = el('mobile').value.trim();
  if (!mobile) {
    setError('mobile', 'Mobile number is required.');
    errors.push('Mobile number is required.');
  } else if (!/^[6-9]\d{9}$/.test(mobile)) {
    setError('mobile', 'Must be 10 digits starting with 6, 7, 8 or 9.');
    errors.push('Mobile number must be 10 digits starting with 6, 7, 8 or 9.');
  } else {
    setError('mobile', '');
  }

  /* Email — optional */
  var email = el('email').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    setError('email', 'Enter a valid email address.');
    errors.push('Email address is invalid.');
  } else {
    setError('email', '');
  }

  /* Aadhaar — optional; use data-raw to avoid masking issues */
  var aadhaarEl = el('aadhaar');
  var aadhaarRaw = aadhaarEl.dataset.raw || aadhaarEl.value.replace(/[\sX]/gi, '');
  if (aadhaarRaw && !/^\d{12}$/.test(aadhaarRaw)) {
    setError('aadhaar', 'Aadhaar must be exactly 12 digits.');
    errors.push('Aadhaar number must be 12 digits.');
  } else {
    setError('aadhaar', '');
  }

  return errors;
}

function validateStep2() {
  var errors = [];

  if (!el('state').value) {
    setError('state', 'Please select your state.');
    errors.push('State is required.');
  } else { setError('state', ''); }

  if (!el('district').value) {
    setError('district', 'Please select your district.');
    errors.push('District is required.');
  } else { setError('district', ''); }

  if (!el('city').value.trim()) {
    setError('city', 'City / Town is required.');
    errors.push('City / Town is required.');
  } else { setError('city', ''); }

  var pin = el('pincode').value.trim();
  if (!pin) {
    setError('pincode', 'Pincode is required.');
    errors.push('Pincode is required.');
  } else if (!/^\d{6}$/.test(pin)) {
    setError('pincode', 'Pincode must be exactly 6 digits.');
    errors.push('Pincode must be 6 digits.');
  } else { setError('pincode', ''); }

  if (!el('locality').value.trim()) {
    setError('locality', 'Area / Locality is required.');
    errors.push('Area / Locality is required.');
  } else { setError('locality', ''); }

  return errors;
}

function validateStep3() {
  var errors = [];

  if (!el('category').value) {
    setError('category', 'Please select a grievance category.');
    errors.push('Grievance category is required.');
  } else { setError('category', ''); }

  if (!el('department').value) {
    setError('department', 'Please select the concerned department.');
    errors.push('Department is required.');
  } else { setError('department', ''); }

  var title = el('title').value.trim();
  if (!title) {
    setError('title', 'Grievance title is required.');
    errors.push('Grievance title is required.');
  } else if (title.length < 10) {
    setError('title', 'Title must be at least 10 characters.');
    errors.push('Grievance title needs at least 10 characters.');
  } else { setError('title', ''); }

  var desc = el('description').value.trim();
  if (!desc) {
    setError('description', 'Detailed description is required.');
    errors.push('Description is required.');
  } else if (desc.length < 50) {
    setError('description', 'Minimum 50 characters required. Currently: ' + desc.length + '.');
    errors.push('Description is too short (' + desc.length + '/50 characters minimum).');
  } else { setError('description', ''); }

  var dateVal = el('incident-date').value;
  if (!dateVal) {
    setError('incident-date', 'Date of incident is required.');
    errors.push('Date of incident is required.');
  } else if (new Date(dateVal) > new Date()) {
    setError('incident-date', 'Date cannot be in the future.');
    errors.push('Date of incident cannot be in the future.');
  } else { setError('incident-date', ''); }

  var stillUnresolved = document.querySelector('input[name="stillUnresolved"]:checked');
  if (!stillUnresolved) {
    setSpanError('unresolved-err', 'Please select Yes or No.');
    errors.push('Please indicate if the issue is still unresolved.');
  } else { setSpanError('unresolved-err', ''); }

  var reportedBefore = document.querySelector('input[name="reportedBefore"]:checked');
  if (!reportedBefore) {
    setSpanError('reported-err', 'Please select Yes or No.');
    errors.push('Please indicate if you have reported this before.');
  } else { setSpanError('reported-err', ''); }

  return errors;
}

function validateStep4() {
  var errors = [];

  if (!el('consent-truth').checked) {
    setSpanError('consent-truth-err', 'You must confirm the declaration.');
    errors.push('Please confirm the declaration of truth.');
  } else { setSpanError('consent-truth-err', ''); }

  if (!el('consent-contact').checked) {
    setSpanError('consent-contact-err', 'You must consent to be contacted.');
    errors.push('Please consent to being contacted.');
  } else { setSpanError('consent-contact-err', ''); }

  return errors;
}

/* ================================================================
   8. STEP DISPLAY
================================================================ */

function showStep(stepNum) {
  /* Explicitly show/hide each step by ID — no class ambiguity */
  for (var i = 1; i <= TOTAL_STEPS; i++) {
    var sec = el('form-step-' + i);
    if (sec) sec.style.display = (i === stepNum) ? 'block' : 'none';
  }

  currentStep = stepNum;
  updateProgressUI(stepNum);

  /* Scroll to top of the step */
  var target = el('form-step-' + stepNum);
  if (target) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  /* Build review if going to step 4 */
  if (stepNum === 4) buildReview();
}

function updateProgressUI(activeStep) {
  /* Progress bar */
  var fill = el('progress-fill');
  if (fill) fill.style.width = ((activeStep / TOTAL_STEPS) * 100) + '%';

  var bar = el('progress-bar');
  if (bar) bar.setAttribute('aria-valuenow', activeStep);

  /* Step nav items */
  for (var i = 1; i <= TOTAL_STEPS; i++) {
    var stepEl = el('step-nav-' + i);
    if (!stepEl) continue;

    var numEl = stepEl.querySelector('.step-num');
    stepEl.classList.remove('active', 'completed');
    stepEl.removeAttribute('aria-current');

    if (i === activeStep) {
      stepEl.classList.add('active');
      stepEl.setAttribute('aria-current', 'step');
      if (numEl) numEl.textContent = i;
    } else if (i < activeStep) {
      stepEl.classList.add('completed');
      if (numEl) numEl.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">' +
        '<polyline points="20 6 9 17 4 12"/></svg>';
    } else {
      if (numEl) numEl.textContent = i;
    }
  }
}

/* ================================================================
   9. NEXT / BACK — event delegation (catches clicks on btn + icon)
================================================================ */

document.addEventListener('click', function (e) {
  /* NEXT */
  var nextBtn = e.target.closest('[data-next]');
  if (nextBtn) {
    e.preventDefault();
    var toStep = parseInt(nextBtn.dataset.next, 10);
    var fromStep = toStep - 1;
    handleNext(fromStep, toStep);
    return;
  }

  /* BACK */
  var prevBtn = e.target.closest('[data-prev]');
  if (prevBtn) {
    e.preventDefault();
    var targetStep = parseInt(prevBtn.dataset.prev, 10);
    clearBanner(currentStep);
    showStep(targetStep);
  }
});

function handleNext(fromStep, toStep) {
  var errors = [];
  if (fromStep === 1) errors = validateStep1();
  else if (fromStep === 2) errors = validateStep2();
  else if (fromStep === 3) errors = validateStep3();

  if (errors.length > 0) {
    showErrorBanner(fromStep, errors);
    /* Focus first red field */
    var section = el('form-step-' + fromStep);
    if (section) {
      var firstBad = section.querySelector('input.error, select.error, textarea.error');
      if (firstBad) {
        setTimeout(function () { firstBad.focus(); }, 300);
      }
    }
  } else {
    clearBanner(fromStep);
    showStep(toStep);
  }
}

/* ================================================================
   10. STATE → DISTRICT DROPDOWN
================================================================ */
el('state').addEventListener('change', function () {
  var code = this.value;
  var distEl = el('district');
  distEl.innerHTML = '<option value="">-- Select District --</option>';

  if (code && DISTRICTS[code]) {
    DISTRICTS[code].forEach(function (d) {
      var opt = document.createElement('option');
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
   11. CATEGORY → DEPARTMENT
================================================================ */
el('category').addEventListener('change', function () {
  var cat = this.value;
  var deptEl = el('department');

  if (cat && DEPARTMENTS[cat]) {
    deptEl.innerHTML = '<option value="">-- Select Department --</option>';
    DEPARTMENTS[cat].forEach(function (d) {
      var opt = document.createElement('option');
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
   12. CHARACTER COUNTERS
================================================================ */
function updateCounter(inputEl, counterEl, max) {
  var len = inputEl.value.length;
  counterEl.textContent = len + ' / ' + max;
  counterEl.classList.remove('warning', 'limit');
  if (len >= max) counterEl.classList.add('limit');
  else if (len >= Math.floor(max * 0.85)) counterEl.classList.add('warning');
}

el('title').addEventListener('input', function () {
  updateCounter(this, el('title-count'), 100);
});

el('description').addEventListener('input', function () {
  updateCounter(this, el('description-count'), 2000);
  if (this.value.trim().length >= 50) setError('description', '');
});

/* ================================================================
   13. MOBILE — digits only, blur validation
================================================================ */
el('mobile').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 10);
});

el('mobile').addEventListener('blur', function () {
  var v = this.value.trim();
  if (!v) return;
  if (!/^[6-9]\d{9}$/.test(v)) {
    setError('mobile', 'Must be 10 digits starting with 6, 7, 8 or 9.');
  } else {
    setError('mobile', '');
  }
});

/* ================================================================
   14. PINCODE — digits only
================================================================ */
el('pincode').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 6);
});

/* ================================================================
   15. AADHAAR — auto-format and mask
================================================================ */
var aadhaarEl = el('aadhaar');

aadhaarEl.addEventListener('input', function () {
  var digits = this.value.replace(/\D/g, '').slice(0, 12);
  this.dataset.raw = digits;
  /* Format: XXXX XXXX XXXX */
  this.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
});

aadhaarEl.addEventListener('blur', function () {
  var raw = this.dataset.raw || '';
  if (raw.length === 12) {
    this.value = 'XXXX XXXX ' + raw.slice(8);
  }
});

aadhaarEl.addEventListener('focus', function () {
  var raw = this.dataset.raw || '';
  if (raw) {
    this.value = raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }
});

/* ================================================================
   16. PHOTO UPLOAD + PREVIEW
================================================================ */
var MAX_PHOTOS   = 3;
var MAX_PHOTO_MB = 5;

el('photo-drop-zone').addEventListener('click', function () { el('photo-upload').click(); });
el('photo-drop-zone').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el('photo-upload').click(); }
});
el('photo-drop-zone').addEventListener('dragover', function (e) {
  e.preventDefault(); this.classList.add('drag-over');
});
el('photo-drop-zone').addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
el('photo-drop-zone').addEventListener('drop', function (e) {
  e.preventDefault(); this.classList.remove('drag-over');
  handlePhotoFiles(e.dataTransfer.files);
});

el('photo-upload').addEventListener('change', function () {
  handlePhotoFiles(this.files);
  this.value = '';
});

function handlePhotoFiles(files) {
  var errEl = el('photo-err');
  var msgs = [];

  Array.from(files).forEach(function (file) {
    if (uploadedPhotos.length >= MAX_PHOTOS) {
      msgs.push('Max ' + MAX_PHOTOS + ' photos allowed.');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      msgs.push('"' + file.name + '" must be JPG or PNG.');
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      msgs.push('"' + file.name + '" exceeds ' + MAX_PHOTO_MB + 'MB.');
      return;
    }
    uploadedPhotos.push(file);
    addPhotoPreview(file, uploadedPhotos.length - 1);
  });

  if (errEl) errEl.textContent = msgs.join(' ');
}

function addPhotoPreview(file, index) {
  var reader = new FileReader();
  reader.onload = function (ev) {
    var wrap = document.createElement('div');
    wrap.className = 'image-preview-item';
    wrap.dataset.index = index;

    var img = document.createElement('img');
    img.src = ev.target.result;
    img.alt = 'Photo ' + (index + 1);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove-btn';
    btn.innerHTML = '&times;';
    btn.setAttribute('aria-label', 'Remove photo');
    btn.addEventListener('click', function () {
      uploadedPhotos.splice(index, 1);
      wrap.remove();
      el('photo-err').textContent = '';
    });

    wrap.appendChild(img);
    wrap.appendChild(btn);
    el('image-previews').appendChild(wrap);
  };
  reader.readAsDataURL(file);
}

/* ================================================================
   17. VIDEO UPLOAD
================================================================ */
var MAX_VIDEO_MB = 50;

el('video-drop-zone').addEventListener('click', function () { el('video-upload').click(); });
el('video-drop-zone').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el('video-upload').click(); }
});
el('video-drop-zone').addEventListener('dragover', function (e) {
  e.preventDefault(); this.classList.add('drag-over');
});
el('video-drop-zone').addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
el('video-drop-zone').addEventListener('drop', function (e) {
  e.preventDefault(); this.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) processVideoFile(e.dataTransfer.files[0]);
});
el('video-upload').addEventListener('change', function () {
  if (this.files[0]) processVideoFile(this.files[0]);
});

function processVideoFile(file) {
  var errEl = el('video-err');
  var nameEl = el('video-name-display');
  errEl.textContent = '';

  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    errEl.textContent = 'Video exceeds ' + MAX_VIDEO_MB + 'MB. Please compress or shorten it.';
    nameEl.classList.add('hidden');
    return;
  }

  var mb = (file.size / 1024 / 1024).toFixed(1);
  nameEl.innerHTML = '&#127916; ' + file.name +
    ' <span style="color:var(--clr-text-muted)">(' + mb + ' MB)</span>';
  nameEl.classList.remove('hidden');
}

/* ================================================================
   18. REVIEW SUMMARY (Step 4)
================================================================ */
function buildReview() {
  var grid = el('review-grid');
  if (!grid) return;
  grid.innerHTML = '';

  var aEl = el('aadhaar');
  var aRaw = aEl.dataset.raw || '';
  var aDisplay = aRaw.length === 12 ? 'XXXX XXXX ' + aRaw.slice(8) : (aRaw ? aEl.value : '— Not provided');

  var stateEl = el('state');
  var stateName = stateEl.selectedIndex > 0 ? stateEl.options[stateEl.selectedIndex].text : '—';

  var catEl = el('category');
  var catName = catEl.selectedIndex > 0 ? catEl.options[catEl.selectedIndex].text : '—';

  var dateRaw = el('incident-date').value;
  var dateDisplay = dateRaw
    ? new Date(dateRaw + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  var uEl = document.querySelector('input[name="stillUnresolved"]:checked');
  var rEl = document.querySelector('input[name="reportedBefore"]:checked');

  var pairs = [
    ['Full Name',          el('full-name').value.trim() || '—'],
    ['Mobile Number',      '+91 ' + (el('mobile').value.trim() || '—')],
    ['Email',              el('email').value.trim() || '— Not provided'],
    ['Aadhaar',            aDisplay],
    ['State',              stateName],
    ['District',           el('district').value || '—'],
    ['City / Town',        el('city').value.trim() || '—'],
    ['Pincode',            el('pincode').value.trim() || '—'],
    ['Locality',           el('locality').value.trim() || '—'],
    ['Landmark',           el('landmark').value.trim() || '— Not provided'],
    ['Category',           catName],
    ['Department',         el('department').value || '—'],
    ['Date of Incident',   dateDisplay],
    ['Still Unresolved?',  uEl ? (uEl.value === 'yes' ? 'Yes' : 'No') : '—'],
    ['Reported Before?',   rEl ? (rEl.value === 'yes' ? 'Yes' : 'No') : '—'],
    ['Photos Attached',    uploadedPhotos.length > 0 ? uploadedPhotos.length + ' photo(s)' : 'None'],
  ];

  var fullSpan = [
    ['Grievance Title',   el('title').value.trim() || '—'],
    ['Description',       el('description').value.trim() || '—'],
  ];

  pairs.forEach(function (p) { addReviewItem(grid, p[0], p[1], false); });
  fullSpan.forEach(function (p) { addReviewItem(grid, p[0], p[1], true); });
}

function addReviewItem(grid, key, val, wide) {
  var div = document.createElement('div');
  div.className = 'review-item' + (wide ? ' full-span' : '');

  var k = document.createElement('span');
  k.className = 'review-key';
  k.textContent = key;

  var v = document.createElement('span');
  v.className = 'review-val';
  v.textContent = val;

  div.appendChild(k);
  div.appendChild(v);
  grid.appendChild(div);
}

/* ================================================================
   19. CONSENT → SUBMIT BUTTON
================================================================ */
function checkConsent() {
  el('submit-btn').disabled = !(el('consent-truth').checked && el('consent-contact').checked);
}
el('consent-truth').addEventListener('change', checkConsent);
el('consent-contact').addEventListener('change', checkConsent);

/* ================================================================
   20. FORM SUBMIT
================================================================ */
el('grievance-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var errors = validateStep4();
  if (errors.length > 0) { showErrorBanner(4, errors); return; }

  var btn = el('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  setTimeout(showSuccess, 1800);
});

function showSuccess() {
  el('grievance-form').style.display = 'none';
  var screen = el('success-screen');
  screen.classList.remove('hidden');

  var now = new Date();
  var stateCode = el('state').value || 'XX';
  var cat = (el('category').value || 'OTH').slice(0, 3).toUpperCase();
  var rnd = Math.floor(10000000 + Math.random() * 90000000);
  el('ref-number').textContent = 'PGMS/' + now.getFullYear() + '/' + stateCode + '/' + cat + '/' + rnd;

  screen.scrollIntoView({ behavior: 'smooth', block: 'start' });
  var heading = el('success-heading');
  if (heading) heading.focus();
}

/* ================================================================
   21. SUCCESS SCREEN BUTTONS
================================================================ */
el('print-btn').addEventListener('click', function () { window.print(); });
el('new-grievance-btn').addEventListener('click', function () { window.location.reload(); });

/* ================================================================
   22. DATE MAX
================================================================ */
el('incident-date').setAttribute('max', new Date().toISOString().split('T')[0]);

/* ================================================================
   23. INIT — show only step 1
================================================================ */
(function () {
  for (var i = 1; i <= TOTAL_STEPS; i++) {
    var sec = el('form-step-' + i);
    if (sec) sec.style.display = (i === 1) ? 'block' : 'none';
  }
  updateProgressUI(1);
})();