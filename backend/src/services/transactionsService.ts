import { db } from "../firebaseConfig";

export const addTransaction = async (transaction: any) => {
  const docRef = await db.collection("transactions").add(transaction);
  return docRef.id;
};

export const getTransactions = async () => {
  const querySnapshot = await db.collection("transactions").get();
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
