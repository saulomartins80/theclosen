import admin from 'firebase-admin';

// Inicialize se necessário (igual no authService)
if (!admin.apps.length) {
  admin.initializeApp({
    // mesma configuração do authService
  });
}

const db = admin.firestore();

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