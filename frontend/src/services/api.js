import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const requestUrlPath = originalRequest.url.replace(
      apiClient.defaults.baseURL,
      ''
    );

    if (
      requestUrlPath.endsWith('/token/') ||
      requestUrlPath.endsWith('/token/refresh/')
    ) {
      if (requestUrlPath.endsWith('/token/refresh/')) {
        console.error(
          'Refresh token attempt failed (original request was /token/refresh/), logging out:',
          error
        );
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete apiClient.defaults.headers.common['Authorization'];
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login'
        ) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshUrl = `${apiClient.defaults.baseURL}/token/refresh/`;
          const response = await axios.post(refreshUrl, {
            refresh: refreshToken,
          });
          const { access: newAccessToken, refresh: newRefreshToken } =
            response.data;
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          apiClient.defaults.headers.common['Authorization'] =
            `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed, logging out:', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete apiClient.defaults.headers.common['Authorization'];
          if (
            typeof window !== 'undefined' &&
            window.location.pathname !== '/login'
          ) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        console.log(
          'No refresh token available, redirecting to login (from interceptor).'
        );
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete apiClient.defaults.headers.common['Authorization'];
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login'
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(
          new Error('No refresh token available. User needs to login.')
        );
      }
    }
    return Promise.reject(error);
  }
);

// --- Obra Service Functions ---
export const getObras = params => apiClient.get('/obras/', { params });
export const searchObras = query =>
  apiClient.get('/obras/search/', { params: { q: query } });
export const getObraById = id => apiClient.get(`/obras/${id}/`);
export const createObra = obraData => apiClient.post('/obras/', obraData);
export const updateObra = (id, obraData) =>
  apiClient.put(`/obras/${id}/`, obraData);
export const deleteObra = id => apiClient.delete(`/obras/${id}/`);
export const getObraHistoricoCustos = obraId =>
  apiClient.get(`/obras/${obraId}/historico-custos/`);
export const getObraCustosPorCategoria = obraId =>
  apiClient.get(`/obras/${obraId}/custos-por-categoria/`);
export const getObraCustosPorMaterial = obraId =>
  apiClient.get(`/obras/${obraId}/custos-por-material/`);
export const getObraGastosPorCategoriaMaterial = obraId =>
    apiClient.get(`/obras/${obraId}/gastos-por-categoria-material/`);
export const getItensDisponiveisPorObra = obraId =>
  apiClient.get(`/obras/${obraId}/itens-disponiveis/`);

// --- Funcionario Service Functions ---
export const getFuncionarios = params =>
  apiClient.get('/funcionarios/', { params });
export const getFuncionarioDetailsById = id =>
  apiClient.get(`/funcionarios/${id}/details/`);
export const getFuncionarioById = id => apiClient.get(`/funcionarios/${id}/`);
export const createFuncionario = funcionarioData =>
  apiClient.post('/funcionarios/', funcionarioData);
export const updateFuncionario = (id, funcionarioData) =>
  apiClient.patch(`/funcionarios/${id}/`, funcionarioData);
export const deleteFuncionario = id => apiClient.delete(`/funcionarios/${id}/`);

// --- Equipe Service Functions ---
export const getEquipes = params => apiClient.get('/equipes/', { params });
export const getEquipeDetailsById = id =>
  apiClient.get(`/equipes/${id}/details/`);
export const getEquipeById = id => apiClient.get(`/equipes/${id}/`);
export const createEquipe = equipeData =>
  apiClient.post('/equipes/', equipeData);
export const updateEquipe = (id, equipeData) =>
  apiClient.put(`/equipes/${id}/`, equipeData);
export const deleteEquipe = id => apiClient.delete(`/equipes/${id}/`);

// --- Material Service Functions ---
export const getMateriais = params => apiClient.get('/materiais/', { params });
export const getMaterialById = id => apiClient.get(`/materiais/${id}/`);
export const getMaterialDetailsById = id =>
  apiClient.get(`/materiais/${id}/details/`);
export const createMaterial = materialData =>
  apiClient.post('/materiais/', materialData);
export const updateMaterial = (id, materialData) =>
  apiClient.put(`/materiais/${id}/`, materialData);
export const deleteMaterial = id => apiClient.delete(`/materiais/${id}/`);
export const getMateriaisAlertaEstoqueBaixo = () =>
  apiClient.get('/materiais/alertas-estoque-baixo/');

// --- Report Service Functions ---
export const getRelatorioFinanceiroObra = params =>
  apiClient.get('/relatorios/financeiro-obra/', { params });
export const getRelatorioGeralCompras = params =>
  apiClient.get('/relatorios/geral-compras/', { params });
export const getRelatorioDesempenhoEquipe = params =>
  apiClient.get('/relatorios/desempenho-equipe/', { params });
export const getRelatorioCustoGeral = params =>
  apiClient.get('/relatorios/custo-geral/', { params });
export const getRelatorioPagamentoMateriaisPreCheck = params =>
  apiClient.get('/relatorios/pagamento-materiais/pre-check/', { params });
export const generateRelatorioPagamentoMateriais = params =>
  apiClient.get('/relatorios/pagamento-materiais/generate/', { params });

// --- Despesa Extra Service Functions ---
export const getDespesasExtras = params =>
  apiClient.get('/despesas/', { params });
export const getDespesaExtraById = id => apiClient.get(`/despesas/${id}/`);
export const createDespesaExtra = formData => {
  return apiClient.post('/despesas/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateDespesaExtra = (id, formData) => {
  return apiClient.put(`/despesas/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAnexoDespesa = id => apiClient.delete(`/anexos-despesa/${id}/`);
export const deleteDespesaExtra = id => apiClient.delete(`/despesas/${id}/`);

// --- Locacao Service Functions ---
export const getLocacoes = params => apiClient.get('/locacoes/', { params });
export const getLocacaoById = id => apiClient.get(`/locacoes/${id}/`);
export const createLocacao = (alocacaoData, anexos) => {
  const formData = new FormData();
  for (const key in alocacaoData) {
    if (alocacaoData[key] !== null && alocacaoData[key] !== undefined) {
      formData.append(key, alocacaoData[key]);
    }
  }
  if (anexos) {
    anexos.forEach(anexo => {
      formData.append('anexos', anexo);
    });
  }
  return apiClient.post('/locacoes/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateLocacao = (id, alocacaoData, anexos) => {
  const formData = new FormData();
  for (const key in alocacaoData) {
    if (alocacaoData[key] !== null && alocacaoData[key] !== undefined) {
      formData.append(key, alocacaoData[key]);
    }
  }
  if (anexos) {
    anexos.forEach(anexo => {
      formData.append('anexos', anexo);
    });
  }
  return apiClient.patch(`/locacoes/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAnexoLocacao = id => apiClient.delete(`/anexos-locacao/${id}/`);
export const deleteLocacao = id => apiClient.delete(`/locacoes/${id}/`);
export const transferFuncionarioLocacao = async transferData => {
  const response = await apiClient.post(
    '/locacoes/transferir-funcionario/',
    transferData
  );
  return response.data;
};
export const getLocacaoCustoDiarioChart = (obraId = null) => {
  let url = '/locacoes/custo_diario_chart/';
  if (obraId) {
    url += `?obra_id=${obraId}`;
  }
  return apiClient.get(url);
};

// Funções para o Weekly Planner
export const getLocacoesDaSemana = (startDate, obraId) => {
  const params = { inicio: startDate };
  if (obraId) {
    params.obra_id = obraId;
  }
  return apiClient.get('/locacoes/semana/', { params });
};
export const getRecursosMaisUtilizadosSemana = (startDate, obraId) => {
  const params = { inicio: startDate };
  if (obraId) {
    params.obra_id = obraId;
  }
  return apiClient.get('/analytics/recursos-semana/', {
    params,
  });
};

export const getRelatorioFolhaPagamentoPreCheck = (startDate, endDate) =>
  apiClient.get('/relatorios/folha-pagamento/pre_check_dias_sem_locacoes/', {
    params: { start_date: startDate, end_date: endDate },
  });
// Fetches data for CSV export (original structure: Obra -> Dia -> Locacao)
export const generateRelatorioFolhaPagamentoCSVData = (
  startDate,
  endDate,
  obraId = null
) => {
  const params = { start_date: startDate, end_date: endDate };
  if (obraId) {
    params.obra_id = obraId;
  }
  return apiClient.get('/relatorios/folha-pagamento/generate_report/', {
    params,
  });
};

// Fetches data specifically structured for the PDF report (Recurso -> Obra -> Locacao)
export const generateRelatorioFolhaPagamentoPDFData = (
  startDate,
  endDate,
  obraId = null
) => {
  const params = { start_date: startDate, end_date: endDate };
  if (obraId) {
    params.obra_id = obraId;
  }
  return apiClient.get(
    '/relatorios/folha-pagamento/generate_report_data_for_pdf/',
    { params }
  );
};

// --- Dashboard Service Functions ---
export const getDashboardStats = () => apiClient.get('/dashboard/stats/');

// --- Compra Service Functions ---
export const getCompras = params => apiClient.get('/compras/', { params });
export const getCompraById = id => apiClient.get(`/compras/${id}/`);
export const createCompra = compraData =>
  apiClient.post('/compras/', compraData);
export const updateCompra = (id, compraData) =>
  apiClient.put(`/compras/${id}/`, compraData);
export const deleteCompra = id => apiClient.delete(`/compras/${id}/`);
export const updateCompraStatus = (id, data) => apiClient.patch(`/compras/${id}/`, data);
export const approveOrcamento = id => apiClient.post(`/compras/${id}/approve/`);
export const getObraComprasDetalhes = obraId => apiClient.get(`/obras/${obraId}/compras-detalhes/`);

// --- UsoMaterial Service Functions ---
export const createUsoMaterial = data => apiClient.post('/usomateriais/', data);
export const getUsosMaterial = obraId =>
  apiClient.get('/usomateriais/', { params: { obra_id: obraId } });

// --- Ocorrencia Service Functions ---
export const getOcorrencias = params =>
  apiClient.get('/ocorrencias/', { params });
export const createOcorrencia = ocorrenciaData =>
  apiClient.post('/ocorrencias/', ocorrenciaData);
export const updateOcorrencia = (id, ocorrenciaData) =>
  apiClient.put(`/ocorrencias/${id}/`, ocorrenciaData);
export const deleteOcorrencia = id => apiClient.delete(`/ocorrencias/${id}/`);

// --- Usuario Service Functions ---
export const getUsuarios = params => apiClient.get('/usuarios/', { params });
export const createUsuario = userData => apiClient.post('/register/', userData);
export const updateUsuario = (id, userData) =>
  apiClient.put(`/usuarios/${id}/`, userData);
export const deleteUsuario = id => apiClient.delete(`/usuarios/${id}/`);

// --- Backup Service Functions ---
export const getBackups = () => apiClient.get('/backups/');
export const createBackup = (description = '') =>
  apiClient.post('/backups/', { description });
export const restoreBackup = backupId =>
  apiClient.post(`/backups/${backupId}/restore/`);
export const deleteBackup = backupId =>
  apiClient.delete(`/backups/${backupId}/`);
export const getBackupSettings = () => apiClient.get('/backup-settings/');
export const updateBackupSettings = settings =>
  apiClient.put('/backup-settings/1/', settings);

// --- FotoObra Service Functions ---
export const getFotosObra = obraId =>
  apiClient.get('/fotosobras/', { params: { obra_id: obraId } });
export const uploadFotoObra = formData =>
  apiClient.post('/fotosobras/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteFotoObra = fotoId =>
  apiClient.delete(`/fotosobras/${fotoId}/`);

// --- PDF Report Service Functions ---
export const getRelatorioObraGeral = obraId => {
  return apiClient.get(`/relatorios/obra/${obraId}/pdf/?is_simple=true`, {
    responseType: 'blob',
  });
};

export const getRelatorioObraCompleto = obraId => {
  return apiClient.get(`/relatorios/obra/${obraId}/pdf/`, {
    responseType: 'blob',
  });
};

// New function to download the "Relatório de Pagamento de Locações" PDF
export const gerarRelatorioPagamentoLocacoesPDF = (
  startDate,
  endDate,
  obraId = null
) => {
  const params = { start_date: startDate, end_date: endDate };
  if (obraId) {
    params.obra_id = obraId;
  }
  return apiClient.get('/relatorios/pagamento-locacoes/pdf/', {
    params,
    responseType: 'blob',
  });
};

export { apiClient };
