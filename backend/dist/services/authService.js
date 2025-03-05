"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = void 0;
const firebaseConfig_1 = require("../firebaseConfig");
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userCredential = yield firebaseConfig_1.auth.createUser({ email, password }); // Use createUser para criar usuários
        return userCredential.uid; // Retorna o UID do usuário criado
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error('Erro ao fazer login: ' + error.message);
        }
        else {
            throw new Error('Erro desconhecido');
        }
    }
});
exports.loginUser = loginUser;
