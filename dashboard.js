
// ---------- Subjects ----------
const allSubjects = [
    { id: "arabic", name: "اللغة العربية", category: "free", icon: "fas fa-book-open", imgColor: "#2c3e66" },
    { id: "french", name: "الفرنساوي", category: "free", icon: "fas fa-language", imgColor: "#2c5f2d" },
    { id: "religion", name: "التربية الدينية", category: "free", icon: "fas fa-mosque", imgColor: "#2b6e4f" },
    { id: "national", name: "التربية الوطنية", category: "free", icon: "fas fa-flag", imgColor: "#1e4a76" },

    { id: "math", name: "رياضيات", category: "premium", icon: "fas fa-calculator", imgColor: "#7c3aed", price: 500 },
    { id: "physics", name: "فيزياء", category: "premium", icon: "fas fa-atom", imgColor: "#4f46e5", price: 500 },
    { id: "chemistry", name: "كيمياء", category: "premium", icon: "fas fa-flask", imgColor: "#0891b2", price: 500 },
    { id: "biology", name: "أحياء", category: "premium", icon: "fas fa-dna", imgColor: "#059669", price: 500 }
];

let currentUserData = null;
let currentFilter = "all";
let searchQuery = "";

// UI
const subjectsGrid = document.getElementById("subjectsGrid");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");

// =======================
// Toast
// =======================
function toast(msg, error = false) {
    const t = document.getElementById("customToast");
    t.textContent = msg;
    t.style.background = error ? "#7f1a1a" : "#1e293b";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2500);
}

// =======================
// Firestore user subscription
// =======================
async function fetchUser(uid) {
    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
        await db.collection("users").doc(uid).set({
            isSubscribed: false
        });
        currentUserData = { isSubscribed: false };
        return;
    }

    currentUserData = doc.data();
}

// =======================
// Render subjects
// =======================
function render() {
    let list = [...allSubjects];

    if (currentFilter !== "all") {
        list = list.filter(s => s.category === currentFilter);
    }

    if (searchQuery.trim()) {
        list = list.filter(s => s.name.includes(searchQuery));
    }

    const isPremium = currentUserData?.isSubscribed;

    subjectsGrid.innerHTML = list.map(s => {
        const locked = s.category === "premium" && !isPremium;

        return `
        <div class="subject-card">
            <div class="card-img" style="background:${s.imgColor}">
                <i class="${s.icon}"></i>
            </div>

            <div class="card-content">
                <h3>${s.name}</h3>

                <button class="enter-btn"
                    data-id="${s.id}"
                    data-name="${s.name}"
                    data-price="${s.price || 0}"
                    data-locked="${locked}">
                    
                    ${locked ? "اشترك الآن" : "دخول"}
                </button>
            </div>
        </div>
        `;
    }).join("");

    // click handlers
    document.querySelectorAll(".enter-btn").forEach(btn => {
        btn.onclick = () => {

            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = btn.dataset.price;
            const locked = btn.dataset.locked === "true";

            if (locked) {
                // 🔥 أهم جزء: تحويل لصفحة اشتراك واحدة فقط
                window.location.href =
                    `subscription.html?subject=${id}&name=${encodeURIComponent(name)}&price=${price}`;
            } else {
                window.location.href =
                    `exam.html?subject=${id}`;
            }
        };
    });
}

// =======================
// Auth
// =======================
auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    await fetchUser(user.uid);
    render();
});

// =======================
// Filters
// =======================
filterBtns.forEach(btn => {
    btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentFilter = btn.dataset.filter;
        render();
    };
});

// =======================
// Search
// =======================
searchInput.addEventListener("input", e => {
    searchQuery = e.target.value;
    render();
});
