import axios from 'axios';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  return !!(token || refreshToken);
};

// Utility function to get current user info from token
export const getCurrentUser = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.user_id,
      username: payload.username,
      exp: payload.exp
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    const requestId = Math.random().toString(36).substr(2, 9);
    config.metadata = { requestId, startTime: Date.now() };
    
    console.log(`🚀 [API DEBUG] Requisição ${requestId}:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      hasAuth: !!token,
      headers: {
        ...config.headers,
        Authorization: token ? '[PRESENTE]' : '[AUSENTE]'
      },
      data: config.data ? (typeof config.data === 'string' ? '[FormData]' : Object.keys(config.data)) : null,
      timestamp: new Date().toISOString()
    });
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('❌ [API DEBUG] Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => {
    const requestId = response.config?.metadata?.requestId;
    const startTime = response.config?.metadata?.startTime;
    const responseTime = startTime ? Date.now() - startTime : 0;
    
    console.log(`✅ [API DEBUG] Resposta ${requestId}:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.config?.url,
      method: response.config?.method?.toUpperCase(),
      responseTime: responseTime + 'ms',
      dataSize: response.data ? JSON.stringify(response.data).length : 0,
      headers: {
        'content-type': response.headers['content-type'],
        'content-length': response.headers['content-length']
      },
      timestamp: new Date().toISOString()
    });
    
    return response;
  },
  async error => {
    const requestId = error.config?.metadata?.requestId;
    const startTime = error.config?.metadata?.startTime;
    const responseTime = startTime ? Date.now() - startTime : 0;
    
    console.error(`❌ [API DEBUG] Erro ${requestId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseTime: responseTime + 'ms',
      errorMessage: error.message,
      responseData: error.response?.data,
      networkError: !error.response,
      timestamp: new Date().toISOString()
    });
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

// New endpoints for modal details
export const getObraMateriaisDetail = obraId => apiClient.get(`/obras/${obraId}/materiais-detalhes/`);
export const getObraMaoDeObraDetail = obraId => apiClient.get(`/obras/${obraId}/mao-de-obra-detalhes/`);
export const getObraServicosDetail = obraId => apiClient.get(`/obras/${obraId}/servicos-detalhes/`);

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
export const getRelatorioPagamentoPreCheck = params =>
  apiClient.get('/relatorios/pagamento/pre-check/', { params });
export const generateRelatorioPagamento = params =>
  apiClient.get('/relatorios/pagamento/generate/', { params });
export const generateRelatorioPagamentoPDF = params =>
  apiClient.get('/relatorios/pagamento/generate-pdf/', {
    params,
    responseType: 'blob',
  });

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

export const deleteAnexoDespesa = id =>
  apiClient.delete(`/anexos-despesa/${id}/`);
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

export const deleteAnexoLocacao = id =>
  apiClient.delete(`/anexos-locacao/${id}/`);
export const deleteLocacao = id => apiClient.delete(`/locacoes/${id}/`);
export const duplicateLocacao = (id, newDate) => apiClient.post(`/locacoes/${id}/duplicate/`, { new_date: newDate });
export const transferFuncionarioLocacao = async transferData => {
  const response = await apiClient.post(
    '/locacoes/transferir-funcionario/',
    transferData
  );
  return response.data;
};
export const getLocacaoCustoDiarioChart = (
  obraId = null,
  filtroTipo,
  year = null,
  month = null,
  endDate = null
) => {
  const params = new URLSearchParams();
  if (obraId) {
    params.append('obra_id', obraId);
  }
  if (filtroTipo) {
    params.append('filtro_tipo', filtroTipo);
  }
  if (year && month) {
    params.append('year', year);
    params.append('month', month);
  } else if (endDate) {
    params.append('end_date', endDate);
  }
  return apiClient.get(`/locacoes/custo_diario_chart/?${params.toString()}`);
};

// Funções para o Weekly Planner
export const getLocacoesDaSemana = (startDate, obraId, filtroTipo) => {
  const params = {
    inicio: startDate,
    filtro_tipo: filtroTipo || 'equipe_funcionario', // Garante um valor padrão
  };
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

export const getComprasDaSemana = (startDate, obraId) => {
  const params = { inicio: startDate };
  if (obraId) {
    params.obra_id = obraId;
  }
  return apiClient.get('/compras/semanal/', { params });
};

export const getCompraCustoDiarioChart = (obraId = null) => {
  let url = '/compras/custo_diario_chart/';
  if (obraId) {
    url += `?obra_id=${obraId}`;
  }
  return apiClient.get(url);
};

const prepareCompraFormData = (compraData) => {
  const formData = new FormData();

  // Append simple key-value pairs
  Object.keys(compraData).forEach(key => {
    if (key === 'itens' || key === 'parcelas' || key === 'anexos' || key === 'anexos_a_remover') {
      // Handled separately
      return;
    }
    if (compraData[key] !== null && compraData[key] !== undefined) {
      formData.append(key, compraData[key]);
    }
  });

  // Append complex data as JSON strings
  if (compraData.itens) {
    formData.append('itens', JSON.stringify(compraData.itens));
  }
  if (compraData.parcelas) {
    formData.append('parcelas', JSON.stringify(compraData.parcelas));
  }

  // Append files
  if (compraData.anexos) {
    compraData.anexos.forEach(anexo => {
      // If anexo is a file object from input
      if (anexo instanceof File) {
        formData.append('anexos', anexo, anexo.name);
      }
      // If anexo is an object with a file property (e.g., from a preview component)
      else if (anexo.file instanceof File) {
         formData.append('anexos', anexo.file, anexo.file.name);
      }
      // If anexo is a temporary attachment from AnexosCompraManager (has arquivo property)
      else if (anexo.arquivo instanceof File && anexo.isTemp) {
        formData.append('anexos', anexo.arquivo, anexo.nome_original || anexo.arquivo.name);
      }
    });
  }

  // Special handling for updates: include IDs of attachments to remove
  if (compraData.anexos_a_remover) {
      compraData.anexos_a_remover.forEach(anexoId => {
          formData.append('anexos_a_remover', anexoId);
      });
  }

  return formData;
};

export const createCompra = compraData => {
  const formData = prepareCompraFormData(compraData);
  return apiClient.post('/compras/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateCompra = (id, compraData) => {
  const formData = prepareCompraFormData(compraData);
  return apiClient.put(`/compras/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteCompra = id => apiClient.delete(`/compras/${id}/`);
export const updateCompraStatus = (id, data) =>
  apiClient.patch(`/compras/${id}/`, data);
export const duplicateCompra = (id, newDate) =>
  apiClient.post(`/compras/${id}/duplicate/`, { new_date: newDate });
export const approveOrcamento = id => apiClient.post(`/compras/${id}/approve/`);
export const getObraComprasDetalhes = obraId =>
  apiClient.get(`/obras/${obraId}/compras-detalhes/`);
export const generateBulkComprasPDF = compraIds =>
  apiClient.post('/compras/bulk-pdf/', { compra_ids: compraIds }, {
    responseType: 'blob',
  });

// --- Parcela Service Functions ---
export const getParcelasByCompra = compraId =>
  apiClient.get(`/compras/${compraId}/parcelas/`);
export const createParcela = (compraId, parcelaData) =>
  apiClient.post(`/compras/${compraId}/parcelas/`, parcelaData);
export const updateParcela = (compraId, parcelaId, parcelaData) =>
  apiClient.put(`/compras/${compraId}/parcelas/${parcelaId}/`, parcelaData);
export const deleteParcela = (compraId, parcelaId) =>
  apiClient.delete(`/compras/${compraId}/parcelas/${parcelaId}/`);
export const updateParcelaStatus = (compraId, parcelaId, status) =>
  apiClient.patch(`/compras/${compraId}/parcelas/${parcelaId}/`, { status });

// --- Anexo Compra Service Functions ---
export const getAnexosByCompra = compraId =>
  apiClient.get(`/anexos-compra/`, { params: { compra: compraId } });
export const uploadAnexoCompra = (compraId, formData) => {
  formData.append('compra', compraId);
  return apiClient.post(`/anexos-compra/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deleteAnexoCompra = (compraId, anexoId) =>
  apiClient.delete(`/anexos-compra/${anexoId}/`);
export const downloadAnexoCompra = (compraId, anexoId) =>
  apiClient.get(`/anexos-compra/${anexoId}/download/`, {
    responseType: 'blob',
  });

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

// --- System Tests Service Functions ---
export const testDatabaseConnection = () => apiClient.get('/health/');
export const testBackendHealth = () => apiClient.get('/health/');
export const getCurrentUserAPI = () => apiClient.get('/usuarios/me/');

export { apiClient };
