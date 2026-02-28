import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ================================
  LOADING GLOBAL COM CONTADOR
================================ */

const LoadingManager = (() => {
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

/* ================================
  CONFIGURAÇÕES
================================ */

const ROUTES = {
  LOGIN: "index",
  HOME: "home",
  DETAILS: "details",
};

const STORAGE_KEYS = {
  AUTH: "familia_nascimento_auth",
  USER: "familia_nascimento_user",
};

const USERS_FILE = "users.json";
const PHOTOS_COLLECTION = "fotos";

const storage = getStorage();

/* ================================
  UTILIDADES
================================ */

function redirectTo(route) {
  LoadingManager.show();
  globalThis.location.href = route;
}

function getCurrentPage() {
  return globalThis.location.pathname.split("/").pop().split("?")[0];
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(globalThis.location.search);
  return urlParams.get(param);
}

function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === "true";
}

function saveSession(user) {
  localStorage.setItem(STORAGE_KEYS.AUTH, "true");
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/* ================================
  CARREGA USUÁRIOS
================================ */

async function fetchUsers() {
  return LoadingManager.wrap(async () => {
    const response = await fetch(USERS_FILE);
    if (!response.ok) throw new Error("Erro ao carregar usuários");
    return await response.json();
  });
}

/* ================================
  ACESSO - LOGIN
================================ */

function findUser(users, loginInput, passwordInput) {
  return users.find(
    (user) =>
      (user.username === loginInput ||
        user.email === loginInput ||
        user.phone === loginInput) &&
      user.password === passwordInput,
  );
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  await LoadingManager.wrap(async () => {
    const loginInput = document.getElementById("user")?.value.trim();
    const passwordInput = document.getElementById("password")?.value.trim();

    if (!loginInput || !passwordInput) {
      alert("Preencha todos os campos.");
      return;
    }

    const users = await fetchUsers();
    const userFound = findUser(users, loginInput, passwordInput);

    if (userFound) {
      saveSession(userFound);
      redirectTo(ROUTES.HOME);
    } else {
      alert("Credenciais inválidas.");
    }
  });
}

function initLogin() {
  const form = document.querySelector(".login-form");
  if (!form) return;

  form.addEventListener("submit", handleLoginSubmit);
}

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
  SERVIÇOS DE FOTOS - FIRESTORE
================================ */

async function fetchPhotos() {
  return LoadingManager.wrap(async () => {
    const q = query(
      collection(db, PHOTOS_COLLECTION),
      orderBy("yearStart", "desc"),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });
}

async function fetchPhotoById(photoId) {
  return LoadingManager.wrap(async () => {
    const refDoc = doc(db, PHOTOS_COLLECTION, photoId);
    const snapshot = await getDoc(refDoc);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() };
  });
}

async function createPhoto(photoData) {
  return LoadingManager.wrap(async () => {
    const docRef = await addDoc(collection(db, PHOTOS_COLLECTION), {
      ...photoData,
      createdAt: new Date(),
    });

    return docRef.id;
  });
}

async function deletePhoto(photoId) {
  try {
    await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId));
    return true;
  } catch (error) {
    console.error("Erro ao deletar foto:", error);
    return false;
  }
}

async function uploadImageToFirebase(file) {
  return LoadingManager.wrap(async () => {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `fotos/${fileName}`);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  });
}

/* ================================
  GALERIA DE FOTOS
================================ */

function createPhotoCard(photo) {
  const article = document.createElement("article");
  article.classList.add("photo-card");
  article.dataset.photoId = photo.id;

  article.innerHTML = `
    <img src="${photo.image}" alt="Foto da família" />
    <div class="card-content">
      <p class="year-range">
        ${
          photo.yearStart == photo.yearEnd
            ? photo.yearStart
            : `${photo.yearStart} ~ ${photo.yearEnd}`
        }
      </p>
      ${photo.location ? `<p class="location">📍 ${photo.location}</p>` : ""}
      ${photo.people.length ? `<p class="people">👨‍👩‍👧‍👦 ${photo.people.join(", ")}</p>` : ""}
      ${photo.event ? `<p class="event">🎉 ${photo.event}</p>` : ""}

    </div>
  `;

  article.addEventListener("click", () =>
    redirectTo(`${ROUTES.DETAILS}?id=${photo.id}`),
  );

  return article;
}

