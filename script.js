import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCH71KOqeMJZPmMAMdsPEqSbmOK4mAgd4",
  authDomain: "mysite-9217d.firebaseapp.com",
  projectId: "mysite-9217d",
  storageBucket: "mysite-9217d.firebasestorage.app",
  messagingSenderId: "506696565565",
  appId: "1:506696565565:web:e5412b13d913a34b547b54"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storiesRef = collection(db, "stories");

// Kullanıcıya gizli ID
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("userId", userId);
}

const storyList = document.getElementById("storyList");
const topStoriesDiv = document.getElementById("topStories");
const form = document.getElementById("storyForm");

// Zaman hesaplama
function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Az önce";
  if (hours < 24) return hours + " saat önce";
  const days = Math.floor(hours / 24);
  return days + " gün önce";
}

// Bölüm aç/kapat
window.toggleSection = function (id) {
  const section = document.getElementById(id);
  if (section.style.display === "none" || section.style.display === "") {
    section.style.display = "block";
  } else {
    section.style.display = "none";
  }
};

async function loadStories() {
  storyList.innerHTML = "";
  topStoriesDiv.innerHTML = "";

  const snapshot = await getDocs(storiesRef);
  let stories = [];

  snapshot.forEach((docSnap) => {
    stories.push({ id: docSnap.id, ...docSnap.data() });
  });

  // 🔥 En çok empati alanlar
  const top = [...stories]
    .sort((a, b) => (b.empathy || 0) - (a.empathy || 0))
    .slice(0, 3);

  if (top.length === 0) {
    topStoriesDiv.innerHTML = "<p>Henüz empati alan hikaye yok.</p>";
  } else {
    top.forEach((data) => {
      const div = document.createElement("div");
      div.className = "story-card";
      div.innerHTML = `
        <p>${data.story}</p>
        <small>❤️ ${data.empathy || 0}</small>
      `;
      topStoriesDiv.appendChild(div);
    });
  }

  // 📚 Tüm hikayeler
  if (stories.length === 0) {
    storyList.innerHTML = "<p>Burada henüz hikaye yok.</p>";
  } else {
    stories.forEach((data) => {
      const card = document.createElement("div");
      card.className = "story-card";

      card.innerHTML = `
        <h3>${data.username}</h3>
        <p>${data.story}</p>
        <small>${data.category} • ${timeAgo(data.createdAt)}</small>
        <div>
          ❤️ <span>${data.empathy || 0}</span>
          <button class="empBtn">Empati</button>
        </div>
      `;

      // ❤️ Empati artırma
      card.querySelector(".empBtn").onclick = async () => {
        await updateDoc(doc(db, "stories", data.id), {
          empathy: increment(1)
        });
        loadStories();
      };

      // 🗑 Sadece kendi hikayesini sil
      if (data.userId === userId) {
        const delBtn = document.createElement("button");
        delBtn.innerText = "Sil";
        delBtn.onclick = async () => {
          await deleteDoc(doc(db, "stories", data.id));
          loadStories();
        };
        card.appendChild(delBtn);
      }

      storyList.appendChild(card);
    });
  }
}

// Hikaye gönderme (çift gönderim engelli)
let isSubmitting = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  const username = document.getElementById("username").value;
  const story = document.getElementById("story").value;
  const category = document.getElementById("category").value;

  await addDoc(storiesRef, {
    username,
    story,
    category,
    userId,
    empathy: 0,
    createdAt: Date.now()
  });

  form.reset();
  isSubmitting = false;
  loadStories();
});

// 🌙 Gece modu
document.getElementById("darkModeToggle").onclick = () => {
  document.body.classList.toggle("dark");
};

// 🎲 Rastgele hikaye
document.getElementById("randomBtn").onclick = async () => {
  const snapshot = await getDocs(storiesRef);
  let stories = [];
  snapshot.forEach((d) => stories.push(d.data()));
  if (stories.length === 0) {
    alert("Henüz hikaye yok.");
    return;
  }
  const random = stories[Math.floor(Math.random() * stories.length)];
  alert(random.story);
};

loadStories();