import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZWzRt6h3Za7ZG5_kDr-AXBdQbh4Mg9yg",
  authDomain: "finup-saas-2025.firebaseapp.com",
  projectId: "finup-saas-2025",
  storageBucket: "finup-saas-2025.appspot.com",
  messagingSenderId: "656351422904",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
