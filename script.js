import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "BURAYA_API_KEY",
  authDomain: "BURAYA_AUTH_DOMAIN",
  projectId: "BURAYA_PROJECT_ID",
  storageBucket: "BURAYA_STORAGE_BUCKET",
  messagingSenderId: "BURAYA_SENDER_ID",
  appId: "BURAYA_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storiesRef = collection(db, "stories");

let userId = localStorage.getItem("userId");
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("userId", userId);
}

const storyList = document.getElementById("storyList");
const topStoriesDiv = document.getElementById("topStories");

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Az önce";
  if (hours < 24) return hours + " saat önce";
  const days = Math.floor(hours / 24);
  return days + " gün önce";
}

async function loadStories() {
  storyList.innerHTML = "";
  topStoriesDiv.innerHTML = "";

  const snapshot = await getDocs(storiesRef);
  let stories = [];

  snapshot.forEach((docSnap) => {
    stories.push({ id: docSnap.id, ...docSnap.data() });
  });

  // 🔥 En çok empati alanlar
  const top = [...stories].sort((a,b)=> (b.empathy||0)-(a.empathy||0)).slice(0,3);
  top.forEach(data => {
    const div = document.createElement("div");
    div.className="story-card";
    div.innerHTML=`<p>${data.story}</p><small>❤️ ${data.empathy||0}</small>`;
    topStoriesDiv.appendChild(div);
  });

  // Tüm hikayeler
  stories.forEach((data) => {
    const card = document.createElement("div");
    card.className = "story-card";

    card.innerHTML = `
      <h3>${data.username}</h3>
      <p>${data.story}</p>
      <small>${data.category} • ${timeAgo(data.createdAt)}</small>
      <div>
        ❤️ ${data.empathy||0}
        <button class="empBtn">Empati</button>
      </div>
    `;

    // Empati
    card.querySelector(".empBtn").onclick = async () => {
      await updateDoc(doc(db,"stories",data.id), {
        empathy: (data.empathy||0)+1
      });
      loadStories();
    };

    // Silme (sadece kendi hikayesi)
    if (data.userId === userId) {
      const delBtn = document.createElement("button");
      delBtn.innerText="Sil";
      delBtn.onclick=async()=>{
        await deleteDoc(doc(db,"stories",data.id));
        loadStories();
      };
      card.appendChild(delBtn);
    }

    storyList.appendChild(card);
  });
}

document.getElementById("storyForm").addEventListener("submit", async (e) => {
  e.preventDefault();

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

  e.target.reset();
  loadStories();
});

// 🌙 Gece modu
document.getElementById("darkModeToggle").onclick=()=>{
  document.body.classList.toggle("dark");
};

// 🎲 Rastgele hikaye
document.getElementById("randomBtn").onclick=async()=>{
  const snapshot = await getDocs(storiesRef);
  let stories=[];
  snapshot.forEach(d=>stories.push(d.data()));
  if(stories.length===0) return;
  const random=stories[Math.floor(Math.random()*stories.length)];
  alert(random.story);
};

loadStories();