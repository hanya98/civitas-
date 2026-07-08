/**
 * auth.js — Shared authentication utilities for CIVITAS
 *
 * Storage keys:
 *   sessionStorage['citizen_mobile']       → set when citizen logs in
 *   sessionStorage['admin_logged_in']      → set when admin logs in ('true')
 *   sessionStorage['manager_logged_in']    → set when manager logs in ('true')
 *   sessionStorage['worker_mobile']        → set when worker logs in
 *   sessionStorage['contractor_logged_in'] → set when contractor logs in ('true')
 */

const Auth = {

  /* ─── CITIZEN ─── */

  isCitizenLoggedIn() {
    return !!sessionStorage.getItem('citizen_mobile');
  },

  getCitizenMobile() {
    return sessionStorage.getItem('citizen_mobile') || null;
  },

  citizenLogin(mobile) {
    sessionStorage.setItem('citizen_mobile', mobile);
  },

  citizenLogout() {
    sessionStorage.removeItem('citizen_mobile');
  },

  requireCitizenLogin() {
    if (!this.isCitizenLoggedIn()) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `citizen-profile.html?redirect=${current}`;
    }
  },

  /* ─── ADMIN ─── */

  isAdminLoggedIn() {
    return sessionStorage.getItem('admin_logged_in') === 'true';
  },

  adminLogin() {
    sessionStorage.setItem('admin_logged_in', 'true');
  },

  adminLogout() {
    sessionStorage.removeItem('admin_logged_in');
  },

  requireAdminLogin() {
    if (!this.isAdminLoggedIn()) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `admin-login.html?redirect=${current}`;
    }
  },

  /* ─── MANAGER ─── */

  isManagerLoggedIn() {
    return sessionStorage.getItem('manager_logged_in') === 'true';
  },

  managerLogin() {
    sessionStorage.setItem('manager_logged_in', 'true');
  },

  managerLogout() {
    sessionStorage.removeItem('manager_logged_in');
  },

  requireManagerLogin() {
    if (!this.isManagerLoggedIn()) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `manager-login.html?redirect=${current}`;
    }
  },

  /* ─── FIELD WORKER ─── */

  isWorkerLoggedIn() {
    return !!sessionStorage.getItem('worker_mobile');
  },

  getWorkerMobile() {
    return sessionStorage.getItem('worker_mobile') || null;
  },

  workerLogin(mobile) {
    sessionStorage.setItem('worker_mobile', mobile);
  },

  workerLogout() {
    sessionStorage.removeItem('worker_mobile');
  },

  requireWorkerLogin() {
    if (!this.isWorkerLoggedIn()) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `worker-login.html?redirect=${current}`;
    }
  },

  /* ─── CONTRACTOR ─── */

  isContractorLoggedIn() {
    return sessionStorage.getItem('contractor_logged_in') === 'true';
  },

  getContractorId() {
    return sessionStorage.getItem('contractor_id') || 'CNT001';
  },

  contractorLogin(id) {
    sessionStorage.setItem('contractor_logged_in', 'true');
    sessionStorage.setItem('contractor_id', id || 'CNT001');
  },

  contractorLogout() {
    sessionStorage.removeItem('contractor_logged_in');
    sessionStorage.removeItem('contractor_id');
  },

  requireContractorLogin() {
    if (!this.isContractorLoggedIn()) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `contractor-login.html?redirect=${current}`;
    }
  },

};

// Make globally available
window.Auth = Auth;
