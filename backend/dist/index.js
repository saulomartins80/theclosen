"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const transacoesRoutes_1 = __importDefault(require("./routes/transacoesRoutes"));
const goalsRoutes_1 = __importDefault(require("./routes/goalsRoutes")); // Importe as rotas de metas
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rotas
app.use("/api", transacoesRoutes_1.default);
app.use("/api", goalsRoutes_1.default); // Adicione as rotas de metas
// Conectar ao MongoDB
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => {
    console.log("Conectado ao MongoDB.");
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}.`);
    });
})
    .catch((error) => {
    console.error("Erro ao conectar ao MongoDB:", error);
});
