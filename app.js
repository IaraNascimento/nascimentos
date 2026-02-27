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

const PHOTOS_FILE = "photos.json";

/* ================================
   UTILIDADES
================================ */

function redirectTo(route) {
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
   FETCH USUÁRIOS
================================ */

async function fetchUsers() {
  try {
    const response = await fetch(USERS_FILE);
    if (!response.ok) throw new Error("Erro ao carregar usuários");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

/* ================================
   VALIDAÇÃO DE LOGIN
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

/* ================================
   LOGIN
================================ */

async function handleLoginSubmit(event) {
  event.preventDefault();

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

  if (!isLoggedIn()) {
    redirectTo(ROUTES.LOGIN);
  }
}

/* ================================
   HOME - CARREGA AS FOTOS
================================ */

async function fetchPhotos() {
  try {
    const response = await fetch(PHOTOS_FILE);
    if (!response.ok) throw new Error("Erro ao carregar fotos");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

function createPhotoCard(photo) {
  const article = document.createElement("article");
  article.classList.add("photo-card");
  article.dataset.photoId = photo.id;

  article.innerHTML = `
    <img src="${photo.image}" alt="Foto da família" />
    <div class="card-content">
      <p class="year-range">
        ${photo.yearStart == photo.yearEnd ? photo.yearStart : `${photo.yearStart} ~ ${photo.yearEnd}`}
      </p>
      ${photo.location ? `<p class="location">📍 ${photo.location}</p>` : ""}
      ${photo.people.length ? `<p class="people">👨‍👩‍👧‍👦 ${photo.people.join(", ")}</p>` : ""}
      ${photo.event ? `<p class="event">🎉 ${photo.event}</p>` : ""}
    </div>
  `;

  article.addEventListener("click", handleCardClick);

  return article;
}

async function renderGallery() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  const photos = await fetchPhotos();

  gallery.innerHTML = "";

  photos.forEach((photo) => {
    const card = createPhotoCard(photo);
    gallery.appendChild(card);
  });
}

/* ================================
   HOME - SELECIONA UMA FOTO
================================ */

function handleCardClick(event) {
  const card = event.target.closest(".photo-card");
  console.log("CARD:", card);

  if (!card) return;

  console.log("DATASET:", card.dataset);

  const photoId = card.dataset.photoId;
  console.log("PHOTO ID:", photoId);

  if (!photoId) return;

  redirectTo(`${ROUTES.DETAILS}?id=${photoId}`);
}

/* ================================
   DETAILS
================================ */

function initBackButton() {
  const backButton = document.getElementById("backButton");
  if (!backButton) return;

  backButton.addEventListener("click", () => {
    redirectTo(ROUTES.HOME);
  });
}

function getCommentsStorageKey(photoId) {
  return `familia_nascimento_comments_${photoId}`;
}

function saveComment(photoId, comment) {
  const key = getCommentsStorageKey(photoId);
  const existing = JSON.parse(localStorage.getItem(key)) || [];
  existing.push(comment);
  localStorage.setItem(key, JSON.stringify(existing));
}

function getComments(photoId) {
  const key = getCommentsStorageKey(photoId);
  return JSON.parse(localStorage.getItem(key)) || [];
}

function createCommentElement(comment) {
  const div = document.createElement("div");
  div.classList.add("comment");

  div.innerHTML = `
    <p class="comment-author"><strong>${comment.author}</strong></p>
    <p class="comment-text">${comment.text}</p>
    <p class="comment-date">${comment.date}</p>
  `;

  return div;
}

async function initDetailsPage() {
  const photoId = getQueryParam("id");
  const container = document.getElementById("photoDetails");
  if (!container) return;

  if (!photoId) {
    container.innerHTML = "<p>Foto não encontrada.</p>";
    return;
  }

  const photos = await fetchPhotos();
  const photo = photos.find((p) => p.id === photoId);

  if (!photo) {
    container.innerHTML = "<p>Foto não encontrada.</p>";
    return;
  }

  container.innerHTML = `
    <article class="photo-details-card">
      <img src="${photo.image}" alt="Foto da família" />
      
      <div class="details-content">
        <p class="year-range">
          ${photo.yearStart == photo.yearEnd ? photo.yearStart : `${photo.yearStart} - ${photo.yearEnd}`}
        </p>

        ${photo.location ? `<p class="location">📍 ${photo.location}</p>` : ""}
        ${photo.people.length ? `<p class="people">👨‍👩‍👧‍👦 ${photo.people.join(", ")}</p>` : ""}
        ${photo.event ? `<p class="event">🎉 ${photo.event}</p>` : ""}
        ${photo.description ? `<p class="description">${photo.description}</p>` : ""}
      </div>
    </article>

    <section class="comments-section">
      <h3>Comentários</h3>

      <div id="commentsList"></div>

      <form id="commentForm" class="comment-form">
        <input type="text" id="commentAuthor" placeholder="Seu nome" required />
        <textarea id="commentText" placeholder="Escreva sua lembrança..." required></textarea>
        <button type="submit">Enviar comentário</button>
      </form>
    </section>
  `;

  renderComments(photoId);
  initCommentForm(photoId);
}

function renderComments(photoId) {
  const commentsList = document.getElementById("commentsList");
  if (!commentsList) return;

  const comments = getComments(photoId);

  commentsList.innerHTML = "";

  if (!comments.length) {
    commentsList.innerHTML = "<p>Nenhum comentário ainda.</p>";
    return;
  }

  comments.forEach((comment) => {
    const commentElement = createCommentElement(comment);
    commentsList.appendChild(commentElement);
  });
}

function initCommentForm(photoId) {
  const form = document.getElementById("commentForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const author = document.getElementById("commentAuthor").value.trim();
    const text = document.getElementById("commentText").value.trim();

    if (!author || !text) return;

    const newComment = {
      author,
      text,
      date: new Date().toLocaleString("pt-BR"),
    };

    saveComment(photoId, newComment);
    form.reset();
    renderComments(photoId);
  });
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
   INICIALIZAÇÃO GERAL
================================ */

function initApp() {
  protectRoute();
  initLogin();
  initLogoutButton();
  initDetailsPage();
  initTogglePassword();
  renderGallery();
  initBackButton();
}

document.addEventListener("DOMContentLoaded", initApp);
