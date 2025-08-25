// TESTE FINAL DE VALIDAÇÃO - APÓS CORREÇÃO DO BUG CRÍTICO
// Execute este script no console do navegador em /compras/nova

console.log('🔧 TESTE FINAL DE VALIDAÇÃO - APÓS CORREÇÃO');
console.log('===============================================');

// Função para testar a validação completa
function testValidationFinal() {
    console.log('\n🧪 INICIANDO TESTE FINAL...');
    
    // 1. Capturar o formulário
    const form = document.querySelector('form');
    if (!form) {
        console.error('❌ Formulário não encontrado!');
        return;
    }
    
    // 2. Preencher dados básicos do cabeçalho
    const dataCompra = document.querySelector('input[type="date"]');
    const obraSelect = document.querySelector('select');
    
    if (dataCompra) {
        dataCompra.value = '2025-01-22';
        dataCompra.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Data da compra preenchida');
    }
    
    if (obraSelect && obraSelect.options.length > 1) {
        obraSelect.selectedIndex = 1;
        obraSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Obra selecionada');
    }
    
    // 3. Preencher um item válido
    setTimeout(() => {
        const materialInput = document.querySelector('input[placeholder*="material"], input[placeholder*="Material"]');
        const qtdInput = document.querySelector('input[placeholder*="quantidade"], input[placeholder*="Quantidade"]');
        const valorInput = document.querySelector('input[placeholder*="valor"], input[placeholder*="Valor"]');
        
        if (materialInput) {
            materialInput.value = 'CIMENTO 50KG';
            materialInput.dispatchEvent(new Event('input', { bubbles: true }));
            materialInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Material preenchido');
        }
        
        if (qtdInput) {
            qtdInput.value = '10';
            qtdInput.dispatchEvent(new Event('input', { bubbles: true }));
            qtdInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Quantidade preenchida');
        }
        
        if (valorInput) {
            valorInput.value = '25.50';
            valorInput.dispatchEvent(new Event('input', { bubbles: true }));
            valorInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Valor unitário preenchido');
        }
        
        // 4. Testar salvamento com dados válidos
        setTimeout(() => {
            console.log('\n🎯 TESTE 1: Salvamento com dados válidos');
            const saveBtn = document.querySelector('button[type="submit"], button:contains("Salvar")');
            if (saveBtn) {
                console.log('📝 Tentando salvar com dados válidos...');
                saveBtn.click();
                
                setTimeout(() => {
                    const errorMsg = document.querySelector('.error, .alert-danger, [class*="error"]');
                    if (errorMsg && errorMsg.textContent.includes('pelo menos um item')) {
                        console.error('❌ FALHA: Ainda mostra erro de validação com dados válidos!');
                        console.error('Erro encontrado:', errorMsg.textContent);
                    } else {
                        console.log('✅ SUCESSO: Não há erro de validação com dados válidos!');
                    }
                }, 1000);
            }
        }, 1000);
        
    }, 500);
}

// Função para testar sem itens
function testWithoutItems() {
    console.log('\n🎯 TESTE 2: Validação sem itens');
    
    // Limpar todos os campos de itens
    const inputs = document.querySelectorAll('input[placeholder*="material"], input[placeholder*="quantidade"], input[placeholder*="valor"]');
    inputs.forEach(input => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    setTimeout(() => {
        const saveBtn = document.querySelector('button[type="submit"], button:contains("Salvar")');
        if (saveBtn) {
            console.log('📝 Tentando salvar sem itens...');
            saveBtn.click();
            
            setTimeout(() => {
                const errorMsg = document.querySelector('.error, .alert-danger, [class*="error"]');
                if (errorMsg && errorMsg.textContent.includes('pelo menos um item')) {
                    console.log('✅ SUCESSO: Validação bloqueia salvamento sem itens!');
                } else {
                    console.error('❌ FALHA: Deveria mostrar erro ao tentar salvar sem itens!');
                }
            }, 1000);
        }
    }, 500);
}

// Executar testes
console.log('\n🚀 EXECUTANDO TESTES FINAIS...');
console.log('1. Execute: testValidationFinal() - para testar com dados válidos');
console.log('2. Execute: testWithoutItems() - para testar sem itens');

// Disponibilizar funções globalmente
window.testValidationFinal = testValidationFinal;
window.testWithoutItems = testWithoutItems;

console.log('\n🎯 OBJETIVO: Verificar se a correção do bug items.indexOf(item) funcionou!');