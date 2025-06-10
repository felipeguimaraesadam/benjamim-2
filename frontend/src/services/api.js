import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Obra Service Functions ---
export const getObras = () => {
  return apiClient.get('/obras/');
};

export const getObraById = (id) => {
  return apiClient.get(`/obras/${id}/`);
};

export const createObra = (obraData) => {
  return apiClient.post('/obras/', obraData);
};

export const updateObra = (id, obraData) => {
  return apiClient.put(`/obras/${id}/`, obraData);
};

export const deleteObra = (id) => {
  return apiClient.delete(`/obras/${id}/`);
};

// --- Funcionario Service Functions ---
export const getFuncionarios = () => {
  return apiClient.get('/funcionarios/');
};

export const getFuncionarioById = (id) => {
  return apiClient.get(`/funcionarios/${id}/`);
};

export const createFuncionario = (funcionarioData) => {
  return apiClient.post('/funcionarios/', funcionarioData);
};

export const updateFuncionario = (id, funcionarioData) => {
  return apiClient.put(`/funcionarios/${id}/`, funcionarioData);
};

export const deleteFuncionario = (id) => {
  return apiClient.delete(`/funcionarios/${id}/`);
};

// --- Equipe Service Functions ---
export const getEquipes = () => {
  return apiClient.get('/equipes/');
};

export const getEquipeById = (id) => {
  return apiClient.get(`/equipes/${id}/`);
};

export const createEquipe = (equipeData) => {
  return apiClient.post('/equipes/', equipeData);
};

export const updateEquipe = (id, equipeData) => {
  return apiClient.put(`/equipes/${id}/`, equipeData);
};

export const deleteEquipe = (id) => {
  return apiClient.delete(`/equipes/${id}/`);
};

// --- Material Service Functions ---
export const getMateriais = () => {
  return apiClient.get('/materiais/');
};

export const getMaterialById = (id) => {
  return apiClient.get(`/materiais/${id}/`);
};

export const createMaterial = (materialData) => {
  return apiClient.post('/materiais/', materialData);
};

export const updateMaterial = (id, materialData) => {
  return apiClient.put(`/materiais/${id}/`, materialData);
};

export const deleteMaterial = (id) => {
  return apiClient.delete(`/materiais/${id}/`);
};

// --- Report Service Functions ---
export const getRelatorioFinanceiroObra = (params) => {
  // params: { obra_id, data_inicio, data_fim }
  return apiClient.get('/relatorios/financeiro-obra/', { params });
};

export const getRelatorioGeralCompras = (params) => {
  // params: { data_inicio, data_fim, obra_id?, material_id? }
  return apiClient.get('/relatorios/geral-compras/', { params });
};


// Export the configured apiClient if direct use is needed elsewhere,
// though typically service functions are preferred.
export { apiClient }; // Keep this if other parts of app use apiClient directly

// Or make it the default export if it's the main thing used from this file
// export default apiClient; // If you prefer this, then functions above would need to be imported like: import { getObras } from './api'; apiClient.getObras() - which is not standard.
// The above named exports for functions are more typical for a service file.
