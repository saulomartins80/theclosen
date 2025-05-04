import { Transacao, NovaTransacaoPayload, AtualizarTransacaoPayload, ApiResponse } from '.';

export const createTransacao = (transacao: NovaTransacaoPayload): Promise<ApiResponse<Transacao>> => {
  return Promise.resolve({ success: true, data: {} as Transacao });
};

export const updateTransacao = (id: string, transacao: AtualizarTransacaoPayload): Promise<ApiResponse<Transacao>> => {
  return Promise.resolve({ success: true, data: {} as Transacao });
};

export const getTransacoes = (): Promise<ApiResponse<Transacao[]>> => {
  return Promise.resolve({ success: true, data: [] });
};

export const deleteTransacao = (id: string): Promise<ApiResponse<void>> => {
  return Promise.resolve({ success: true });
};
