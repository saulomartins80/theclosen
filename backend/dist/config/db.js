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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // String de conexão do MongoDB
        const mongoURI = process.env.MONGO_URI || 'mongodb+srv://saulochagas29:230689Scm@cluster0.7dorq.mongodb.net/meu_banco?retryWrites=true&w=majority&appName=Cluster0';
        // Conectar ao MongoDB
        const conn = yield mongoose_1.default.connect(mongoURI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1); // Encerra o processo com falha
    }
});
exports.default = connectDB;
