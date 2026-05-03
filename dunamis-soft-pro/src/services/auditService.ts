import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

export const logAudit = async (action: string, details: any) => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, "audit_logs"), {
      userId: user?.uid || "anonymous",
      userEmail: user?.email || "anonymous",
      action,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
};

export const auditService = {
  log: logAudit
};
