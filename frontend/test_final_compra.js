// TESTE FINAL - VERIFICAÇÃO COMPLETA DA CORREÇÃO
// Execute este script no console do navegador na página /compras/nova

console.log('🚀 INICIANDO TESTE FINAL DA CORREÇÃO DE COMPRA');

// Função para simular preenchimento completo do formulário
function preencherFormularioCompleto() {
    console.log('📝 Preenchendo formulário...');
    
    // Preencher data
    const dataInput = document.querySelector('input[type="date"]');
    if (dataInput) {
        dataInput.value = '2025-01-20';
        dataInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Data preenchida');
    }
    
    // Preencher obra
    const obraInput = document.querySelector('input[placeholder*="obra" i], input[name*="obra" i]');
    if (obraInput) {
        obraInput.value = 'VESPASIANO, 890';
        obraInput.dispatchEvent(new Event('input', { bubbles: true }));
        obraInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Obra preenchida');
    }
    
    // Preencher fornecedor
    const fornecedorInput = document.querySelector('input[placeholder*="fornecedor" i], input[name*="fornecedor" i]');
    if (fornecedorInput) {
        fornecedorInput.value = 'Fornecedor Teste';
        fornecedorInput.dispatchEvent(new Event('input', { bubbles: true }));
        fornecedorInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Fornecedor preenchido');
    }
    
    // Verificar se já existe item
    const materialInputs = document.querySelectorAll('input[placeholder*="material" i], input[name*="material" i]');
    const quantidadeInputs = document.querySelectorAll('input[placeholder*="quantidade" i], input[name*="quantidade" i], input[placeholder*="qtd" i]');
    const valorInputs = document.querySelectorAll('input[placeholder*="valor" i], input[name*="valor" i]');
    
    console.log(`📊 Encontrados: ${materialInputs.length} materiais, ${quantidadeInputs.length} quantidades, ${valorInputs.length} valores`);
    
    // Preencher primeiro item se existir
    if (materialInputs.length > 0) {
        materialInputs[0].value = 'CHAPUTO CORRUGADO PESAD 1 1/4 C';
        materialInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        materialInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Material preenchido');
    }
    
    if (quantidadeInputs.length > 0) {
        quantidadeInputs[0].value = '20';
        quantidadeInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        quantidadeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Quantidade preenchida');
    }
    
    if (valorInputs.length > 0) {
        valorInputs[0].value = '400.00';
        valorInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        valorInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Valor preenchido');
    }
    
    console.log('📝 Formulário preenchido completamente!');
}

// Função para interceptar requisições e verificar dados enviados
function interceptarRequisicoes() {
    console.log('🔍 Interceptando requisições...');
    
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        
        if (url.includes('/compras/') && options && options.method === 'POST') {
            console.log('🚀 REQUISIÇÃO DE COMPRA INTERCEPTADA:');
            console.log('URL:', url);
            
            if (options.body) {
                try {
                    const data = JSON.parse(options.body);
                    console.log('📦 DADOS ENVIADOS:', data);
                    console.log('📋 ITENS:', data.itens);
                    
                    if (data.itens && data.itens.length > 0) {
                        console.log('✅ ITENS ENCONTRADOS NO ENVIO!');
                        data.itens.forEach((item, index) => {
                            console.log(`Item ${index + 1}:`, item);
                        });
                    } else {
                        console.log('❌ NENHUM ITEM ENCONTRADO NO ENVIO!');
                    }
                } catch (e) {
                    console.log('📦 DADOS (não JSON):', options.body);
                }
            }
        }
        
        return originalFetch.apply(this, args).then(response => {
            if (url.includes('/compras/') && options && options.method === 'POST') {
                console.log('📨 RESPOSTA:', response.status, response.statusText);
                
                // Clonar resposta para ler o corpo
                const clonedResponse = response.clone();
                clonedResponse.json().then(data => {
                    console.log('📨 CORPO DA RESPOSTA:', data);
                    
                    if (data.itens) {
                        console.log('❌ ERRO DE VALIDAÇÃO:', data.itens);
                    } else if (response.ok) {
                        console.log('✅ COMPRA CRIADA COM SUCESSO!');
                    }
                }).catch(() => {
                    console.log('📨 Resposta não é JSON');
                });
            }
            
            return response;
        });
    };
}

// Função para testar submit
function testarSubmit() {
    console.log('🎯 Testando submit...');
    
    const submitButton = document.querySelector('button[type="submit"], button:contains("Salvar"), button:contains("Criar")');
    if (submitButton) {
        console.log('🔘 Botão de submit encontrado:', submitButton.textContent);
        submitButton.click();
        console.log('🔘 Submit executado!');
    } else {
        console.log('❌ Botão de submit não encontrado');
        
        // Tentar encontrar por texto
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes('salvar') || 
                btn.textContent.toLowerCase().includes('criar') ||
                btn.textContent.toLowerCase().includes('enviar')) {
                console.log('🔘 Botão encontrado por texto:', btn.textContent);
                btn.click();
            }
        });
    }
}

// Executar teste completo
function executarTesteCompleto() {
    console.log('🚀 EXECUTANDO TESTE COMPLETO...');
    
    // 1. Interceptar requisições
    interceptarRequisicoes();
    
    // 2. Aguardar um pouco e preencher formulário
    setTimeout(() => {
        preencherFormularioCompleto();
        
        // 3. Aguardar mais um pouco e testar submit
        setTimeout(() => {
            testarSubmit();
        }, 2000);
    }, 1000);
}

// Iniciar teste
executarTesteCompleto();

console.log('🎯 TESTE FINAL INICIADO! Aguarde os resultados...');
console.log('📋 Para executar manualmente: executarTesteCompleto()');