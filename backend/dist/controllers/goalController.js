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
exports.deleteGoal = exports.updateGoal = exports.saveGoal = exports.getGoals = void 0;
const Goal_1 = require("../models/Goal");
// Função para buscar metas
const getGoals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const goals = yield Goal_1.Goal.find();
        res.json({ goals });
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao buscar metas.' });
    }
});
exports.getGoals = getGoals;
// Função para salvar uma nova meta
const saveGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { meta, descricao, valor_total, valor_atual, data_conclusao, userId } = req.body;
    if (!meta || !descricao || !valor_total || !valor_atual || !data_conclusao || !userId) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    try {
        const newGoal = new Goal_1.Goal({ meta, descricao, valor_total, valor_atual, data_conclusao, userId });
        yield newGoal.save();
        res.status(201).json({ message: 'Meta salva com sucesso!' });
    }
    catch (error) {
        console.error("Erro ao salvar meta:", error);
        res.status(500).json({ message: 'Erro ao salvar meta.' });
    }
});
exports.saveGoal = saveGoal;
// Função para atualizar uma meta
const updateGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updatedGoal = yield Goal_1.Goal.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedGoal) {
            return res.status(404).json({ message: 'Meta não encontrada.' });
        }
        res.json({ message: 'Meta atualizada com sucesso!', updatedGoal });
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar meta.' });
    }
});
exports.updateGoal = updateGoal;
// Função para excluir uma meta
const deleteGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedGoal = yield Goal_1.Goal.findByIdAndDelete(id);
        if (!deletedGoal) {
            return res.status(404).json({ message: 'Meta não encontrada.' });
        }
        res.json({ message: 'Meta excluída com sucesso!' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao excluir meta.' });
    }
});
exports.deleteGoal = deleteGoal;
