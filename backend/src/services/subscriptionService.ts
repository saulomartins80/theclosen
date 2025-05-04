// src/services/subscriptionService.ts
// src/services/subscriptionService.ts
import { admin } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { injectable } from 'inversify';
import { Subscription } from '../types/Subscription';

const db = admin.firestore();

@injectable()
export class SubscriptionService {
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const doc = await db.collection('subscriptions').doc(userId).get();

      if (!doc.exists) return null;

      const data = doc.data();
      
      return {
        id: doc.id,
        plan: data?.plan,
        status: data?.status,
        expiresAt: data?.expiresAt?.toDate().toISOString(),
        createdAt: data?.createdAt?.toDate().toISOString(),
        updatedAt: data?.updatedAt?.toDate().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching subscription for user ${userId}:`, error);
      throw new Error('Failed to fetch subscription');
    }
  }

  async updateSubscription(
    userId: string,
    subscriptionData: Partial<Subscription>
  ): Promise<void> {
    try {
      await db.collection('subscriptions').doc(userId).set({
        ...subscriptionData,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: subscriptionData.createdAt || FieldValue.serverTimestamp()
      }, { merge: true });
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
      
      return sub.status === 'active';
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