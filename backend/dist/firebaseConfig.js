"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Caminho para o arquivo de credenciais
const serviceAccountPath = path_1.default.resolve(__dirname, "config", "firebaseServiceAccount.json");
const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, "utf8"));
// Inicializa o Firebase apenas se ainda não foi inicializado
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
    });
}
// Exporta a instância do Firebase para ser usada em outros arquivos
exports.default = firebase_admin_1.default;
exports.auth = firebase_admin_1.default.auth();
exports.db = firebase_admin_1.default.firestore();
