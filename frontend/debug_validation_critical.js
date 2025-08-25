// DEBUGGING CRÍTICO - PROBLEMA IDENTIFICADO!
// Execute no console do navegador na página /compras/nova

console.log('🚨 DEBUGGING CRÍTICO - PROBLEMA IDENTIFICADO!');
console.log('=' .repeat(60));

// Função para testar a validação real
function testValidationLogic() {
    console.log('🔍 TESTANDO LÓGICA DE VALIDAÇÃO...');
    
    // Simular um item válido
    const itemTeste = {
        material: { id: 1 },
        materialId: '1',
        quantidade: '10',
        valorUnitario: '5.50'
    };
    
    console.log('📦 ITEM DE TESTE:', itemTeste);
    
    // Testar as condições de validação
    const hasMaterial = !!(itemTeste.material && itemTeste.material.id) || !!(itemTeste.materialId && String(itemTeste.materialId).trim());
    const hasQuantidade = !!(itemTeste.quantidade && String(itemTeste.quantidade).trim());
    const hasValorUnitario = !!(itemTeste.valorUnitario && String(itemTeste.valorUnitario).trim());
    
    console.log('✅ VERIFICAÇÕES:');
    console.log('   Material válido:', hasMaterial);
    console.log('   Quantidade válida:', hasQuantidade);
    console.log('   Valor válido:', hasValorUnitario);
    console.log('   Item tem dados:', hasMaterial || hasQuantidade || hasValorUnitario);
    
    // Simular validateField para material
    const materialValid = !!(itemTeste.material && itemTeste.material.id) || !!(itemTeste.materialId && String(itemTeste.materialId).trim());
    const quantidadeStr = String(itemTeste.quantidade || '').replace(',', '.').trim();
    const quantidadeValid = quantidadeStr !== '' && !isNaN(parseFloat(quantidadeStr)) && parseFloat(quantidadeStr) > 0;
    const valorStr = String(itemTeste.valorUnitario || '').replace(',', '.').trim();
    const valorValid = valorStr !== '' && !isNaN(parseFloat(valorStr)) && parseFloat(valorStr) >= 0;
    
    console.log('🎯 VALIDAÇÕES INDIVIDUAIS:');
    console.log('   Material:', materialValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    console.log('   Quantidade:', quantidadeValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    console.log('   Valor:', valorValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    
    const itemCompleto = materialValid && quantidadeValid && valorValid;
    console.log('🏆 ITEM COMPLETO:', itemCompleto ? '✅ SIM' : '❌ NÃO');
    
    return itemCompleto;
}

// Função para interceptar o submit real
function interceptRealSubmit() {
    console.log('🎯 INTERCEPTANDO SUBMIT REAL...');
    
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            console.log('🚨 SUBMIT INTERCEPTADO!');
            e.preventDefault(); // Prevenir submit para debugging
            
            // Capturar todos os inputs de material
            const materialInputs = document.querySelectorAll('input[placeholder*="material"], input[placeholder*="Material"]');
            const quantidadeInputs = document.querySelectorAll('input[type="number"]');
            
            console.log('📋 INPUTS ENCONTRADOS:');
            console.log('   Materiais:', materialInputs.length);
            console.log('   Quantidades:', quantidadeInputs.length);
            
            // Analisar cada linha de item
            const linhas = document.querySelectorAll('tbody tr');
            console.log('📊 LINHAS DE ITENS:', linhas.length);
            
            const itensAnalisados = [];
            linhas.forEach((linha, index) => {
                const materialInput = linha.querySelector('input[placeholder*="material"], input[placeholder*="Material"]');
                const quantidadeInput = linha.querySelector('input[type="number"]');
                const valorInputs = linha.querySelectorAll('input[type="number"]');
                const valorInput = valorInputs[1]; // Segundo input number é o valor
                
                if (materialInput || quantidadeInput || valorInput) {
                    const item = {
                        linha: index,
                        material: materialInput ? materialInput.value : '',
                        quantidade: quantidadeInput ? quantidadeInput.value : '',
                        valor: valorInput ? valorInput.value : ''
                    };
                    
                    // Aplicar a mesma lógica de validação
                    const hasMaterial = item.material && item.material.trim() !== '';
                    const hasQuantidade = item.quantidade && item.quantidade.trim() !== '';
                    const hasValor = item.valor && item.valor.trim() !== '';
                    
                    const temDados = hasMaterial || hasQuantidade || hasValor;
                    
                    if (temDados) {
                        // Validar se todos os campos estão preenchidos
                        const materialOk = hasMaterial;
                        const quantidadeOk = hasQuantidade && !isNaN(parseFloat(item.quantidade)) && parseFloat(item.quantidade) > 0;
                        const valorOk = hasValor && !isNaN(parseFloat(item.valor)) && parseFloat(item.valor) >= 0;
                        
                        const itemValido = materialOk && quantidadeOk && valorOk;
                        
                        console.log(`📦 ITEM ${index}:`, {
                            material: item.material,
                            quantidade: item.quantidade,
                            valor: item.valor,
                            materialOk,
                            quantidadeOk,
                            valorOk,
                            itemValido
                        });
                        
                        itensAnalisados.push({
                            ...item,
                            valido: itemValido
                        });
                    }
                }
            });
            
            const itensValidos = itensAnalisados.filter(item => item.valido);
            
            console.log('📊 RESULTADO FINAL:');
            console.log('   Total de itens com dados:', itensAnalisados.length);
            console.log('   Itens válidos:', itensValidos.length);
            console.log('   Detalhes dos itens válidos:', itensValidos);
            
            if (itensValidos.length === 0) {
                console.log('❌ PROBLEMA: Nenhum item válido encontrado!');
                console.log('🔧 POSSÍVEIS CAUSAS:');
                console.log('   1. Campos não estão sendo preenchidos corretamente');
                console.log('   2. Validação está muito restritiva');
                console.log('   3. Seletores de DOM estão incorretos');
            } else {
                console.log('✅ ITENS VÁLIDOS ENCONTRADOS - DEVERIA FUNCIONAR!');
            }
            
            // Permitir que o submit continue após análise
            setTimeout(() => {
                console.log('🚀 PERMITINDO SUBMIT CONTINUAR...');
                form.removeEventListener('submit', arguments.callee);
                form.submit();
            }, 2000);
        });
        
        console.log('✅ INTERCEPTOR DE SUBMIT CONFIGURADO!');
    } else {
        console.log('❌ FORMULÁRIO NÃO ENCONTRADO!');
    }
}

// Executar testes
console.log('🧪 EXECUTANDO TESTES...');
testValidationLogic();
interceptRealSubmit();

console.log('=' .repeat(60));
console.log('✅ DEBUGGING CONFIGURADO!');
console.log('📋 PRÓXIMOS PASSOS:');
console.log('   1. Preencha o formulário com dados válidos');
console.log('   2. Clique em "Salvar"');
console.log('   3. Observe a análise detalhada no console');
console.log('=' .repeat(60));