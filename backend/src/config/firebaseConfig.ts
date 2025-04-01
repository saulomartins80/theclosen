import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAuMpESwxOiUS4hi8i4b259zl39wsB__S4",
  authDomain: "finup-saas-2025.firebaseapp.com",
  projectId: "finup-saas-2025",
  storageBucket: "finup-saas-2025.appspot.com",
  messagingSenderId: "656351422904-667dmh0muaenmccb1dbp1qvjop5g7vf0.apps.googleusercontent.com656351422904",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);