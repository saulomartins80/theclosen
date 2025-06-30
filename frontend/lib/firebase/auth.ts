import { 
  auth,
  loginWithEmailAndPassword,
  loginWithGoogle,
  signOut,
  getIdToken
} from './client';

const getAuthErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'User not found.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/popup-closed-by-user':
        return 'Login canceled by user.';
      case 'auth/account-exists-with-different-credential':
        return 'Account exists with different credential.';
      case 'auth/auth-domain-config-required':
        return 'Auth domain configuration required.';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed.';
      case 'auth/operation-not-supported-in-this-environment':
        return 'Operation not supported in this environment.';
      case 'auth/timeout':
        return 'Timeout occurred.';
      default:
        return (error as { message?: string }).message || 'An unknown error occurred.';
    }
  }
  return 'An unknown error occurred.';
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await loginWithEmailAndPassword(email, password);
    const token = await getIdToken(userCredential.user);
    
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    return await response.json();
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const loginWithGoogleAuth = async () => {
  try {
    const userCredential = await loginWithGoogle();
    const token = await getIdToken(userCredential.user);
    
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    return await response.json();
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    // Clear session on backend if needed
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};