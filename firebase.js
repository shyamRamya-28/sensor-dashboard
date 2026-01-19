// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCqfBL46Y5MZ_NFyedq8MTZOIBvNR-Kog",
    authDomain: "patient-health-monitorin-94ce1.firebaseapp.com",
    databaseURL: "https://patient-health-monitorin-94ce1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "patient-health-monitorin-94ce1",
    storageBucket: "patient-health-monitorin-94ce1.firebasestorage.app",
    messagingSenderId: "274102899124",
    appId: "1:274102899124:web:a1bbcb5fbfce00a4e262e1"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
console.log("Firebase initialized successfully!");
