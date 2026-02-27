import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlKsDap_3Y1TNbkBYBMv96Lbrgon1Sq24",
  authDomain: "nascimentos-photos.firebaseapp.com",
  projectId: "nascimentos-photos",
  storageBucket: "nascimentos-photos.firebasestorage.app",
  messagingSenderId: "845509778398",
  appId: "1:845509778398:web:1210ff4481178628b7db4f",
  measurementId: "G-BWHKMMM0G2",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
