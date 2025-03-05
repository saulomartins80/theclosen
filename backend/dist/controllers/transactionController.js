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
exports.getDespesas = exports.getReceitas = exports.getSaldo = exports.getTransactions = exports.errorHandler = void 0;
const Transaction_1 = __importDefault(require("../models/Transaction"));
// Middleware para tratamento de erros
const errorHandler = (fn) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fn(req, res, next);
    }
    catch (error) {
        console.error("Erro:", error);
        res.status(500).json({ message: 'Erro interno no servidor', error });
    }
});
exports.errorHandler = errorHandler;
// Busca todas as transações com paginação
exports.getTransactions = (0, exports.errorHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const transactions = yield Transaction_1.default.find()
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();
    const total = yield Transaction_1.default.countDocuments();
    res.json({
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    });
}));
// Busca o saldo (receitas - despesas)
exports.getSaldo = (0, exports.errorHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const [receitas, despesas] = yield Promise.all([
        Transaction_1.default.aggregate([
            { $match: { tipo: 'receita' } },
            { $group: { _id: null, total: { $sum: '$valor' } } },
        ]),
        Transaction_1.default.aggregate([
            { $match: { tipo: 'despesa' } },
            { $group: { _id: null, total: { $sum: '$valor' } } },
        ]),
    ]);
    const saldo = (((_a = receitas[0]) === null || _a === void 0 ? void 0 : _a.total) || 0) - (((_b = despesas[0]) === null || _b === void 0 ? void 0 : _b.total) || 0);
    res.json({ saldo });
}));
// Busca o total de receitas
exports.getReceitas = (0, exports.errorHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const receitas = yield Transaction_1.default.aggregate([
        { $match: { tipo: 'receita' } },
        { $group: { _id: null, total: { $sum: '$valor' } } },
    ]);
    res.json({ receitas: ((_a = receitas[0]) === null || _a === void 0 ? void 0 : _a.total) || 0 });
}));
// Busca o total de despesas
exports.getDespesas = (0, exports.errorHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const despesas = yield Transaction_1.default.aggregate([
        { $match: { tipo: 'despesa' } },
        { $group: { _id: null, total: { $sum: '$valor' } } },
    ]);
    res.json({ despesas: ((_a = despesas[0]) === null || _a === void 0 ? void 0 : _a.total) || 0 });
}));
