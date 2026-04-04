"use client";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuOVN4dWrQvt_D9jHNFbZvnXbFy4vwCsk",
  authDomain: "carpe-diem-63c47.firebaseapp.com",
  projectId: "carpe-diem-63c47",
  storageBucket: "carpe-diem-63c47.firebasestorage.app",
  messagingSenderId: "595519632591",
  appId: "1:595519632591:web:072ad5c4f3370aa49ab3ba",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);