// dashboard.js - Firestore Integration + Subscription Logic
// Assumes firebase-config.js is loaded with initialized firebase, auth, db

const auth = firebase.auth();
const db = firebase.firestore();

// ---------- Subjects Database ----------
const allSubjects = [
    { id: "arabic", name: "اللغة العربية", category: "free", icon: "fas fa-book-open", imgColor: "#2c3e66", locked: false },
    { id: "french", name: "الفرنساوي", category: "free", icon: "fas fa-language", imgColor: "#2c5f2d", locked: false },
    { id: "religion", name: "التربية الدينية", category: "free", icon: "fas fa-mosque", imgColor: "#2b6e4f", locked: false },
    { id: "national", name: "التربية الوطنية", category: "free", icon: "fas fa-flag", imgColor: "#1e4a76", locked: false },
    { id: "math", name: "رياضيات", category: "premium", icon: "fas fa-calculator", imgColor: "#7c3aed", locked: true },
    { id: "physics", name: "فيزياء", category: "premium", icon: "fas fa-atom", imgColor: "#4f46e5", locked: true },
    { id: "chemistry", name: "كيمياء", category: "premium", icon: "fas fa-flask", imgColor: "#0891b2", locked: true },
    { id: "biology", name: "أحياء", category: "premium", icon: "fas fa-dna", imgColor: "#059669", locked: true },
    { id: "geology", name: "جيولوجيا", category: "premium", icon: "fas fa-mountain", imgColor: "#b45309", locked: true },
    { id: "english", name: "إنجليزي", category: "premium", icon: "fas fa-chalkboard-user", imgColor: "#2563eb", locked: true },
    { id: "philosophy", name: "فلسفة", category: "premium", icon: "fas fa-brain", imgColor: "#7e22ce", locked: true },
    { id: "psychology", name: "علم نفس", category: "premium", icon: "fas fa-heart", imgColor: "#db2777", locked: true }
];

let currentUserData = null; // subscription status
let currentFilter = "all";
let searchQuery = "";

// UI Elements
const subjectsGrid = document.getElementById("subjectsGrid");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const modal = document.getElementById("subscriptionModal");
const modalSubjectNameSpan = document.getElementById("modalSubjectName");
let selectedLockedSubject = null;
const loadingToast = (msg, isError = false) => {
    const toast = document.getElementById("customToast");
    toast.textContent = msg;
    toast.style.background = isError ? "#7f1a1a" : "#1e293b";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
};
const setLoading = (state) => {
    const loader = document.getElementById("loadingOverlay");
    if (state) loader.classList.add("active");
    else loader.classList.remove("active");
};

