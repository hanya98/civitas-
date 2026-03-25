'use strict';

/* ================================================================
   contractor.js — Contractor Portal Script
================================================================ */

const contractorId = Auth.getContractorId();
document.getElementById('cnt-id-badge').textContent = 'ID: ' + contractorId;

/* ── DEMO DATA ── */
const DEMO_PROJECTS = [
    { id: 'PRJ001', name: 'NH-48 Pothole Repair — Sector 5', dept: 'Public Works Department (PWD)', area: 'Sector 5, Ward 12', value: 480000, status: 'Active', progress: 65, startDate: '2026-02-01', endDate: '2026-04-30', contractorId: 'CNT001' },
    { id: 'PRJ002', name: 'Storm Drain Renovation Block C', dept: 'Municipal Corporation — Drainage', area: 'Block C, Zone B', value: 320000, status: 'Completed', progress: 100, startDate: '2026-01-10', endDate: '2026-03-15', contractorId: 'CNT001' },
    { id: 'PRJ003', name: 'School Boundary Wall Construction', dept: 'State School Education Department', area: 'Ward 9 Primary School', value: 150000, status: 'OnHold', progress: 40, startDate: '2026-03-01', endDate: '2026-05-31', contractorId: 'CNT001' },
    { id: 'PRJ004', name: 'Water Pipeline Extension — South Zone', dept: 'Municipal Water Works', area: 'South Zone, Sectors 8–11', value: 720000, status: 'Active', progress: 25, startDate: '2026-03-15', endDate: '2026-06-30', contractorId: 'CNT002' },
];

let bills = [];
let toastTimer = null;

