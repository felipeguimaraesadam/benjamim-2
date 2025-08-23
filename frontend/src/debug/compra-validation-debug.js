// SISTEMA DE DEBUG EMERGENCIAL - INTERCEPTA TODAS AS VALIDAÇÕES
// Este script deve ser executado no console do navegador para debugar o erro de validação

(function() {
    console.log('🚨 SISTEMA DE DEBUG ATIVADO - COMPRA VALIDATION');
    
    // Interceptar console.log para capturar logs do componente
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Array para armazenar todos os logs de debug
    window.debugLogs = [];
    
    function logWithTimestamp(level, ...args) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message: args.join(' '),
            stack: new Error().stack
        };
        window.debugLogs.push(logEntry);
        
        if (level === 'error') {
            originalError(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
        } else if (level === 'warn') {
            originalWarn(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
        } else {
            originalLog(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
        }
    }
    
    // Interceptar todas as funções de validação
    window.interceptValidation = function() {
        // Encontrar o componente React na página
        const compraForm = document.querySelector('form');
        if (!compraForm) {
            console.error('❌ Formulário de compra não encontrado!');
            return;
        }
        
        console.log('✅ Formulário encontrado, iniciando interceptação...');
        
        // Interceptar eventos de submit
        compraForm.addEventListener('submit', function(e) {
            console.log('🔥 SUBMIT INTERCEPTADO!');
            console.log('📊 Estado atual dos itens:', window.getCurrentItems());
            
            // Não prevenir o submit, apenas logar
        });
        
        // Interceptar mudanças nos inputs
        const inputs = compraForm.querySelectorAll('input, select, textarea');
        inputs.forEach((input, index) => {
            input.addEventListener('change', function(e) {
                if (e.target.name && e.target.name.includes('item')) {
                    console.log(`📝 MUDANÇA NO ITEM [${index}]:`, {
                        name: e.target.name,
                        value: e.target.value,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            input.addEventListener('blur', function(e) {
                if (e.target.name && e.target.name.includes('item')) {
                    console.log(`👁️ BLUR NO ITEM [${index}]:`, {
                        name: e.target.name,
                        value: e.target.value,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    };
    
    // Função para obter estado atual dos itens
    window.getCurrentItems = function() {
        const itemRows = document.querySelectorAll('tbody tr');
        const items = [];
        
        itemRows.forEach((row, index) => {
            const materialInput = row.querySelector('input[placeholder*="material"], input[placeholder*="Material"]');
            const quantityInput = row.querySelector('input[type="number"], input[inputmode="numeric"]');
            const unitPriceInputs = row.querySelectorAll('input[inputmode="decimal"]');
            const unitPriceInput = unitPriceInputs[0]; // Primeiro input decimal é o preço unitário
            const totalPriceInput = unitPriceInputs[1]; // Segundo input decimal é o preço total
            const categorySelect = row.querySelector('select');
            
            const item = {
                index,
                material: materialInput ? materialInput.value : '',
                quantity: quantityInput ? quantityInput.value : '',
                unitPrice: unitPriceInput ? unitPriceInput.value : '',
                totalPrice: totalPriceInput ? totalPriceInput.value : '',
                category: categorySelect ? categorySelect.value : '',
                isValid: false
            };
            
            // Validar item
            item.isValid = item.material.trim() !== '' && 
                          item.quantity !== '' && 
                          parseFloat(item.quantity) > 0 &&
                          item.unitPrice !== '' && 
                          parseFloat(item.unitPrice.replace(',', '.')) > 0 &&
                          item.category !== '';
            
            items.push(item);
        });
        
        return items;
    };
    
    // Função para validar todos os itens
    window.validateAllItems = function() {
        const items = window.getCurrentItems();
        const validItems = items.filter(item => item.isValid);
        
        console.log('🔍 VALIDAÇÃO COMPLETA:');
        console.log('📋 Total de itens:', items.length);
        console.log('✅ Itens válidos:', validItems.length);
        console.log('❌ Itens inválidos:', items.length - validItems.length);
        
        items.forEach((item, index) => {
            console.log(`Item ${index + 1}:`, {
                material: item.material,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                category: item.category,
                isValid: item.isValid,
                reasons: {
                    materialEmpty: item.material.trim() === '',
                    quantityEmpty: item.quantity === '',
                    quantityInvalid: parseFloat(item.quantity) <= 0,
                    unitPriceEmpty: item.unitPrice === '',
                    unitPriceInvalid: parseFloat(item.unitPrice.replace(',', '.')) <= 0,
                    categoryEmpty: item.category === ''
                }
            });
        });
        
        return {
            total: items.length,
            valid: validItems.length,
            invalid: items.length - validItems.length,
            items: items
        };
    };
    
    // Função para simular o submit e ver o erro
    window.debugSubmit = function() {
        console.log('🚀 SIMULANDO SUBMIT...');
        
        const validation = window.validateAllItems();
        
        if (validation.valid === 0) {
            console.error('❌ ERRO ENCONTRADO: Nenhum item válido!');
            console.log('💡 SOLUÇÃO: Preencha pelo menos um item completamente');
        } else {
            console.log('✅ VALIDAÇÃO OK: Itens válidos encontrados');
        }
        
        // Tentar encontrar mensagens de erro na tela
        const errorMessages = document.querySelectorAll('[role="alert"], .text-red-600, .text-red-700');
        if (errorMessages.length > 0) {
            console.log('🔴 MENSAGENS DE ERRO ENCONTRADAS:');
            errorMessages.forEach((msg, index) => {
                console.log(`Erro ${index + 1}:`, msg.textContent);
            });
        }
        
        return validation;
    };
    
    // Função para limpar logs
    window.clearDebugLogs = function() {
        window.debugLogs = [];
        console.clear();
        console.log('🧹 Logs limpos!');
    };
    
    // Função para exportar logs
    window.exportDebugLogs = function() {
        const logs = JSON.stringify(window.debugLogs, null, 2);
        console.log('📤 LOGS EXPORTADOS:');
        console.log(logs);
        return logs;
    };
    
    // Auto-inicializar após 1 segundo
    setTimeout(() => {
        window.interceptValidation();
        console.log('🎯 COMANDOS DISPONÍVEIS:');
        console.log('- window.getCurrentItems() - Ver estado atual dos itens');
        console.log('- window.validateAllItems() - Validar todos os itens');
        console.log('- window.debugSubmit() - Simular submit e ver erros');
        console.log('- window.clearDebugLogs() - Limpar logs');
        console.log('- window.exportDebugLogs() - Exportar logs');
        console.log('\n🔥 AGORA PREENCHA O FORMULÁRIO E TESTE!');
    }, 1000);
    
})();

// Instruções de uso:
// 1. Abra o DevTools (F12)
// 2. Cole este script no Console
// 3. Preencha o formulário como na imagem
// 4. Execute: window.debugSubmit()
// 5. Veja os logs detalhados do problema