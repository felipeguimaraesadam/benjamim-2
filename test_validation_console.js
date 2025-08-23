// 🧪 SCRIPT DE TESTE PARA VALIDAÇÃO DE COMPRA
// Execute este script no console do navegador na página: http://localhost:5173/compras/nova

console.log('🧪 INICIANDO TESTE DE VALIDAÇÃO DE COMPRA');

// Função para aguardar um elemento aparecer
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

// Função para aguardar um tempo
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para simular clique
function clickElement(element) {
    element.click();
    element.dispatchEvent(new Event('click', { bubbles: true }));
}

// Função para preencher campo
function fillField(selector, value) {
    const field = document.querySelector(selector);
    if (field) {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ Campo ${selector} preenchido com: ${value}`);
        return true;
    }
    console.log(`❌ Campo ${selector} não encontrado`);
    return false;
}

// Função para verificar se há mensagens de erro
function checkForErrors() {
    const errors = [];
    
    // Procurar por mensagens de erro comuns
    const errorSelectors = [
        '.error-message',
        '.text-red-500',
        '.text-red-600',
        '.border-red-500',
        '[class*="error"]',
        '[class*="invalid"]'
    ];
    
    errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.textContent.trim()) {
                errors.push({
                    selector,
                    text: el.textContent.trim(),
                    element: el
                });
            }
        });
    });
    
    return errors;
}

// Função principal de teste
async function runValidationTests() {
    console.log('🔍 TESTE 1: Tentando salvar compra completamente vazia');
    
    try {
        // Aguardar o botão de salvar aparecer
        const saveButton = await waitForElement('button[type="submit"], button:contains("Salvar")');
        console.log('✅ Botão de salvar encontrado');
        
        // Limpar console para ver apenas os logs do teste
        console.clear();
        console.log('🧪 INICIANDO TESTE - COMPRA VAZIA');
        
        // Tentar salvar sem preencher nada
        clickElement(saveButton);
        
        // Aguardar um pouco para a validação processar
        await sleep(1000);
        
        // Verificar erros
        const errors = checkForErrors();
        console.log('🔍 Erros encontrados:', errors);
        
        if (errors.length > 0) {
            console.log('✅ TESTE 1 PASSOU: Validação impediu salvar compra vazia');
            errors.forEach(error => {
                console.log(`   - ${error.text}`);
            });
        } else {
            console.log('❌ TESTE 1 FALHOU: Nenhum erro de validação encontrado!');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
    
    console.log('\n🔍 TESTE 2: Preenchendo campos obrigatórios, mas deixando itens vazios');
    
    try {
        // Tentar preencher obra (assumindo que há um select)
        const obraSelect = document.querySelector('select[name="obra"], select:first-of-type');
        if (obraSelect && obraSelect.options.length > 1) {
            obraSelect.selectedIndex = 1;
            obraSelect.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Obra selecionada');
        }
        
        // Tentar preencher data
        fillField('input[type="date"], input[name*="data"]', '2024-01-15');
        
        // Aguardar um pouco
        await sleep(500);
        
        // Limpar console novamente
        console.clear();
        console.log('🧪 TESTE 2 - COMPRA SEM ITENS VÁLIDOS');
        
        // Tentar salvar
        const saveButton2 = document.querySelector('button[type="submit"], button:contains("Salvar")');
        if (saveButton2) {
            clickElement(saveButton2);
        }
        
        // Aguardar validação
        await sleep(1000);
        
        // Verificar erros
        const errors2 = checkForErrors();
        console.log('🔍 Erros encontrados:', errors2);
        
        // Verificar se há mensagem específica sobre itens
        const hasItemError = errors2.some(error => 
            error.text.toLowerCase().includes('item') || 
            error.text.toLowerCase().includes('produto') ||
            error.text.toLowerCase().includes('material')
        );
        
        if (hasItemError) {
            console.log('✅ TESTE 2 PASSOU: Validação impediu salvar compra sem itens válidos');
        } else {
            console.log('❌ TESTE 2 FALHOU: Não encontrou erro específico sobre itens!');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste 2:', error);
    }
    
    console.log('\n🎯 TESTES CONCLUÍDOS');
    console.log('📋 Verifique os logs acima para ver se a validação está funcionando corretamente.');
    console.log('🔍 Observe também os logs com 🔍 VALIDAÇÃO e 🚀 SUBMIT que devem aparecer.');
}

// Executar os testes
runValidationTests().catch(console.error);

// Também disponibilizar funções individuais para teste manual
window.testValidation = {
    runTests: runValidationTests,
    checkErrors: checkForErrors,
    fillField: fillField,
    clickSave: () => {
        const saveButton = document.querySelector('button[type="submit"], button:contains("Salvar")');
        if (saveButton) {
            clickElement(saveButton);
            console.log('🔄 Botão salvar clicado');
        } else {
            console.log('❌ Botão salvar não encontrado');
        }
    }
};

console.log('\n🛠️ FUNÇÕES DISPONÍVEIS:');
console.log('- testValidation.runTests() - Executar todos os testes');
console.log('- testValidation.checkErrors() - Verificar erros na tela');
console.log('- testValidation.clickSave() - Clicar no botão salvar');
console.log('- testValidation.fillField(selector, value) - Preencher campo');