import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAg-8_ac9-qy2FBSnPrXoEaVhQjlLXudoo",
  authDomain: "padle-over40.firebaseapp.com",
  databaseURL: "https://padle-over40-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "padle-over40",
  storageBucket: "padle-over40.firebasestorage.app",
  messagingSenderId: "663130548898",
  appId: "1:663130548898:web:daa2776aff8ffbae0285fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);