import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmfAkYQS55UBIn8lphcd6Ejig2aqsKwkE",
  authDomain: "analytics-sws.firebaseapp.com",
  projectId: "analytics-sws",
  storageBucket: "analytics-sws.firebasestorage.app",
  messagingSenderId: "209517929426",
  appId: "1:209517929426:web:bc1078d3ed359d57405e0b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
