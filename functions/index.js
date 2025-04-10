"use strict";
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp();

const swearWordsPath = path.join(__dirname, "..", "swearWords.txt");
const swearWordsContent = fs.readFileSync(swearWordsPath, "utf8");
const explicitWords = swearWordsContent.split("\n").map(word => word.trim()).filter(word => word.length > 0);

exports.filterExplicitContent = onSchedule(
  { schedule: "every 5 minutes", timeoutSeconds: 60 },
  async () => {
    const db = admin.firestore();
    const postsSnapshot = await db.collection("posts").get();
    postsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.content) {
        const contentLower = data.content.toLowerCase();
        const containsExplicit = explicitWords.some(word => contentLower.includes(word.toLowerCase()));
        if (containsExplicit) {
          db.collection("posts").doc(doc.id).delete();
        }
      }
    });
    const bulletinsSnapshot = await db.collection("bulletins").get();
    bulletinsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.content) {
        const contentLower = data.content.toLowerCase();
        const containsExplicit = explicitWords.some(word => contentLower.includes(word.toLowerCase()));
        if (containsExplicit) {
          db.collection("bulletins").doc(doc.id).delete();
        }
      }
    });
  }
);
