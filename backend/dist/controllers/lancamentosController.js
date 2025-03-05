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
exports.excluirLancamento = exports.atualizarLancamento = exports.buscarLancamentoPorId = exports.listarLancamentos = exports.criarLancamento = void 0;
const firebaseConfig_1 = require("../firebaseConfig"); // Firestore do Firebase Admin SDK
// Referência à coleção no Firestore
const lancamentosRef = firebaseConfig_1.db.collection("lancamentos");
// Criar um novo lançamento
const criarLancamento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tipo, descricao, valor, data, conta, categoria } = req.body;
        // Validação dos campos
        if (!tipo || !descricao || !valor || !data || !conta || !categoria) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }
        // Cria o novo lançamento (usando a interface ILancamentoData)
        const novoLancamento = {
            tipo,
            descricao,
            valor,
            data,
            conta,
            categoria,
        };
        const docRef = yield lancamentosRef.add(novoLancamento);
        // Retorna o ID do documento criado e os dados do lançamento
        res.status(201).json(Object.assign({ id: docRef.id }, novoLancamento));
    }
    catch (error) {
        console.error("Erro ao salvar o lançamento:", error);
        res.status(500).json({ error: "Erro ao salvar o lançamento." });
    }
});
exports.criarLancamento = criarLancamento;
// Buscar todos os lançamentos
const listarLancamentos = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield lancamentosRef.get();
        const lancamentos = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.json(lancamentos);
    }
    catch (error) {
        console.error("Erro ao buscar os lançamentos:", error);
        res.status(500).json({ error: "Erro ao buscar os lançamentos." });
    }
});
exports.listarLancamentos = listarLancamentos;
// Buscar um lançamento por ID
const buscarLancamentoPorId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Verifica se o ID foi fornecido
        if (!id) {
            return res.status(400).json({ error: "ID do lançamento é obrigatório." });
        }
        // Busca o documento no Firestore
        const doc = yield lancamentosRef.doc(id).get();
        // Verifica se o documento existe
        if (!doc.exists) {
            return res.status(404).json({ error: "Lançamento não encontrado." });
        }
        // Retorna o lançamento
        res.json(Object.assign({ id: doc.id }, doc.data()));
    }
    catch (error) {
        console.error("Erro ao buscar o lançamento:", error);
        res.status(500).json({ error: "Erro ao buscar o lançamento." });
    }
});
exports.buscarLancamentoPorId = buscarLancamentoPorId;
// Atualizar um lançamento
const atualizarLancamento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { tipo, descricao, valor, data, conta, categoria } = req.body;
        // Verifica se o ID foi fornecido
        if (!id) {
            return res.status(400).json({ error: "ID do lançamento é obrigatório." });
        }
        // Verifica se todos os campos foram fornecidos
        if (!tipo || !descricao || !valor || !data || !conta || !categoria) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }
        // Atualiza o documento no Firestore
        yield lancamentosRef.doc(id).update({ tipo, descricao, valor, data, conta, categoria });
        // Retorna o lançamento atualizado
        const doc = yield lancamentosRef.doc(id).get();
        res.json(Object.assign({ id: doc.id }, doc.data()));
    }
    catch (error) {
        console.error("Erro ao atualizar o lançamento:", error);
        res.status(500).json({ error: "Erro ao atualizar o lançamento." });
    }
});
exports.atualizarLancamento = atualizarLancamento;
// Excluir um lançamento
const excluirLancamento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Verifica se o ID foi fornecido
        if (!id) {
            return res.status(400).json({ error: "ID do lançamento é obrigatório." });
        }
        // Exclui o documento no Firestore
        yield lancamentosRef.doc(id).delete();
        res.status(200).json({ message: "Lançamento excluído com sucesso." });
    }
    catch (error) {
        console.error("Erro ao excluir o lançamento:", error);
        res.status(500).json({ error: "Erro ao excluir o lançamento." });
    }
});
exports.excluirLancamento = excluirLancamento;
