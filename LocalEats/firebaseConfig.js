// firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNgPC3-pJhe3McvFGAHVWNwoNg_9hYtfA",
  authDomain: "localeats-86f23.firebaseapp.com",
  projectId: "localeats-86f23",
  storageBucket: "localeats-86f23.firebasestorage.app",
  messagingSenderId: "530872439346",
  appId: "1:530872439346:web:08690007a22970ac7b622b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);