/* ── HELPERS ── */
function toast(msg) {
    const t = document.getElementById('cnt-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function fmtAmount(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

/* ── LOAD BILLS ── */
function loadBills() {
    const stored = localStorage.getItem('civitas_bills_' + contractorId);
    if (stored) {
        bills = JSON.parse(stored);
    } else {
        bills = [
            { id: 'BILL001', projectId: 'PRJ001', projectName: 'NH-48 Pothole Repair', desc: 'Bitumen & aggregates supply', category: 'materials', amount: 95000, date: '2026-03-01', work: 'Supply of 2 tons bitumen and aggregate for 500m stretch.', status: 'Approved', submittedAt: '2026-03-02T10:00:00Z' },
            { id: 'BILL002', projectId: 'PRJ001', projectName: 'NH-48 Pothole Repair', desc: 'Labour charges — March 1st week', category: 'labour', amount: 42000, date: '2026-03-07', work: 'Labour deployment for 12 days × 10 workers.', status: 'Pending', submittedAt: '2026-03-08T09:00:00Z' },
            { id: 'BILL003', projectId: 'PRJ002', projectName: 'Storm Drain Renovation', desc: 'Equipment hire — excavator', category: 'equipment', amount: 28000, date: '2026-02-15', work: 'JCB excavator hire for 14 days.', status: 'Paid', submittedAt: '2026-02-16T11:00:00Z' },
            { id: 'BILL004', projectId: 'PRJ003', projectName: 'School Boundary Wall', desc: 'Cement & bricks purchase', category: 'materials', amount: 35000, date: '2026-03-12', work: 'Purchase of 5000 bricks + 50 bags cement.', status: 'Rejected', submittedAt: '2026-03-13T14:00:00Z' },
        ];
        saveBills();
    }
}

function saveBills() {
    localStorage.setItem('civitas_bills_' + contractorId, JSON.stringify(bills));
}

/* ── RENDER STATS ── */
function renderStats() {
    const myProjects = DEMO_PROJECTS.filter(p => p.contractorId === contractorId || contractorId === 'CNT001');
    const pending = bills.filter(b => b.status === 'Pending').length;
    const approved = bills.filter(b => ['Approved', 'Paid'].includes(b.status)).length;
    const total = bills.reduce((sum, b) => sum + Number(b.amount), 0);

    document.getElementById('cs-projects').textContent = myProjects.length;
    document.getElementById('cs-pending').textContent = pending;
    document.getElementById('cs-approved').textContent = approved;
    document.getElementById('cs-amount').textContent = '₹' + (total / 1000).toFixed(0) + 'K';
}

/* ── RENDER PROJECTS ── */
function renderProjects() {
    const grid = document.getElementById('projects-grid');
    const myProjects = DEMO_PROJECTS.filter(p => p.contractorId === contractorId || contractorId === 'CNT001');
    if (myProjects.length === 0) {
        grid.innerHTML = `<div class="cnt-empty"><div class="cnt-empty-icon">📦</div><div class="cnt-empty-title">No projects yet</div></div>`;
        return;
    }
    grid.innerHTML = myProjects.map(p => `
    <div class="project-card">
      <div class="project-name">${p.name}</div>
      <div class="project-dept">🏛 ${p.dept}</div>
      <div class="project-meta">
        <div class="project-meta-item">
          <div class="project-meta-label">Contract Value</div>
          <div class="project-meta-val">${fmtAmount(p.value)}</div>
        </div>
        <div class="project-meta-item">
          <div class="project-meta-label">Area</div>
          <div class="project-meta-val">${p.area}</div>
        </div>
        <div class="project-meta-item">
          <div class="project-meta-label">Start Date</div>
          <div class="project-meta-val">${fmtDate(p.startDate)}</div>
        </div>
        <div class="project-meta-item">
          <div class="project-meta-label">End Date</div>
          <div class="project-meta-val">${fmtDate(p.endDate)}</div>
        </div>
      </div>
      <div class="project-progress">
        <div class="progress-label"><span>Progress</span><span>${p.progress}%</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      </div>
      <span class="project-status-badge status-${p.status.replace(/\s/g, '')}">${p.status}</span>
    </div>`).join('');
}

/* ── RENDER BILLS ── */
function renderBills() {
    const list = document.getElementById('bills-list');
    if (bills.length === 0) {
        list.innerHTML = `<div class="cnt-empty"><div class="cnt-empty-icon">🧾</div><div class="cnt-empty-title">No bills submitted yet</div><div class="cnt-empty-sub">Click "+ Submit Bill" to raise your first bill.</div></div>`;
        return;
    }
    const catIcons = { materials: '🧱', labour: '👷', equipment: '🚜', other: '📦' };
    list.innerHTML = bills.slice().reverse().map(b => `
    <div class="bill-card">
      <div class="bill-card-icon">${catIcons[b.category] || '🧾'}</div>
      <div class="bill-card-body">
        <div class="bill-card-title">${b.desc}</div>
        <div class="bill-card-meta">
          <span>📋 ${b.projectName}</span>
          <span>📅 ${fmtDate(b.date)}</span>
          <span>🏷 ${b.category}</span>
          <span>Submitted: ${b.submittedAt ? new Date(b.submittedAt).toLocaleDateString('en-IN') : '—'}</span>
        </div>
      </div>
      <div class="bill-card-amount">${fmtAmount(b.amount)}</div>
      <div class="bill-card-actions">
        <span class="bill-status-tag bill-${b.status}">${b.status}</span>
        <button class="bill-inv-btn" data-bill-id="${b.id}">📄 Invoice</button>
      </div>
    </div>`).join('');
}

/* ── RENDER PAYMENTS ── */
function renderPayments() {
    const list = document.getElementById('payments-list');
    const paid = bills.filter(b => ['Approved', 'Paid'].includes(b.status));
    if (paid.length === 0) {
        list.innerHTML = `<div class="cnt-empty"><div class="cnt-empty-icon">💰</div><div class="cnt-empty-title">No payments yet</div></div>`;
        return;
    }
    list.innerHTML = paid.slice().reverse().map(b => `
    <div class="payment-card">
      <div class="pay-icon">${b.status === 'Paid' ? '✅' : '⏳'}</div>
      <div class="pay-body">
        <div class="pay-title">${b.desc}</div>
        <div class="pay-meta">${b.projectName} · ${fmtDate(b.date)}</div>
      </div>
      <div>
        <div class="pay-amount">${fmtAmount(b.amount)}</div>
        <span class="pay-status-tag bill-${b.status}">${b.status}</span>
      </div>
    </div>`).join('');
}

/* ── TABS ── */
document.querySelectorAll('.cnt-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cnt-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.cnt-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ── GENERATE INVOICE HTML ── */
function generateInvoiceHTML(bill) {
    const invNum = 'INV-' + bill.id + '-' + contractorId;
    return `<div class="invoice-doc">
    <div class="inv-header">
      <div><div class="inv-logo">CIVI<span>TAS</span></div><div style="font-size:0.75rem;color:#718096;margin-top:4px">Govt. Contractor Management System</div></div>
      <div class="inv-meta"><strong>Invoice #${invNum}</strong>Date: ${fmtDate(new Date().toISOString())}<br>
        Contractor ID: ${contractorId}<br>Status: <strong style="color:${{ 'Approved': '#006937', 'Paid': '#006937', 'Pending': '#d4770b', 'Rejected': '#c0392b' }[bill.status]}">${bill.status}</strong>
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:0.75rem;color:#718096;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Bill To</div>
      <strong>Government of India — ${bill.projectName}</strong><br>
      <span style="font-size:0.82rem;color:#718096">CIVITAS Grievance & Workforce Management Portal</span>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Category</th><th>Bill Date</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr><td>${bill.desc}</td><td>${bill.category}</td><td>${fmtDate(bill.date)}</td><td style="text-align:right">${fmtAmount(bill.amount)}</td></tr>
        ${bill.work ? `<tr><td colspan="4" style="font-size:0.78rem;color:#718096">Work details: ${bill.work}</td></tr>` : ''}
      </tbody>
    </table>
    <div class="inv-total">Total Payable: ${fmtAmount(bill.amount)}</div>
    <div class="inv-footer">
      This is a computer-generated invoice. No signature required.<br>
      CIVITAS · Civic Technology Platform · Government of India
    </div>
  </div>`;
}

/* ── BILL MODAL ── */
function openBillModal() {
    // Populate projects dropdown
    const sel = document.getElementById('b-project');
    const myProjects = DEMO_PROJECTS.filter(p => p.status === 'Active' || p.contractorId === contractorId);
    sel.innerHTML = '<option value="">-- Select Project --</option>' +
        myProjects.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name}</option>`).join('');
    document.getElementById('b-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-preview').style.display = 'none';
    document.getElementById('bill-modal-overlay').classList.add('open');
}
function closeBillModal() {
    document.getElementById('bill-modal-overlay').classList.remove('open');
}

document.getElementById('new-bill-btn').addEventListener('click', openBillModal);
document.getElementById('bill-modal-close').addEventListener('click', closeBillModal);
document.getElementById('bill-modal-cancel').addEventListener('click', closeBillModal);
document.getElementById('bill-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeBillModal(); });

document.getElementById('preview-invoice-btn').addEventListener('click', () => {
    const projEl = document.getElementById('b-project');
    const projName = projEl.options[projEl.selectedIndex]?.dataset.name || 'Project';
    const preview = {
        id: 'PREV', projectName: projName,
        desc: document.getElementById('b-desc').value.trim() || 'Work Description',
        category: document.getElementById('b-category').value,
        amount: document.getElementById('b-amount').value || '0',
        date: document.getElementById('b-date').value,
        work: document.getElementById('b-work').value.trim(),
        status: 'Pending',
    };
    const previewDiv = document.getElementById('invoice-preview');
    previewDiv.style.display = 'block';
    document.getElementById('invoice-preview-content').innerHTML = generateInvoiceHTML(preview);
});

document.getElementById('bill-modal-save').addEventListener('click', () => {
    const projEl = document.getElementById('b-project');
    const projId = projEl.value;
    const projName = projId ? projEl.options[projEl.selectedIndex].dataset.name : '';
    const desc = document.getElementById('b-desc').value.trim();
    const amount = parseFloat(document.getElementById('b-amount').value);
    const date = document.getElementById('b-date').value;

    if (!projId) { toast('❌ Please select a project.'); return; }
    if (!desc) { toast('❌ Bill description is required.'); return; }
    if (!amount || amount <= 0) { toast('❌ Enter a valid amount.'); return; }
    if (!date) { toast('❌ Bill date is required.'); return; }

    const newBill = {
        id: 'BILL' + Date.now(),
        projectId: projId,
        projectName: projName,
        desc,
        category: document.getElementById('b-category').value,
        amount,
        date,
        work: document.getElementById('b-work').value.trim(),
        status: 'Pending',
        submittedAt: new Date().toISOString(),
        contractorId,
    };

    // Try saving to Firestore
    if (window.db) {
        window.db.collection('bills').doc(newBill.id).set(newBill).catch(e => console.warn('Bill Firestore:', e));
    }

    bills.push(newBill);
    saveBills();
    renderBills();
    renderStats();
    renderPayments();
    closeBillModal();
    toast('✅ Bill submitted! Status: Pending review.');

    // Reset
    ['b-desc', 'b-amount', 'b-work'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('invoice-preview').style.display = 'none';
});

/* ── INVOICE VIEW ── */
document.getElementById('bills-list').addEventListener('click', e => {
    const btn = e.target.closest('.bill-inv-btn');
    if (!btn) return;
    const bill = bills.find(b => b.id === btn.dataset.billId);
    if (!bill) return;
    document.getElementById('invoice-content').innerHTML = generateInvoiceHTML(bill);
    document.getElementById('invoice-modal-overlay').classList.add('open');
});

document.getElementById('invoice-modal-close').addEventListener('click', () => {
    document.getElementById('invoice-modal-overlay').classList.remove('open');
});
document.getElementById('invoice-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('invoice-modal-overlay').classList.remove('open');
});

/* ── INIT ── */
loadBills();
renderStats();
renderProjects();
renderBills();
renderPayments();
