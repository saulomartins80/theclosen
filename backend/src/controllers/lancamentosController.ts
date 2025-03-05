import { Request, Response } from "express";
import { db } from "../firebaseConfig"; // Firestore do Firebase Admin SDK
import { ILancamentoData } from "../models/Lancamento"; // Importação corrigida

// Referência à coleção no Firestore
const lancamentosRef = db.collection("lancamentos");

// Criar um novo lançamento
export const criarLancamento = async (req: Request, res: Response) => {
  try {
    const { tipo, descricao, valor, data, conta, categoria } = req.body;

    // Validação dos campos
    if (!tipo || !descricao || !valor || !data || !conta || !categoria) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    // Cria o novo lançamento (usando a interface ILancamentoData)
    const novoLancamento: ILancamentoData = {
      tipo,
      descricao,
      valor,
      data,
      conta,
      categoria,
    };
    const docRef = await lancamentosRef.add(novoLancamento);

    // Retorna o ID do documento criado e os dados do lançamento
    res.status(201).json({ id: docRef.id, ...novoLancamento });
  } catch (error) {
    console.error("Erro ao salvar o lançamento:", error);
    res.status(500).json({ error: "Erro ao salvar o lançamento." });
  }
};

// Buscar todos os lançamentos
export const listarLancamentos = async (_req: Request, res: Response) => {
  try {
    const snapshot = await lancamentosRef.get();
    const lancamentos = snapshot.docs.map((doc) => ({
      id: doc.id, // ID do documento no Firestore
      ...doc.data(), // Dados do lançamento
    }));

    res.json(lancamentos);
  } catch (error) {
    console.error("Erro ao buscar os lançamentos:", error);
    res.status(500).json({ error: "Erro ao buscar os lançamentos." });
  }
};

// Buscar um lançamento por ID
export const buscarLancamentoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica se o ID foi fornecido
    if (!id) {
      return res.status(400).json({ error: "ID do lançamento é obrigatório." });
    }

    // Busca o documento no Firestore
    const doc = await lancamentosRef.doc(id).get();

    // Verifica se o documento existe
    if (!doc.exists) {
      return res.status(404).json({ error: "Lançamento não encontrado." });
    }

    // Retorna o lançamento
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar o lançamento:", error);
    res.status(500).json({ error: "Erro ao buscar o lançamento." });
  }
};

// Atualizar um lançamento
export const atualizarLancamento = async (req: Request, res: Response) => {
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
    await lancamentosRef.doc(id).update({ tipo, descricao, valor, data, conta, categoria });

    // Retorna o lançamento atualizado
    const doc = await lancamentosRef.doc(id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao atualizar o lançamento:", error);
    res.status(500).json({ error: "Erro ao atualizar o lançamento." });
  }
};

// Excluir um lançamento
export const excluirLancamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica se o ID foi fornecido
    if (!id) {
      return res.status(400).json({ error: "ID do lançamento é obrigatório." });
    }

    // Exclui o documento no Firestore
    await lancamentosRef.doc(id).delete();

    res.status(200).json({ message: "Lançamento excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir o lançamento:", error);
    res.status(500).json({ error: "Erro ao excluir o lançamento." });
  }
};
