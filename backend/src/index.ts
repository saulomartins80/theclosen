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
const goalsRoutes_1 = __importDefault(require("./routes/goalsRoutes"));
const investimentoRoutes_1 = __importDefault(require("./routes/investimentoRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api", transacoesRoutes_1.default);
app.use("/api", goalsRoutes_1.default); // add goals routes
app.use('/api', investimentoRoutes_1.default);
// Connect to MongoDB
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB.");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}.`);
        });
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });