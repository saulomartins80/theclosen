// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '@config/firebaseAdmin';
import { AppError } from '@core/errors/AppError';
import jwt from 'jsonwebtoken';
// Import necessary modules for MongoDB user lookup
import { container } from '@core/container'; // Assuming you use InversifyJS
import { TYPES } from '@core/types';
import { UserService } from '@modules/users/services/UserService'; // Adjust the path if needed
// Import the Mongoose Document type if possible for better type safety
// import { Document } from 'mongoose'; // You might need to import this from mongoose
// import { IUser } from '@models/User'; // Or import your specific User document interface

declare module 'express' {
  interface Request {
    user?: {
      uid: string; // This is the Firebase UID
      id?: string; // This will be the MongoDB _id
      email?: string;
      name?: string;
      [key: string]: any; // Para propriedades adicionais
    };
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'c601'; // Use variável de ambiente

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError(401, 'Token de autenticação não fornecido'));
    }

    const token = authHeader.split(' ')[1];
    // A simple heuristic, might need refinement
    const isFirebaseToken = token.length > 500;

    // Get the UserService instance (assuming InversifyJS setup allows this)
    // WARNING: Accessing the container directly in middleware like this can break
    // dependency injection principles. A better approach is to refactor
    // authenticate to be a factory function that receives dependencies.
    // However, for a quick fix within the existing structure, this might work.
    const userService = container.get<UserService>(TYPES.UserService);


    if (isFirebaseToken) {
      try {
        const firebaseDecoded = await adminAuth.verifyIdToken(token);
        const firebaseUid = firebaseDecoded.uid;

        // --- NEW: Look up the user in MongoDB using the Firebase UID ---
        // Cast mongoUser to 'any' to allow accessing _id.toString() if its type is unknown
        const mongoUser = await userService.getUserByFirebaseUid(firebaseUid) as any; // Cast here

        if (!mongoUser) {
            // If user exists in Firebase but not in MongoDB, handle this.
            // This might mean the user wasn't correctly synced during registration/login.
            // You might want to create the user in MongoDB here or return an error.
            // For now, let's return an error indicating the user is not found in the app DB.
            console.warn(`User with Firebase UID ${firebaseUid} not found in MongoDB.`);
            return next(new AppError(404, 'Usuário não encontrado em nossa base de dados. Por favor, tente logar novamente ou contate o suporte.'));
        }

        // Ensure mongoUser._id exists before calling toString()
        if (!mongoUser._id) {
             console.error(`MongoDB user found for Firebase UID ${firebaseUid} but no _id.`);
             return next(new AppError(500, 'Erro interno: ID do usuário do banco de dados não encontrado.'));
        }

        req.user = {
          uid: firebaseUid, // Keep Firebase UID
          id: mongoUser._id.toString(), // Use the _id from the MongoDB user
          email: mongoUser.email, // Use email from MongoDB as source of truth
          name: mongoUser.name,   // Use name from MongoDB as source of truth
          // Include other relevant fields from your MongoDB user document if needed
          // For example, roles, subscription status, etc.
          // ...mongoUser // You could potentially spread the whole mongoUser object depending on needs
        };
        return next();
      } catch (firebaseError: any) {
        console.error('Erro na verificação do token Firebase:', firebaseError.message);
        if (firebaseError.code === 'auth/id-token-expired') {
          return next(new AppError(401, 'Token Firebase expirado'));
        } else if (firebaseError.code === 'auth/user-not-found') {
             // This is unlikely if verifyIdToken passed, but good to handle
             return next(new AppError(404, 'Usuário Firebase não encontrado.'));
        }
         // Catch other potential Firebase errors
        return next(new AppError(401, firebaseError.message || 'Erro na validação do token Firebase'));
      }
    }

    // --- Keep existing JWT handling if you use both ---
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;

      // Ensure the decoded JWT has the necessary 'id' (MongoDB _id)
      if (!decoded.id) {
           console.error('Token JWT não contém ID do MongoDB:', decoded);
           return next(new AppError(401, 'Token JWT inválido: ID do usuário ausente.'));
      }
       // Optionally, verify the Firebase UID in the JWT if you include it as 'uid'
       // if (!decoded.uid) { ... }

      // --- NEW: For JWTs, ensure req.user.id is set ---
      // Assuming the JWT payload is the source of truth after login for JWT flow
      // If you need the full user object in req.user for JWTs too, you'd do a DB lookup here
      // using decoded.id similar to the Firebase block.

      req.user = {
        uid: decoded.uid || decoded.id, // Assume JWT contains Firebase UID as 'uid' or MongoDB 'id'
        id: decoded.id, // Use the ID from the JWT (should be MongoDB _id string)
        email: decoded.email, // Get email from JWT if present
        name: decoded.name, // Get name from JWT if present
        ...decoded // Include all other claims from the JWT
      };

      return next();
    } catch (jwtError: any) {
      console.error('Erro na verificação do token JWT:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError(401, 'Token JWT expirado'));
      }
      return next(new AppError(401, jwtError.message || 'Token JWT inválido'));
    }
    // --- End JWT handling ---


  } catch (error: any) {
    console.error('Erro inesperado no middleware de autenticação:', error);
    next(new AppError(500, 'Erro interno no servidor durante autenticação'));
  }
};
