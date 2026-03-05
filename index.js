import { ROUTES, USERS_FILE, saveSession, redirectTo } from "./general.js";

/* ================================
  CARREGA USUÁRIOS
================================ */

async function fetchUsers() {
  const response = await fetch(USERS_FILE);

  if (!response.ok) {
    throw new Error("Erro ao carregar usuários");
  }

  return await response.json();
}

/* ================================
  LOGIN
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

  const loginInput = document.getElementById("user")?.value.trim();
  const passwordInput = document.getElementById("password")?.value.trim();

  if (!loginInput || !passwordInput) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    const users = await fetchUsers();
    const userFound = findUser(users, loginInput, passwordInput);

    if (userFound) {
      saveSession(userFound);
      redirectTo(ROUTES.HOME);
    } else {
      alert("Credenciais inválidas.");
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao realizar login.");
  }
}

function initLogin() {
  const form = document.querySelector(".login-form");
  if (!form) return;

  form.addEventListener("submit", handleLoginSubmit);
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
  INIT
================================ */

function initIndexPage() {
  initLogin();
  initTogglePassword();
}

document.addEventListener("DOMContentLoaded", initIndexPage);