async function renderGallery() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  const photos = await fetchPhotos();
  gallery.innerHTML = "";

  photos.forEach((photo) => {
    gallery.appendChild(createPhotoCard(photo));
  });
}

/* ================================
  DETALHES DE FOTO
================================ */

function initBackButton() {
  const backButton = document.getElementById("backButton");
  if (!backButton) return;

  backButton.addEventListener("click", () => {
    redirectTo(ROUTES.HOME);
  });
}

async function initDetailsPage() {
  const photoId = getQueryParam("id");
  const container = document.getElementById("photoDetails");
  if (!container || !photoId) return;

  const photo = await fetchPhotoById(photoId);
  if (!photo) {
    container.innerHTML = "<p>Foto não encontrada.</p>";
    return;
  }

  container.innerHTML = `
    <article class="photo-details-card">

    <div class="details-content">
        <p class="year-range">
          ${photo.yearStart == photo.yearEnd ? photo.yearStart : `${photo.yearStart} - ${photo.yearEnd}`}
        </p>

        ${photo.location ? `<p class="location">📍 ${photo.location}</p>` : ""}
        ${photo.people.length ? `<p class="people">👨‍👩‍👧‍👦 ${photo.people.join(", ")}</p>` : ""}
        ${photo.event ? `<p class="event">🎉 ${photo.event}</p>` : ""}
        ${photo.description ? `<p class="description">${photo.description}</p>` : ""}
        
        </div>

        <img src="${photo.image}" />

        </article>
  `;
}

/* ================================
  TOGGLE PASSWORD
================================ */

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  const toggleButton = document.getElementById("togglePassword");

  if (!passwordInput || !toggleButton) return;

  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";
  toggleButton.textContent = isPassword ? "🙈" : "👁️";
  toggleButton.setAttribute(
    "aria-label",
    isPassword ? "Ocultar senha" : "Mostrar senha",
  );
}

function initTogglePassword() {
  const toggleButton = document.getElementById("togglePassword");
  if (!toggleButton) return;

  toggleButton.addEventListener("click", togglePasswordVisibility);
}

/* ================================
  HOME - ENVIAR FOTO NOVA
================================ */
let selectedFile = null;

function initPhotoUploadFlow() {
  const photoUpload = document.getElementById("photoUpload");
  const modal = document.getElementById("photoModal");
  const cancelBtn = document.getElementById("cancelPhoto");
  const form = document.getElementById("photoForm");
  if (!photoUpload || !modal || !form) return;
  photoUpload.addEventListener("change", (event) => {
    const files = event.target.files;
    if (!files.length) return;
    selectedFile = files[0];
    modal.classList.remove("hidden");
  });
  cancelBtn.addEventListener("click", () => {
    selectedFile = null;
    form.reset();
    modal.classList.add("hidden");
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedFile) return;
    const imageUrl = await uploadImageToFirebase(selectedFile);
    const photoData = {
      image: imageUrl,
      yearStart: Number(document.getElementById("yearStart").value),
      yearEnd: Number(document.getElementById("yearEnd").value) || null,
      location: document.getElementById("location").value.trim(),
      people: document
        .getElementById("people")
        .value.split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      event: document.getElementById("event").value.trim(),
      description: document.getElementById("description").value.trim(),
    };
    await createPhoto(photoData);
    modal.classList.add("hidden");
    form.reset();
    selectedFile = null;
    await renderGallery();
  });
}

/* ================================
  INICIALIZAÇÃO GERAL
================================ */

function initApp() {
  LoadingManager.createLoadingHTML();
  protectRoute();
  initLogin();
  initLogoutButton();
  initDetailsPage();
  initTogglePassword();
  renderGallery();
  initBackButton();
  initPhotoUploadFlow();
}

document.addEventListener("DOMContentLoaded", initApp);
