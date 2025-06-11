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

// Interceptor de Resposta para lidar com erros 401 e refresh token
apiClient.interceptors.response.use(
  (response) => response, // Passa adiante respostas bem-sucedidas
  async (error) => {
    const originalRequest = error.config;

    // Verifica se o erro é 401 e se não é uma tentativa de repetição
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marca como tentativa de repetição

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Usa uma nova instância do axios para a chamada de refresh para evitar loop no interceptor
          // A URL base é pega de apiClient.defaults.baseURL
          const refreshUrl = `${apiClient.defaults.baseURL}/token/refresh/`;

          const response = await axios.post(refreshUrl, {
            refresh: refreshToken,
          });

          const { access: newAccessToken, refresh: newRefreshToken } = response.data;

          // Atualiza os tokens no localStorage
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) { // Backend pode ou não retornar um novo refresh token
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Atualiza os headers para futuras requisições na instância principal apiClient
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

          // Atualiza o header da requisição original que falhou
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          // Reenvia a requisição original com o novo token
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Se a renovação falhar, desloga o usuário
          console.error("Refresh token failed, logging out:", refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Remove o header de autorização da instância apiClient
          delete apiClient.defaults.headers.common['Authorization'];

          // Força o redirecionamento para a página de login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
         console.log("No refresh token available, redirecting to login.");
         // Limpa qualquer token de acesso restante e redireciona
         localStorage.removeItem('accessToken');
         delete apiClient.defaults.headers.common['Authorization'];
         if (typeof window !== 'undefined') {
           window.location.href = '/login';
         }
         return Promise.reject(new Error("No refresh token available."));
      }
    }

    // Para qualquer outro erro (não 401 ou já tentado), apenas rejeita a promise
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

export const getObraHistoricoCustos = (obraId) => {
  return apiClient.get(`/obras/${obraId}/historico-custos/`);
};

export const getObraCustosPorCategoria = (obraId) => { // New function
    return apiClient.get(`/obras/${obraId}/custos-por-categoria/`);
};

export const getObraCustosPorMaterial = (obraId) => { // New function
    return apiClient.get(`/obras/${obraId}/custos-por-material/`);
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

export const getRelatorioDesempenhoEquipe = (params) => {
  // params: { equipe_id, data_inicio, data_fim }
  return apiClient.get('/relatorios/desempenho-equipe/', { params });
};

export const getRelatorioCustoGeral = (params) => {
  // params: { data_inicio, data_fim }
  return apiClient.get('/relatorios/custo-geral/', { params });
};


// Export the configured apiClient if direct use is needed elsewhere,
// though typically service functions are preferred.
export { apiClient }; // Keep this if other parts of app use apiClient directly

// Or make it the default export if it's the main thing used from this file
// export default apiClient; // If you prefer this, then functions above would need to be imported like: import { getObras } from './api'; apiClient.getObras() - which is not standard.
// The above named exports for functions are more typical for a service file.

// --- Despesa Extra Service Functions ---
export const getDespesasExtras = () => {
  return apiClient.get('/despesas/');
};

export const getDespesaExtraById = (id) => {
  return apiClient.get(`/despesas/${id}/`);
};

export const createDespesaExtra = (despesaData) => {
  return apiClient.post('/despesas/', despesaData);
};

export const updateDespesaExtra = (id, despesaData) => {
  return apiClient.put(`/despesas/${id}/`, despesaData);
};

export const deleteDespesaExtra = (id) => {
  return apiClient.delete(`/despesas/${id}/`);
};

// --- Alocacao Service Functions ---
export const getAlocacoes = (params) => { // Added params argument
  return apiClient.get('/alocacoes/', { params }); // Pass params to axios
};

export const getAlocacaoById = (id) => {
  return apiClient.get(`/alocacoes/${id}/`);
};

export const createAlocacao = (alocacaoData) => {
  return apiClient.post('/alocacoes/', alocacaoData);
};

export const updateAlocacao = (id, alocacaoData) => {
  return apiClient.put(`/alocacoes/${id}/`, alocacaoData);
};

export const deleteAlocacao = (id) => {
  return apiClient.delete(`/alocacoes/${id}/`);
};

// --- Dashboard Service Functions ---
export const getDashboardStats = () => {
  return apiClient.get('/dashboard/stats/');
};

// --- Compra Service Functions ---
export const getCompras = () => {
  return apiClient.get('/compras/');
};

export const createCompra = (compraData) => {
  return apiClient.post('/compras/', compraData);
};

export const updateCompra = (id, compraData) => {
  return apiClient.put(`/compras/${id}/`, compraData);
};

export const deleteCompra = (id) => {
  return apiClient.delete(`/compras/${id}/`);
};

// --- Ocorrencia Service Functions ---
export const getOcorrencias = (params) => { // Added params argument
  return apiClient.get('/ocorrencias/', { params }); // Pass params to axios
};

export const createOcorrencia = (ocorrenciaData) => {
  return apiClient.post('/ocorrencias/', ocorrenciaData);
};

export const updateOcorrencia = (id, ocorrenciaData) => {
  return apiClient.put(`/ocorrencias/${id}/`, ocorrenciaData);
};

export const deleteOcorrencia = (id) => {
  return apiClient.delete(`/ocorrencias/${id}/`);
};

// --- Usuario Service Functions ---
export const getUsuarios = () => {
  return apiClient.get('/usuarios/');
};

export const createUsuario = (userData) => {
  return apiClient.post('/usuarios/', userData);
};

export const updateUsuario = (id, userData) => {
  return apiClient.put(`/usuarios/${id}/`, userData);
};

export const deleteUsuario = (id) => {
  return apiClient.delete(`/usuarios/${id}/`);
};
