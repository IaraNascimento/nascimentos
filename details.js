import { db } from "./firebase.js";

import {
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ROUTES,
  PHOTOS_COLLECTION,
  redirectTo,
  getQueryParam,
  LoadingManager,
} from "./general.js";

function initBackButton() {
  const backButton = document.getElementById("backButton");
  if (!backButton) return;

  backButton.addEventListener("click", () => {
    redirectTo(ROUTES.HOME);
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
          ${
            !photo.yearEnd || photo.yearStart === photo.yearEnd
              ? photo.yearStart
              : `${photo.yearStart} ~ ${photo.yearEnd}`
          }
        </p>

        ${photo.location ? `<p class="location">📍 ${photo.location}</p>` : ""}

        ${
          photo.people?.length
            ? `<p class="people">👨‍👩‍👧‍👦 ${photo.people.join(", ")}</p>`
            : ""
        }

        ${photo.event ? `<p class="event">🎉 ${photo.event}</p>` : ""}

        ${photo.description ? `<p class="description">${photo.description}</p>` : ""}

      </div>

      <img src="${photo.image}" />

    </article>
  `;
}

function initDetails() {
  initBackButton();
  initDetailsPage();
}

document.addEventListener("DOMContentLoaded", initDetails);
