import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ================================
  CONFIGURAÇÕES
================================ */

export const ROUTES = {
  LOGIN: "index",
  HOME: "home",
  DETAILS: "details",
};

export const STORAGE_KEYS = {
  AUTH: "familia_nascimento_auth",
  USER: "familia_nascimento_user",
};

export const USERS_FILE = "users.json";
export const PHOTOS_COLLECTION = "fotos";

export const storage = getStorage();

/* ================================
  UTILIDADES
================================ */

export function redirectTo(route) {
  LoadingManager.show();
  globalThis.location.href = route;
}

export function getCurrentPage() {
  return globalThis.location.pathname.split("/").pop().split("?")[0];
}

export function getQueryParam(param) {
  const urlParams = new URLSearchParams(globalThis.location.search);
  return urlParams.get(param);
}

export function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === "true";
}

export function saveSession(user) {
  localStorage.setItem(STORAGE_KEYS.AUTH, "true");
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/* ================================
  LOADING GLOBAL COM CONTADOR
================================ */

export const LoadingManager = (() => {
  let counter = 0;

  function createLoadingHTML() {
    const div = document.createElement("div");
    div.id = "app-loading";
    div.innerHTML = `
      <div class="loading-box">
        <div class="loading-emoji">📸✨</div>
        <p class="loading-text">Revelando memórias...</p>
      </div>
    `;
    document.body.appendChild(div);
  }

  function show() {
    counter++;
    const el = document.getElementById("app-loading");
    if (el) el.classList.add("active");
  }

  function hide() {
    counter--;
    if (counter <= 0) {
      counter = 0;
      const el = document.getElementById("app-loading");
      if (el) el.classList.remove("active");
    }
  }

  async function wrap(asyncFn) {
    show();
    try {
      return await asyncFn();
    } finally {
      hide();
    }
  }

  return { createLoadingHTML, show, hide, wrap };
})();
