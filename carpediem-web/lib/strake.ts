import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";

export const updateUserStreak = async (uid: string) => {
  const today = new Date().toISOString().split("T")[0];

  const ref = doc(db, COLLECTIONS.userProfiles, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  const lastDate = data.lastActivityDate || null;
  let streak = data.streakDays || 0;

  if (lastDate === today) {
    // mismo día → solo suma acción
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    if (lastDate === yStr) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  await setDoc(
    ref,
    {
      streakDays: streak,
      lastActivityDate: today,
      totalStudyActions: (data.totalStudyActions || 0) + 1,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};