import { Meta, ApiResponse } from '.';

export const getMetas = (): Promise<ApiResponse<Meta[]>> => {
  return Promise.resolve({ success: true, data: [] });
};
