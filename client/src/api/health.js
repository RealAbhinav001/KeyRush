import api from "./axios";

export const getHealth = async ({ signal } = {}) => {
  const { data } = await api.get("/health", { signal });
  return data;
};
