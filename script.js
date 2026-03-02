import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

window.toggleDarkMode = function(){
    document.body.classList.toggle("dark");
}

window.goToStories = function(){
    switchScreen("storyScreen");
    loadStories();
}

window.goToWrite = function(){
    switchScreen("writeScreen");
}

function switchScreen(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

window.saveStory = async function(){
    const username = document.getElementById("username").value.trim();
    const photoInput = document.getElementById("photo");
    const storyText = document.getElementById("storyText").value.trim();
    const mood = document.getElementById("mood").value;
    const category = document.getElementById("category").value;

    if(!username || !storyText || photoInput.files.length===0){
        alert("Tüm alanlar zorunlu.");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function(e){
        await addDoc(collection(db, "stories"), {
            username,
            photo: e.target.result,
            text: storyText,
            mood,
            category,
            empathy: 0
        });

        goToStories();
    };

    reader.readAsDataURL(photoInput.files[0]);
}

window.addEmpathy = async function(id, current){
    const storyRef = doc(db, "stories", id);
    await updateDoc(storyRef, {
        empathy: current + 1
    });
    loadStories();
}

window.loadStories = async function(){
    const moodFilter = document.getElementById("moodFilter").value;
    const categoryFilter = document.getElementById("categoryFilter").value;

    const storyList = document.getElementById("storyList");
    storyList.innerHTML="";

    const querySnapshot = await getDocs(collection(db, "stories"));

    querySnapshot.forEach((docSnap)=>{
        const story = docSnap.data();

        if(moodFilter!=="all" && story.mood!==moodFilter) return;
        if(categoryFilter!=="all" && story.category!==categoryFilter) return;

        const card=document.createElement("div");
        card.className="story-card";

        card.innerHTML=`
            <div class="story-header">
                <img src="${story.photo}">
                <div>
                    <strong>${story.username}</strong><br>
                    <small>${story.category.toUpperCase()} • ${story.mood}</small>
                </div>
            </div>
            <p>${story.text}</p>
            <div class="empathy" onclick="addEmpathy('${docSnap.id}', ${story.empathy})">
                ❤️ Empati (${story.empathy})
            </div>
        `;

        storyList.appendChild(card);
    });
}