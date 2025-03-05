import { db } from "../firebaseConfig";

export const addBudget = async (budget: any) => {
  await db.collection("budgets").add(budget);
};

export const getBudgets = async (userId: string) => {
  const querySnapshot = await db.collection("budgets").where("userId", "==", userId).get();
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
