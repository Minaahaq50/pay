// firebase-config.js - Firebase configuration (replace with your own)
// IMPORTANT: Replace with your Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyDsJXNa6EYenn2f5mfoNQVEDxHhCH-XGAo",
  authDomain: "alzahady-6e615.firebaseapp.com",
  databaseURL: "https://alzahady-6e615-default-rtdb.firebaseio.com",
  projectId: "alzahady-6e615",
  storageBucket: "alzahady-6e615.firebasestorage.app",
  messagingSenderId: "377804257010",
  appId: "1:377804257010:web:9516e9ecbbc8b22ab0c26b",
  measurementId: "G-4XPCD5L40F"
};

// Initialize Firebase (if not already)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Helper: generate or get deviceId (unique per browser)
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Show Toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') toast.classList.add('error');
    if (type === 'success') toast.classList.add('success');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.remove('error', 'success');
    }, 3500);
}

// Loading controller
let loadingActive = false;
function setLoading(loading) {
    const overlay = document.getElementById('loading-overlay');
    if (loading) {
        overlay.classList.add('active');
        loadingActive = true;
    } else {
        overlay.classList.remove('active');
        loadingActive = false;
    }
}

// UI Tabs Logic
const tabBtns = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('.form-container');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        forms.forEach(form => form.classList.remove('active'));
        if (tabId === 'login') document.getElementById('login-form').classList.add('active');
        else document.getElementById('register-form').classList.add('active');
    });
});

// Toggle password visibility
document.querySelectorAll('.toggle-pw').forEach(icon => {
    icon.addEventListener('click', (e) => {
        const targetId = icon.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
});

// ---------- Helper: Validate device match for existing user ----------
async function validateDeviceForUser(user) {
    const deviceId = getDeviceId();
    const userDocRef = db.collection('users').doc(user.uid);
    const doc = await userDocRef.get();
    if (!doc.exists) {
        // if somehow user exists in auth but not firestore, create record (fallback)
        await userDocRef.set({
            name: user.displayName || '',
            email: user.email,
            uid: user.uid,
            deviceId: deviceId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    }
    const storedDevice = doc.data().deviceId;
    if (storedDevice !== deviceId) {
        // sign out because another device logged in
        await auth.signOut();
        throw new Error("تم تسجيل دخول هذا الحساب من جهاز آخر. لا يمكن استخدام أكثر من جهاز.");
    }
    return true;
}

// Register
document.getElementById('register-btn').addEventListener('click', async () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPw = document.getElementById('reg-confirm-pw').value;

    if (!name || !email || !password || !confirmPw) {
        showToast('الرجاء ملء جميع الحقول', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    if (password !== confirmPw) {
        showToast('كلمة المرور وتأكيدها غير متطابقين', 'error');
        return;
    }

    setLoading(true);
    try {
        const deviceId = getDeviceId();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // update profile with display name
        await user.updateProfile({ displayName: name });

        // Save to Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            uid: user.uid,
            deviceId: deviceId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast(`مرحباً ${name}! تم إنشاء الحساب بنجاح`, 'success');
        // Auto redirect or reset form? clear register form
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';
        document.getElementById('reg-confirm-pw').value = '';
        // Switch to login tab
        document.querySelector('[data-tab="login"]').click();
    } catch (err) {
        let errorMsg = err.message;
        if (err.code === 'auth/email-already-in-use') errorMsg = 'البريد الإلكتروني مستخدم بالفعل';
        showToast(errorMsg, 'error');
    } finally {
        setLoading(false);
    }
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }

    setLoading(true);
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check device restriction
        await validateDeviceForUser(user);
        showToast(`تم تسجيل الدخول بنجاح! مرحباً ${user.displayName || user.email}`, 'success');
        // after success redirect to dashboard or exams page (simulate)
        setTimeout(() => {
    window.location.href = "dashboard.html";
}, 800);
    } catch (err) {
        let msg = err.message;
        if (err.code === 'auth/user-not-found') msg = 'لا يوجد حساب مرتبط بهذا البريد';
        else if (err.code === 'auth/wrong-password') msg = 'كلمة المرور غير صحيحة';
        else if (err.message.includes("لا يمكن استخدام أكثر من جهاز")) msg = err.message;
        showToast(msg, 'error');
        if (err.message.includes("جهاز آخر")) {
            await auth.signOut();
        }
    } finally {
        setLoading(false);
    }
});

// Forgot Password Modal logic (simple flow via email)
document.getElementById('forgot-password-link').addEventListener('click', async (e) => {
    e.preventDefault();
    const emailForReset = prompt("أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:");
    if (!emailForReset) return;
    setLoading(true);
    try {
        await auth.sendPasswordResetEmail(emailForReset);
        showToast('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني', 'success');
    } catch (err) {
        let errorMsg = 'فشل إرسال البريد، تأكد من صحة الإيميل';
        if (err.code === 'auth/user-not-found') errorMsg = 'لا يوجد حساب مرتبط بهذا الإيميل';
        showToast(errorMsg, 'error');
    } finally {
        setLoading(false);
    }
});

// On auth state change: check device blocking also for existing sessions if needed
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // additional device check on page refresh / re-auth
        try {
            await validateDeviceForUser(user);
        } catch (err) {
            showToast(err.message, 'error');
            await auth.signOut();
            location.reload(); // reset UI to login
        }
    }
});

// Additional : Device register for first-login on existing accounts (if not stored)
// This ensures every authenticated user will have deviceId stored if missing.
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const deviceId = getDeviceId();
        const userRef = db.collection('users').doc(user.uid);
        const docSnap = await userRef.get();
        if (!docSnap.exists) {
            // create missing record (safety)
            await userRef.set({
                name: user.displayName || '',
                email: user.email,
                uid: user.uid,
                deviceId: deviceId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const currentDevice = docSnap.data().deviceId;
            if (currentDevice !== deviceId) {
                showToast("تم تسجيل الخروج بسبب جهاز غير مصرح به", "error");
                await auth.signOut();
            }
        }
    }
});
