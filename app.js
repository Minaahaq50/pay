// login.js

const loginBtn = document.getElementById("login-btn");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");

const toast = document.getElementById("toast");
const overlay = document.getElementById("loading-overlay");

// Toast
function showToast(msg, type = "info") {
  toast.textContent = msg;
  toast.className = "toast show";
  if (type === "error") toast.classList.add("error");
  if (type === "success") toast.classList.add("success");

  setTimeout(() => toast.classList.remove("show"), 3000);
}

// Loading
function setLoading(state) {
  if (!overlay) return;
  overlay.classList.toggle("active", state);
}

// Login
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast("ادخل الإيميل وكلمة المرور", "error");
    return;
  }

  setLoading(true);

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // تأكد إن user موجود في Firestore
    const userRef = db.collection("users").doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email: user.email,
        uid: user.uid,
        isSubscribed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    showToast("تم تسجيل الدخول بنجاح", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    let msg = err.message;

    if (err.code === "auth/user-not-found")
      msg = "لا يوجد حساب بهذا الإيميل";

    if (err.code === "auth/wrong-password")
      msg = "كلمة المرور خطأ";

    showToast(msg, "error");

  } finally {
    setLoading(false);
  }
});
