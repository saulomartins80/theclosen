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
exports.deleteTransacao = exports.updateTransacao = exports.createTransacao = exports.getTransacoes = exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
exports.api = axios_1.default.create({
    baseURL: API_URL,
});
// Busca todas as transações
const getTransacoes = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield exports.api.get("/api/transacoes");
        return response.data;
    }
    catch (error) {
        console.error("Erro ao buscar transações:", error);
        throw error;
    }
});
exports.getTransacoes = getTransacoes;
// Cria uma nova transação
const createTransacao = (transacao) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield exports.api.post("/api/transacoes", transacao);
        return response.data;
    }
    catch (error) {
        console.error("Erro ao criar transação:", error);
        throw error;
    }
});
exports.createTransacao = createTransacao;
// Atualiza uma transação existente
const updateTransacao = (id, transacao) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield exports.api.put(`/api/transacoes/${id}`, transacao);
        return response.data;
    }
    catch (error) {
        console.error("Erro ao atualizar transação:", error);
        throw error;
    }
});
exports.updateTransacao = updateTransacao;
// Exclui uma transação
const deleteTransacao = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield exports.api.delete(`/api/transacoes/${id}`);
        return response.data;
    }
    catch (error) {
        console.error("Erro ao excluir transação:", error);
        throw error;
    }
});
exports.deleteTransacao = deleteTransacao;
