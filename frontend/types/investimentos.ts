import { Investimento, ApiResponse } from '.';

export const getInvestimentos = (): Promise<ApiResponse<Investimento[]>> => {
  return Promise.resolve({ success: true, data: [] });
};
