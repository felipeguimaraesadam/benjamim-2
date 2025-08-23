// 🚨 TESTE REAL DE VALIDAÇÃO - Execute no console do navegador
// URL: http://localhost:5173/compras/nova

console.log('🚨 INICIANDO TESTE REAL DE VALIDAÇÃO');
console.log('📍 Certifique-se de estar na página: http://localhost:5173/compras/nova');

// Função para aguardar elemento aparecer
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Elemento ${selector} não encontrado em ${timeout}ms`));
        }, timeout);
    });
}

// Função principal de teste
async function testValidation() {
    try {
        console.log('\n🔍 PASSO 1: Procurando elementos do formulário...');
        
        // Procurar botão de salvar
        const saveButton = await waitForElement('button[type="submit"], button:contains("Salvar"), button:contains("Registrar")');
        console.log('✅ Botão de salvar encontrado:', saveButton.textContent.trim());
        
        // Verificar estado inicial do formulário
        console.log('\n🔍 PASSO 2: Verificando estado inicial...');
        
        const obraSelect = document.querySelector('select');
        const dataInput = document.querySelector('input[type="date"]');
        const materialInputs = document.querySelectorAll('input[placeholder*="material"], input[placeholder*="Material"], .material-input');
        
        console.log('📋 Estado do formulário:');
        console.log('- Obra:', obraSelect ? (obraSelect.value || 'não selecionada') : 'campo não encontrado');
        console.log('- Data:', dataInput ? (dataInput.value || 'não preenchida') : 'campo não encontrado');
        console.log('- Campos de material encontrados:', materialInputs.length);
        
        // TESTE 1: Tentar salvar formulário vazio
        console.log('\n🧪 TESTE 1: Tentando salvar formulário completamente vazio...');
        
        // Limpar todos os campos primeiro
        if (obraSelect) obraSelect.value = '';
        if (dataInput) dataInput.value = '';
        materialInputs.forEach(input => input.value = '');
        
        // Clicar no botão salvar
        console.log('🔄 Clicando no botão salvar...');
        saveButton.click();
        
        // Aguardar e verificar erros
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, .border-red-500, [class*="error"], .error-message');
        console.log('🔍 Elementos de erro encontrados:', errorElements.length);
        
        let hasValidationError = false;
        errorElements.forEach((el, index) => {
            const text = el.textContent.trim();
            if (text) {
                console.log(`   ${index + 1}. ${text}`);
                if (text.toLowerCase().includes('item') || text.toLowerCase().includes('produto') || text.toLowerCase().includes('material')) {
                    hasValidationError = true;
                }
            }
        });
        
        if (hasValidationError) {
            console.log('✅ TESTE 1 PASSOU: Validação impediu salvar sem itens');
        } else if (errorElements.length > 0) {
            console.log('⚠️ TESTE 1 PARCIAL: Há erros, mas não específicos sobre itens');
        } else {
            console.log('❌ TESTE 1 FALHOU: Nenhum erro de validação encontrado!');
        }
        
        // TESTE 2: Preencher campos obrigatórios mas deixar itens vazios
        console.log('\n🧪 TESTE 2: Preenchendo campos obrigatórios, mas deixando itens vazios...');
        
        if (obraSelect && obraSelect.options.length > 1) {
            obraSelect.value = obraSelect.options[1].value;
            console.log('✅ Obra selecionada:', obraSelect.options[1].text);
        }
        
        if (dataInput) {
            dataInput.value = '2024-01-15';
            console.log('✅ Data preenchida: 2024-01-15');
        }
        
        // Clicar no botão salvar novamente
        console.log('🔄 Clicando no botão salvar novamente...');
        saveButton.click();
        
        // Aguardar e verificar erros
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const errorElements2 = document.querySelectorAll('.text-red-500, .text-red-600, .border-red-500, [class*="error"], .error-message');
        console.log('🔍 Elementos de erro encontrados:', errorElements2.length);
        
        let hasItemValidationError = false;
        errorElements2.forEach((el, index) => {
            const text = el.textContent.trim();
            if (text) {
                console.log(`   ${index + 1}. ${text}`);
                if (text.toLowerCase().includes('item') || text.toLowerCase().includes('produto') || text.toLowerCase().includes('material')) {
                    hasItemValidationError = true;
                }
            }
        });
        
        if (hasItemValidationError) {
            console.log('✅ TESTE 2 PASSOU: Validação impediu salvar sem itens válidos');
        } else if (errorElements2.length > 0) {
            console.log('⚠️ TESTE 2 PARCIAL: Há erros, mas não específicos sobre itens');
        } else {
            console.log('❌ TESTE 2 FALHOU: Formulário foi salvo sem itens!');
        }
        
        // Verificar se houve redirecionamento (indicaria que salvou)
        const currentUrl = window.location.href;
        if (currentUrl.includes('/compras') && !currentUrl.includes('/nova')) {
            console.log('❌ CRÍTICO: Página foi redirecionada, indicando que a compra foi salva sem itens!');
        }
        
        console.log('\n📊 RESUMO DOS TESTES:');
        console.log('- URL atual:', window.location.href);
        console.log('- Teste 1 (vazio):', hasValidationError ? '✅ OK' : '❌ FALHOU');
        console.log('- Teste 2 (sem itens):', hasItemValidationError ? '✅ OK' : '❌ FALHOU');
        
        if (!hasValidationError && !hasItemValidationError) {
            console.log('\n🚨 PROBLEMA CRÍTICO DETECTADO!');
            console.log('A validação NÃO está funcionando corretamente!');
            console.log('O sistema permite salvar compras sem itens!');
        } else {
            console.log('\n✅ Validação funcionando corretamente!');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

// Executar teste automaticamente
testValidation();

// Disponibilizar função para execução manual
window.testRealValidation = testValidation;

console.log('\n💡 Para executar novamente: testRealValidation()');