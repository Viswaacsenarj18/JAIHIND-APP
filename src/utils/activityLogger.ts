import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const logActivity = async (activity: {
  type: "user" | "order" | "product" | "category" | "notification";
  title: string;
  subtitle: string;
  adminName?: string;
  details?: any;
}) => {
  try {
    await addDoc(collection(db, "activities"), {
      ...activity,
      timestamp: serverTimestamp(),
    });
    console.log(`📝 Activity logged: ${activity.title}`);
  } catch (err) {
    console.error("Activity logging failed:", err);
  }
};
