"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Goal = void 0;
const mongoose_1 = require("mongoose");
const goalSchema = new mongoose_1.Schema({
    meta: { type: String, required: true },
    descricao: { type: String, required: true },
    valor_total: { type: Number, required: true },
    valor_atual: { type: Number, required: true },
    data_conclusao: { type: Date, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.Goal = (0, mongoose_1.model)('Goal', goalSchema);
