import { auth, googleProvider } from '../lib/firebase/client';
import api from './api';
import { getAuth, signInWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';

export const authService = {
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      const response = await api.post('/api/auth/google', {
        idToken: token,
        email: user.email,
        name: user.displayName,
        photoUrl: user.photoURL,
      });

      // Configura os cookies de sessão
      document.cookie = `token=${response.data.token}; path=/; secure; samesite=lax`;

      return response.data.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  async login(email: string, password: string) {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    const response = await api.post('/auth/login', {
      email,
      password,
      firebaseToken: token,
    });

    return response.data;
  },

  async logout() {
    const auth = getAuth();
    await signOut(auth);
    await api.post('/auth/logout');
  },

  async getSession() {
    try {
      const response = await api.get('/auth/session');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async verifyToken(token: string) {
    const response = await api.post('/auth/verify-token', { token });
    return response.data;
  },
};