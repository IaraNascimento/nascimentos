import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import {
  ROUTES,
  PHOTOS_COLLECTION,
  redirectTo,
  LoadingManager,
} from "./general.js";

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

async function createPhoto(photoData) {
  return LoadingManager.wrap(async () => {
    const docRef = await addDoc(collection(db, PHOTOS_COLLECTION), {
      ...photoData,
      createdAt: new Date(),
    });

    return docRef.id;
  });
}

// async function deletePhoto(photoId) {
//   try {
//     await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId));
//     return true;
//   } catch (error) {
//     console.error("Erro ao deletar foto:", error);
//     return false;
//   }
// }

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

let allPhotos = [];

function createPhotoCard(photo) {
  const article = document.createElement("article");
  article.classList.add("photo-card");
  article.dataset.photoId = photo.id;

  article.innerHTML = `
    <img src="${photo.image}" alt="Foto da família" />
    <div class="card-content">
      <p class="year-range">
        ${
          !photo.yearEnd || photo.yearStart === photo.yearEnd
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

async function fetchFiltersConfig() {
  const response = await fetch("filters.json");

  if (!response.ok) {
    throw new Error("Erro ao carregar filtros");
  }

  return await response.json();
}

function createMultiSelect(config) {
  const container = document.getElementById(config.id);
  if (!container) return;

  const selected = new Set();

  const wrapper = document.createElement("div");
  wrapper.className = "multi-select";

  const header = document.createElement("div");
  header.className = "multi-select-header";

  const tags = document.createElement("div");
  tags.className = "multi-select-tags";

  const arrow = document.createElement("span");
  arrow.textContent = "▾";

  header.append(tags, arrow);

  const dropdown = document.createElement("div");
  dropdown.className = "multi-select-dropdown";

  const search = document.createElement("input");
  search.type = "text";
  search.placeholder = "buscar...";

  const list = document.createElement("div");
  list.className = "multi-select-options";

  dropdown.append(search, list);

  wrapper.append(header, dropdown);
  container.appendChild(wrapper);

  function renderTags() {
    tags.innerHTML = "";

    const values = Array.from(selected);

    if (!values.length) {
      tags.textContent = config.defaultLabel;
      return;
    }

    const maxVisible = 3;

    values.slice(0, maxVisible).forEach((value) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = value;
      tags.appendChild(tag);
    });

    if (values.length > maxVisible) {
      const more = document.createElement("span");
      more.className = "tag";
      more.textContent = `+${values.length - maxVisible}`;
      tags.appendChild(more);
    }
  }

  function createOption(value) {
    const option = document.createElement("label");
    option.className = "multi-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.add(value);
      else selected.delete(value);

      renderTags();
      applyFiltersAndSort?.();
    });

    const text = document.createElement("span");
    text.textContent = value;

    option.append(checkbox, text);

    return option;
  }

  const optionElements = config.options.map((o) => createOption(o));
  optionElements.forEach((el) => list.appendChild(el));

  search.addEventListener("input", () => {
    const value = search.value.toLowerCase();

    optionElements.forEach((el) => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(value) ? "" : "none";
    });
  });

  header.addEventListener("click", () => {
    dropdown.classList.toggle("open");
  });

  container.getSelectedValues = () => Array.from(selected);

  renderTags();
}

async function initDynamicFilters() {
  const filters = await fetchFiltersConfig();

  filters.forEach((filterConfig) => {
    createMultiSelect(filterConfig);
  });
}

function applyFiltersAndSort() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  let filtered = [...allPhotos];

  const yearStart = Number(document.getElementById("filterYearStart")?.value);
  const yearEnd = Number(document.getElementById("filterYearEnd")?.value);
  const location = document
    .getElementById("filterLocation")
    ?.value.toLowerCase();
  const peopleFilter = document.getElementById("filterPeople");
  const people = peopleFilter?.getSelectedValues?.() || [];
  const eventFilter = document.getElementById("filterEvent");
  const events = eventFilter?.getSelectedValues?.() || [];
  const sortOption = document.getElementById("sortSelect")?.value;

  if (yearStart) filtered = filtered.filter((p) => p.yearStart >= yearStart);

  if (yearEnd) filtered = filtered.filter((p) => p.yearStart <= yearEnd);

  if (location)
    filtered = filtered.filter((p) =>
      p.location?.toLowerCase().includes(location),
    );

  if (people.length) {
    filtered = filtered.filter((p) =>
      people.some((person) => p.people?.includes(person)),
    );
  }

  if (events.length) {
    filtered = filtered.filter((p) => events.includes(p.event));
  }

  const sortMap = {
    dateAsc: (a, b) => a.yearStart - b.yearStart,
    dateDesc: (a, b) => b.yearStart - a.yearStart,
    locationAsc: (a, b) => (a.location || "").localeCompare(b.location || ""),
    locationDesc: (a, b) => (b.location || "").localeCompare(a.location || ""),
    peopleAsc: (a, b) =>
      (a.people?.[0] || "").localeCompare(b.people?.[0] || ""),
    peopleDesc: (a, b) =>
      (b.people?.[0] || "").localeCompare(a.people?.[0] || ""),
  };

  if (sortMap[sortOption]) {
    filtered.sort(sortMap[sortOption]);
  }

  gallery.innerHTML = "";

  if (!filtered.length) {
    gallery.innerHTML = "<p>Nenhuma memória encontrada 🫥</p>";
    return;
  }

  filtered.forEach((photo) => gallery.appendChild(createPhotoCard(photo)));
}

async function initFilters() {
  await initDynamicFilters();

  const inputs = document.querySelectorAll(
    "#filterYearStart, #filterYearEnd, #filterLocation, #sortSelect",
  );

  inputs.forEach((input) =>
    input.addEventListener("input", applyFiltersAndSort),
  );
}

async function renderGallery() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  allPhotos = await fetchPhotos();
  applyFiltersAndSort();
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
      // description: document.getElementById("description").value.trim(),
    };
    await createPhoto(photoData);
    modal.classList.add("hidden");
    form.reset();
    selectedFile = null;
    await renderGallery();
  });
}

/* ================================
  INIT
================================ */

function initHomePage() {
  renderGallery();
  initFilters();
  initPhotoUploadFlow();
}

document.addEventListener("DOMContentLoaded", initHomePage);