// Get user subscription status from Firestore (premium flag)
async function fetchUserSubscription(uid) {
    try {
        const subDoc = await db.collection("users").doc(uid).get();
        if (subDoc.exists) {
            const data = subDoc.data();
            currentUserData = { isSubscribed: data.isSubscribed === true, subscriptionDate: data.subscriptionDate };
            return currentUserData.isSubscribed;
        } else {
            // create default user doc (not subscribed)
            await db.collection("users").doc(uid).set({
                isSubscribed: false,
                email: auth.currentUser?.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            currentUserData = { isSubscribed: false };
            return false;
        }
    } catch (e) {
        console.warn(e);
        return false;
    }
}

// render subjects based on filter + search + subscription
function renderDashboard() {
    let filtered = [...allSubjects];
    if (currentFilter === "free") filtered = filtered.filter(s => s.category === "free");
    if (currentFilter === "premium") filtered = filtered.filter(s => s.category === "premium");
    if (searchQuery.trim() !== "") {
        filtered = filtered.filter(s => s.name.includes(searchQuery.trim()));
    }

    const isPremiumUser = currentUserData?.isSubscribed === true;
    // update premium count in banner
    const premiumCountElem = document.getElementById("premiumCount");
    if (premiumCountElem) premiumCountElem.innerText = allSubjects.filter(s => s.category === "premium").length;

    if (subjectsGrid) {
        subjectsGrid.innerHTML = filtered.map(sub => {
            const isLocked = (sub.category === "premium" && !isPremiumUser);
            return `
                <div class="subject-card" data-id="${sub.id}">
                    <div class="card-img" style="background: linear-gradient(145deg, ${sub.imgColor}80, #0f172a);">
                        <i class="${sub.icon}"></i>
                        ${isLocked ? `<div class="lock-overlay"><i class="fas fa-lock"></i><span>مقفلة</span></div>` : ""}
                    </div>
                    <div class="card-content">
                        <h3>${sub.name}</h3>
                        <span class="badge ${isLocked ? 'locked' : 'free'}">${isLocked ? 'مدفوعة' : 'مجانية'}</span>
                        <button class="enter-btn" data-subject='${JSON.stringify(sub)}' data-locked="${isLocked}">
                            ${isLocked ? 'اشترك للدخول' : 'دخول <i class="fas fa-arrow-left"></i>'}
                        </button>
                    </div>
                </div>
            `;
        }).join("");
        // attach event listeners
        document.querySelectorAll(".enter-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const subData = JSON.parse(btn.getAttribute("data-subject"));
                const locked = btn.getAttribute("data-locked") === "true";
                if (locked) {
                    selectedLockedSubject = subData;
                    modalSubjectNameSpan.innerText = subData.name;
                    modal.classList.add("active");
                } else {
                    loadingToast(`✨ جاري فتح ${subData.name}...`);
                    setTimeout(() => alert(`تم الدخول إلى مادة ${subData.name} (محاكاة الامتحان)`), 600);
                }
            });
        });
    }
}

// upgrade subscription (premium)
async function handleSubscribe() {
    if (!auth.currentUser) { loadingToast("يجب تسجيل الدخول أولاً", true); return; }
    setLoading(true);
    try {
        await db.collection("users").doc(auth.currentUser.uid).update({
            isSubscribed: true,
            subscriptionDate: firebase.firestore.FieldValue.serverTimestamp()
        });
        currentUserData = { isSubscribed: true };
        loadingToast("🎉 تهانينا! تم تفعيل الاشتراك المميز، يمكنك الآن الوصول للمواد المدفوعة", false);
        modal.classList.remove("active");
        renderDashboard(); // re-render with unlocked
    } catch (error) {
        loadingToast("فشل الترقية: " + error.message, true);
    } finally {
        setLoading(false);
    }
}

// Logout
async function logoutUser() {
    setLoading(true);
    try {
        await auth.signOut();
        window.location.href = "index.html"; // redirect to login page
    } catch (e) { loadingToast("خطأ", true); }
    finally { setLoading(false); }
}

// User profile UI
function updateUserUI(user) {
    if (!user) return;
    const nameSpan = document.getElementById("userNameDisplay");
    const greetingSpan = document.getElementById("greetingUserName");
    const dropdownName = document.getElementById("dropdownUserName");
    const dropdownEmail = document.getElementById("dropdownUserEmail");
    const displayName = user.displayName || user.email.split('@')[0];
    nameSpan.innerText = displayName;
    greetingSpan.innerText = displayName;
    dropdownName.innerText = displayName;
    dropdownEmail.innerText = user.email;
}

// Dropdown toggle
const profileBtn = document.getElementById("userProfileBtn");
profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileBtn.classList.toggle("active");
});
document.addEventListener("click", () => profileBtn.classList.remove("active"));

// Event Listeners
searchInput.addEventListener("input", (e) => { searchQuery = e.target.value; renderDashboard(); });
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        renderDashboard();
    });
});
document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
document.getElementById("confirmSubscribeBtn")?.addEventListener("click", handleSubscribe);
document.getElementById("cancelModalBtn")?.addEventListener("click", () => modal.classList.remove("active"));
document.getElementById("closeModalBtn")?.addEventListener("click", () => modal.classList.remove("active"));

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        updateUserUI(user);
        await fetchUserSubscription(user.uid);
        renderDashboard();
    } else {
        window.location.href = "index.html";
    }
});
