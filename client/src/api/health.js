import api from "./axios";

export async function getHealth({ signal } = {}) {
  const { data } = await api.get("/health", { signal });
  return data;
}