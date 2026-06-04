const firebaseConfig = {
  apiKey: "AIzaSyDsJXNa6EYenn2f5mfoNQVEDxHhCH-XGAo",
  authDomain: "alzahady-6e615.firebaseapp.com",
  projectId: "alzahady-6e615",
  storageBucket: "alzahady-6e615.firebasestorage.app",
  messagingSenderId: "377804257010",
  appId: "1:377804257010:web:9516e9ecbbc8b22ab0c26b",
  measurementId: "G-4XPCD5L40F"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
