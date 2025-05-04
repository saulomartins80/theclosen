// src/modules/users/interfaces/user.interface.ts
export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  photoUrl?: string; 
  firebaseUid?: string;
  settings?: any;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  settings: any;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithTokens {
  user: IUserProfile;
  token: string;
  firebaseToken: string;
}