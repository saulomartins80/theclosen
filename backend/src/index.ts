import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import transacoesRoutes from "./routes/transacoesRoutes";
import goalsRoutes from "./routes/goalsRoutes";
import investimentoRoutes from "./routes/investimentoRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rota raiz
app.get("/", (req, res) => {
  res.send("Backend Conectado!");
});

// Routes
app.use("/api", transacoesRoutes);
app.use("/api", goalsRoutes); // add goals routes
app.use("/api", investimentoRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("Connected to MongoDB.");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });
  })
  .catch((error: any) => {
    console.error("Error connecting to MongoDB:", error);
  });