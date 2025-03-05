import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // String de conexão do MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://saulochagas29:230689Scm@cluster0.7dorq.mongodb.net/meu_banco?retryWrites=true&w=majority&appName=Cluster0';
    
    // Conectar ao MongoDB
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1); // Encerra o processo com falha
  }
};

export default connectDB;