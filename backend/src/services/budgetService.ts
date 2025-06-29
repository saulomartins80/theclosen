import { adminFirestore } from '@config/firebaseAdmin';

const db = adminFirestore;

interface Budget {
  userId: string;
  amount: number;
  category: string;
  // outros campos necessários
}

export const getBudgets = async (userId: string): Promise<Budget[]> => {
  const querySnapshot = await db
    .collection("budgets")
    .where("userId", "==", userId)
    .get();

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data() as Budget
  }));
};