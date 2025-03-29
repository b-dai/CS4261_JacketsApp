import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
    apiKey: "AIzaSyA33eilkooJ9ik3rKmtxUvMPf-0qkIZtWY",
    authDomain: "cs4261jacketsapp.firebaseapp.com",
    projectId: "cs4261jacketsapp",
    storageBucket: "cs4261jacketsapp.firebasestorage.app",
    messagingSenderId: "849450701292",
    appId: "1:849450701292:web:eaad6dd58aea3173bd30c9",
    measurementId: "G-HR1R2X4TXN"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
})