import {
  ROUTES,
  redirectTo,
  getCurrentPage,
  isLoggedIn,
  clearSession,
  LoadingManager,
} from "./general.js";

/* ================================
  LOGOUT
================================ */

function handleLogout() {
  clearSession();
  redirectTo(ROUTES.LOGIN);
}

function initLogoutButton() {
  const logoutBtn = document.getElementById("logoutButton");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", handleLogout);
}

/* ================================
  PROTEÇÃO DE ROTAS
================================ */

function protectRoute() {
  const currentPage = getCurrentPage();
  const protectedPages = [ROUTES.HOME, ROUTES.DETAILS];

  if (!protectedPages.includes(currentPage)) return;

  if (!isLoggedIn()) redirectTo(ROUTES.LOGIN);
}

/* ================================
  INICIALIZAÇÃO GERAL
================================ */

function initApp() {
  LoadingManager.createLoadingHTML();
  protectRoute();
  initLogoutButton();
}

document.addEventListener("DOMContentLoaded", initApp);
