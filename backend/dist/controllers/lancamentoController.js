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
exports.deleteLancamento = exports.updateLancamento = exports.createLancamento = exports.getLancamentos = void 0;
const Lancamento_1 = __importDefault(require("../models/Lancamento"));
// Busca todos os lançamentos
const getLancamentos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lancamentos = yield Lancamento_1.default.find();
        res.json(lancamentos);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao buscar lançamentos' });
    }
});
exports.getLancamentos = getLancamentos;
// Cria um novo lançamento
const createLancamento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newLancamento = new Lancamento_1.default(req.body);
        yield newLancamento.save();
        res.status(201).json(newLancamento);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao criar lançamento' });
    }
});
exports.createLancamento = createLancamento;
// Atualiza um lançamento existente
const updateLancamento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { descricao, valor, tipo, categoria } = req.body;
        const lancamentoAtualizado = yield Lancamento_1.default.findByIdAndUpdate(id, { descricao, valor, tipo, categoria }, { new: true });
        res.json({ lancamento: lancamentoAtualizado });
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar lançamento', error });
    }
});
exports.updateLancamento = updateLancamento;
// Exclui um lançamento
const deleteLancamento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedLancamento = yield Lancamento_1.default.findByIdAndDelete(id);
        if (!deletedLancamento) {
            return res.status(404).json({ message: 'Lançamento não encontrado' });
        }
        res.json({ message: 'Lançamento excluído com sucesso' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao excluir lançamento' });
    }
});
exports.deleteLancamento = deleteLancamento;
