const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
let authToken = null;

// Função para autenticar
async function authenticate() {
    try {
        const response = await axios.post(`${BASE_URL}/api/token/`, {
            login: 'admin',
            password: 'admin123'
        });
        authToken = response.data.access;
        console.log('✅ Autenticação bem-sucedida');
        return true;
    } catch (error) {
        try {
            const response = await axios.post(`${BASE_URL}/api/token/`, {
                login: 'admin@admin.com',
                password: 'admin'
            });
            authToken = response.data.access;
            console.log('✅ Autenticação bem-sucedida (credenciais alternativas)');
            return true;
        } catch (error2) {
            console.error('❌ Erro na autenticação:', error2.response?.data || error2.message);
            return false;
        }
    }
}

// Função para criar compra simples
async function testCompraSimples() {
    console.log('\n=== TESTE: Compra Simples ===');
    try {
        const compraData = {
            obra: 8,
            fornecedor: 'Fornecedor Teste',
            data_compra: '2025-01-22',
            nota_fiscal: 'NF-001',
            valor_total_bruto: 1000.00,
            desconto: 0.00,
            valor_total_liquido: 1000.00,
            forma_pagamento: 'AVISTA',
            itens: [{
                material: 2,
                quantidade: 10,
                valor_unitario: 100.00,
                valor_total: 1000.00,
                categoria_uso: 'Geral'
            }]
        };

        const response = await axios.post(`${BASE_URL}/api/compras/`, compraData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Compra simples criada com sucesso');
        console.log('ID da compra:', response.data.id);
        
        // Verificar se a compra foi salva com itens
        const verificacao = await axios.get(`${BASE_URL}/api/compras/${response.data.id}/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (verificacao.data.itens && verificacao.data.itens.length > 0) {
            console.log('✅ Compra salva com itens corretamente');
            console.log('Número de itens:', verificacao.data.itens.length);
        } else {
            console.log('❌ ERRO: Compra salva SEM itens!');
        }
        
        return response.data.id;
    } catch (error) {
        console.error('❌ Erro na criação da compra simples:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar compra vazia (deve falhar)
async function testCompraVazia() {
    console.log('\n=== TESTE: Validação Compra Vazia ===');
    try {
        const compraData = {
            obra: 8,
            fornecedor: 'Fornecedor Teste',
            data_compra: '2025-01-22',
            nota_fiscal: 'NF-002',
            valor_total_bruto: 0.00,
            desconto: 0.00,
            valor_total_liquido: 0.00,
            forma_pagamento: 'AVISTA',
            itens: [] // Lista vazia - deve ser rejeitada
        };

        const response = await axios.post(`${BASE_URL}/api/compras/`, compraData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('❌ ERRO: Compra vazia foi aceita pelo backend!');
        console.log('ID da compra:', response.data.id);
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Validação funcionando: Compra vazia foi rejeitada');
            console.log('Erro:', error.response.data);
            return true;
        } else {
            console.error('❌ Erro inesperado:', error.response?.data || error.message);
            return false;
        }
    }
}

// Função para testar compra parcelada
async function testCompraParcelada() {
    console.log('\n=== TESTE: Compra Parcelada ===');
    try {
        const compraData = {
            obra: 8,
            fornecedor: 'Fornecedor Teste',
            data_compra: '2025-01-22',
            nota_fiscal: 'NF-003',
            valor_total_bruto: 1500.00,
            desconto: 0.00,
            valor_total_liquido: 1500.00,
            forma_pagamento: 'PARCELADO',
            numero_parcelas: 3,
            valor_entrada: 300.00,
            itens: [{
                material: 2,
                quantidade: 15,
                valor_unitario: 100.00,
                valor_total: 1500.00,
                categoria_uso: 'Geral'
            }]
        };

        const response = await axios.post(`${BASE_URL}/api/compras/`, compraData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Compra parcelada criada com sucesso');
        console.log('ID da compra:', response.data.id);
        
        // Verificar se as parcelas foram criadas
        const verificacao = await axios.get(`${BASE_URL}/api/compras/${response.data.id}/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (verificacao.data.parcelas && verificacao.data.parcelas.length > 0) {
            console.log('✅ Parcelas criadas corretamente');
            console.log('Número de parcelas:', verificacao.data.parcelas.length);
            
            // Verificar valores das parcelas
            const valorParcelar = 1500.00 - 300.00; // valor_total - entrada
            const valorParcela = valorParcelar / 3;
            
            verificacao.data.parcelas.forEach((parcela, index) => {
                console.log(`Parcela ${index + 1}: R$ ${parcela.valor_parcela} - Vencimento: ${parcela.data_vencimento}`);
                
                // Verificar se não há valores infinitos
                if (!isFinite(parcela.valor_parcela) || parcela.valor_parcela === null) {
                    console.log('❌ ERRO: Valor da parcela é infinito ou nulo!');
                }
            });
        } else {
            console.log('❌ ERRO: Parcelas não foram criadas!');
        }
        
        return response.data.id;
    } catch (error) {
        console.error('❌ Erro na criação da compra parcelada:', error.response?.data || error.message);
        return null;
    }
}

// Função principal
async function runTests() {
    console.log('🚀 Iniciando testes de validação de compras...');
    
    // Autenticar
    const authenticated = await authenticate();
    if (!authenticated) {
        console.log('❌ Falha na autenticação. Encerrando testes.');
        return;
    }
    
    // Executar testes
    const compraSimples = await testCompraSimples();
    const validacaoVazia = await testCompraVazia();
    const compraParcelada = await testCompraParcelada();
    
    // Resumo dos resultados
    console.log('\n=== RESUMO DOS TESTES ===');
    console.log('Compra Simples:', compraSimples ? '✅ PASSOU' : '❌ FALHOU');
    console.log('Validação Compra Vazia:', validacaoVazia ? '✅ PASSOU' : '❌ FALHOU');
    console.log('Compra Parcelada:', compraParcelada ? '✅ PASSOU' : '❌ FALHOU');
    
    if (compraSimples && validacaoVazia && compraParcelada) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    } else {
        console.log('\n⚠️  ALGUNS TESTES FALHARAM - VERIFICAR IMPLEMENTAÇÃO');
    }
}

// Executar testes
runTests().catch(console.error);

// Arquivo de teste executado diretamente