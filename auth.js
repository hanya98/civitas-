/**
 * auth.js — Shared authentication utilities for CIVITAS
 *
 * Storage keys:
 *   sessionStorage['citizen_mobile']    → set when citizen logs in
 *   sessionStorage['admin_logged_in']   → set when admin logs in ('true')
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

  /**
   * Call at top of any citizen-protected page.
   * Redirects to citizen-profile.html if not logged in,
   * passing current page as redirect param.
   */
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

  /**
   * Call at top of any admin-protected page.
   * Redirects to admin-login.html if not logged in.
   */
  requireAdminLogin() {
    if (!this.isAdminLoggedIn()) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `admin-login.html?redirect=${current}`;
    }
  },

};

// Make globally available
window.Auth = Auth;
