// TESTE CRÍTICO DE VALIDAÇÃO - EXECUTE NO CONSOLE DO NAVEGADOR
// Abra F12 -> Console -> Cole este código e pressione Enter

console.log('🔥 TESTE CRÍTICO DE VALIDAÇÃO INICIADO');

// Função principal de teste
function testCriticalValidation() {
    console.log('\n=== TESTE CRÍTICO: SALVAR COMPRA SEM ITENS ===');
    
    // 1. Preencher apenas campos obrigatórios básicos
    console.log('📝 Preenchendo campos básicos...');
    
    // Obra
    const obraInput = document.querySelector('input[placeholder*="obra"], select');
    if (obraInput) {
        if (obraInput.tagName === 'SELECT') {
            obraInput.value = 'VESPASIANO, 890';
        } else {
            obraInput.value = 'VESPASIANO, 890';
        }
        obraInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Obra preenchida');
    }
    
    // Fornecedor
    const fornecedorInput = document.querySelector('input[placeholder*="fornecedor"]');
    if (fornecedorInput) {
        fornecedorInput.value = 'Teste Fornecedor';
        fornecedorInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Fornecedor preenchido');
    }
    
    // Data
    const dataInput = document.querySelector('input[type="date"]');
    if (dataInput) {
        dataInput.value = '2025-01-22';
        dataInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Data preenchida');
    }
    
    // 2. Verificar se há itens válidos
    console.log('\n📦 Verificando itens...');
    const itemRows = document.querySelectorAll('tbody tr');
    console.log(`Linhas de itens encontradas: ${itemRows.length}`);
    
    let hasValidItems = false;
    itemRows.forEach((row, index) => {
        const materialInput = row.querySelector('input[placeholder*="material"], select');
        const qtdInput = row.querySelector('input[type="number"]');
        const valorInput = row.querySelector('input[placeholder*="valor"]');
        
        const material = materialInput?.value || '';
        const qtd = qtdInput?.value || '';
        const valor = valorInput?.value || '';
        
        console.log(`Item ${index + 1}: Material="${material}", Qtd="${qtd}", Valor="${valor}"`);
        
        if (material.trim() && qtd && parseFloat(qtd) > 0 && valor && parseFloat(valor) > 0) {
            hasValidItems = true;
        }
    });
    
    console.log(`🎯 Tem itens válidos: ${hasValidItems}`);
    
    // 3. Tentar salvar
    console.log('\n🚀 Tentando salvar...');
    const saveButton = document.querySelector('button[type="submit"]') || 
                      Array.from(document.querySelectorAll('button')).find(btn => 
                          btn.textContent.includes('Salvar') || 
                          btn.textContent.includes('Registrar')
                      );
    
    if (!saveButton) {
        console.error('❌ Botão de salvar não encontrado!');
        return;
    }
    
    console.log('Clicando no botão de salvar...');
    saveButton.click();
    
    // 4. Verificar resultado após 3 segundos
    setTimeout(() => {
        console.log('\n🔍 VERIFICANDO RESULTADO...');
        
        // Verificar mensagens de erro
        const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, .error, [class*="error"], .alert-danger');
        console.log(`Mensagens de erro encontradas: ${errorElements.length}`);
        
        errorElements.forEach((error, index) => {
            console.log(`❌ Erro ${index + 1}: "${error.textContent.trim()}"`);
        });
        
        // Verificar se ainda está na página
        const currentUrl = window.location.href;
        console.log(`URL atual: ${currentUrl}`);
        
        if (currentUrl.includes('/compras/nova') || currentUrl.includes('/compras/registrar')) {
            console.log('✅ VALIDAÇÃO OK: Ainda está na página de nova compra');
        } else {
            console.log('❌ PROBLEMA: Saiu da página - pode ter salvado incorretamente!');
        }
        
        // Verificar se há alertas de sucesso
        const successElements = document.querySelectorAll('.text-green-500, .text-green-600, .success, [class*="success"], .alert-success');
        if (successElements.length > 0) {
            console.log('❌ PROBLEMA: Encontrou mensagem de sucesso - compra foi salva!');
            successElements.forEach((success, index) => {
                console.log(`✅ Sucesso ${index + 1}: "${success.textContent.trim()}"`);
            });
        }
        
        console.log('\n🏁 TESTE CONCLUÍDO');
    }, 3000);
}

// Executar o teste
testCriticalValidation();

console.log('\n📋 INSTRUÇÕES:');
console.log('1. Se aparecer erro "Uma compra deve ter pelo menos um item" = VALIDAÇÃO OK');
console.log('2. Se não aparecer erro e sair da página = PROBLEMA!');
console.log('3. Para testar novamente: testCriticalValidation()');