// src/services/subscriptionService.ts
import { admin } from '../config/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore'; // Importar Timestamp
import { injectable } from 'inversify';
import { Subscription } from '../types/Subscription';

const db = admin.firestore();

// Definir uma interface mais clara para os dados de criação
interface CreateSubscriptionData {
  userId: string;
  plan: string;
  status: string;
  expiresAt?: Date; // Datas podem vir como Date objects
  createdAt?: Date;
  updatedAt?: Date;
}


@injectable()
export class SubscriptionService {
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const doc = await db.collection('subscriptions').doc(userId).get();

      if (!doc.exists) return null;

      const data = doc.data();

      // Converter Timestamps do Firestore para strings ISO 8601
      const expiresAt = data?.expiresAt instanceof Timestamp ? data.expiresAt.toDate().toISOString() : data?.expiresAt;
      const createdAt = data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data?.createdAt;
      const updatedAt = data?.updatedAt instanceof Timestamp ? data?.updatedAt.toDate().toISOString() : data?.updatedAt;

      return {
        id: doc.id,
        plan: data?.plan,
        status: data?.status,
        expiresAt: expiresAt,
        createdAt: createdAt,
        updatedAt: updatedAt
      } as Subscription; // Adicionado type assertion
    } catch (error) {
      console.error(`Error fetching subscription for user ${userId}:`, error);
      // Lançar um erro personalizado ou re-lançar
      throw new Error('Failed to fetch subscription');
    }
  }

  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
      try {
        const now = FieldValue.serverTimestamp();
        const subscriptionRef = db.collection('subscriptions').doc(data.userId);

        const subscriptionDataToSave = {
            userId: data.userId,
            plan: data.plan,
            status: data.status,
            // Converte Dates para Timestamps se necessário
            expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
            createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : now, // Usa fornecido ou timestamp do servidor
            updatedAt: now,
        };

        await subscriptionRef.set(subscriptionDataToSave, { merge: true }); // Use set com merge para criar se não existir

        // Opcional: buscar o documento salvo para retornar o objeto Subscription completo com ID e timestamps
        const savedDoc = await subscriptionRef.get();
        const savedData = savedDoc.data();

        if (!savedDoc.exists || !savedData) {
             throw new Error('Failed to retrieve created subscription data');
        }

         const expiresAt = savedData.expiresAt instanceof Timestamp ? savedData.expiresAt.toDate().toISOString() : savedData.expiresAt;
         const createdAt = savedData.createdAt instanceof Timestamp ? savedData.createdAt.toDate().toISOString() : savedData.createdAt;
         const updatedAt = savedData.updatedAt instanceof Timestamp ? savedData.updatedAt.toDate().toISOString() : savedData.updatedAt;


        return {
          id: savedDoc.id, // O ID do documento é o userId
          plan: savedData.plan,
          status: savedData.status,
          expiresAt: expiresAt,
          createdAt: createdAt,
          updatedAt: updatedAt,
        } as Subscription;

      } catch (error) {
        console.error(`Error creating subscription for user ${data.userId}:`, error);
        throw new Error('Failed to create subscription');
      }
  }


  async updateSubscription(
    userId: string,
    subscriptionData: Partial<Subscription>
  ): Promise<void> {
    try {
       // Preparar dados, convertendo datas para Timestamps se necessário
        const updatePayload: any = { ...subscriptionData };
        if (updatePayload.expiresAt && typeof updatePayload.expiresAt === 'string') {
           // Assume que strings de data ISO 8601 devem ser convertidas para Timestamps
           try {
               updatePayload.expiresAt = Timestamp.fromDate(new Date(updatePayload.expiresAt));
           } catch (e) {
              console.error('Invalid expiresAt date string:', updatePayload.expiresAt);
              // Decida como lidar: ignorar atualização, lançar erro? Por enquanto, loga e continua.
           }
        }
        // Adicionar timestamp de atualização do servidor
        updatePayload.updatedAt = FieldValue.serverTimestamp();


      await db.collection('subscriptions').doc(userId).set(updatePayload, { merge: true });
    } catch (error) {
      console.error(`Error updating subscription for user ${userId}:`, error);
      throw new Error('Failed to update subscription');
    }
  }

  async checkActiveSubscription(userId: string): Promise<boolean> {
    try {
      const sub = await this.getSubscription(userId);
      if (!sub) return false;

      if (sub.expiresAt) {
        const expiresDate = new Date(sub.expiresAt);
        return sub.status === 'active' && expiresDate > new Date();
      }

      return sub.status === 'active'; // Assume ativa se não tem data de expiração
    } catch {
      return false;
    }
  }

  async quickCheck(userId: string): Promise<boolean> {
    try {
      const doc = await db.collection('subscriptions')
        .doc(userId)
        .get();

      return doc.exists;
    } catch (error) {
      console.error('Quick check error:', error);
      return false;
    }
  }
}
