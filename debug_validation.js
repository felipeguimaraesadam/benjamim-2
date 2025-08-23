// 🧪 SCRIPT DE DEBUG PARA VALIDAÇÃO DE COMPRA
// Execute este script no console do navegador na página: http://localhost:5173/compras/nova

console.log('🧪 INICIANDO DEBUG DA VALIDAÇÃO');

// Função para simular a lógica de validação do CompraForm
function simulateValidation(items, obraId, dataCompra) {
    console.log('🔍 SIMULAÇÃO: Iniciando validateForm com items:', items);
    const newErrors = {};
    
    // Validar campos obrigatórios
    if (!obraId) newErrors.obraId = 'Obra é obrigatória.';
    if (!dataCompra) newErrors.dataCompra = 'Data da compra é obrigatória.';
    
    // Validar itens - MESMA LÓGICA DO COMPRAFORM
    let hasAtLeastOneValidItem = false;
    let hasAnyFilledField = false;
    
    items.forEach((item, index) => {
        const materialIsSet = !!(item.material && item.material.id) || !!(item.materialId && item.materialId.trim());
        const quantidadeStr = String(item.quantidade || '').replace(',', '.').trim();
        const valorUnitarioStr = String(item.valorUnitario || '').replace(',', '.').trim();
        const quantidadeIsSet = quantidadeStr !== '';
        const valorUnitarioIsSet = valorUnitarioStr !== '';
        
        console.log(`🔍 SIMULAÇÃO Item ${index}:`, {
            materialIsSet,
            quantidadeIsSet,
            valorUnitarioIsSet,
            material: item.material,
            materialId: item.materialId,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario
        });
        
        // Se qualquer campo foi preenchido, o item deve estar completo
        if (materialIsSet || quantidadeIsSet || valorUnitarioIsSet) {
            hasAnyFilledField = true;
            
            // Validar material
            if (!materialIsSet) {
                newErrors[`item_${index}_material`] = 'Material é obrigatório.';
            }
            
            // Validar quantidade
            if (!quantidadeIsSet || parseFloat(quantidadeStr) <= 0) {
                newErrors[`item_${index}_quantidade`] = 'Quantidade deve ser positiva.';
            }
            
            // Validar valor unitário
            if (!valorUnitarioIsSet || parseFloat(valorUnitarioStr) < 0) {
                newErrors[`item_${index}_valorUnitario`] = 'Valor unitário deve ser positivo ou zero.';
            }
            
            // Item é válido se todos os campos estão preenchidos corretamente
            if (materialIsSet && quantidadeIsSet && valorUnitarioIsSet && 
                parseFloat(quantidadeStr) > 0 && parseFloat(valorUnitarioStr) >= 0) {
                hasAtLeastOneValidItem = true;
            }
        }
    });
    
    // CORREÇÃO CRÍTICA: Sempre exigir pelo menos um item válido
    if (!hasAtLeastOneValidItem) {
        newErrors.form = 'Uma compra deve ter pelo menos um item válido com material, quantidade e valor unitário preenchidos.';
        console.log('🔍 SIMULAÇÃO: Nenhum item válido encontrado!');
    } else {
        console.log('🔍 SIMULAÇÃO: Pelo menos um item válido encontrado!');
    }
    
    console.log('🔍 SIMULAÇÃO: Erros encontrados:', newErrors);
    return Object.keys(newErrors).length === 0;
}

// Testes de cenários
console.log('\n🧪 TESTE 1: Compra completamente vazia');
const teste1 = simulateValidation([], null, null);
console.log('Resultado:', teste1 ? '✅ PASSOU (ERRO!)' : '❌ FALHOU (CORRETO)');

console.log('\n🧪 TESTE 2: Compra com campos obrigatórios, mas sem itens');
const teste2 = simulateValidation([], 1, '2024-01-15');
console.log('Resultado:', teste2 ? '✅ PASSOU (ERRO!)' : '❌ FALHOU (CORRETO)');

console.log('\n🧪 TESTE 3: Compra com item vazio inicial');
const itemVazio = {
    material: null,
    materialId: '',
    quantidade: '',
    valorUnitario: ''
};
const teste3 = simulateValidation([itemVazio], 1, '2024-01-15');
console.log('Resultado:', teste3 ? '✅ PASSOU (ERRO!)' : '❌ FALHOU (CORRETO)');

console.log('\n🧪 TESTE 4: Compra com item parcialmente preenchido');
const itemParcial = {
    material: { id: 1, nome: 'Cimento' },
    materialId: '1',
    quantidade: '',
    valorUnitario: ''
};
const teste4 = simulateValidation([itemParcial], 1, '2024-01-15');
console.log('Resultado:', teste4 ? '✅ PASSOU (ERRO!)' : '❌ FALHOU (CORRETO)');

console.log('\n🧪 TESTE 5: Compra com item válido');
const itemValido = {
    material: { id: 1, nome: 'Cimento' },
    materialId: '1',
    quantidade: '10',
    valorUnitario: '5.50'
};
const teste5 = simulateValidation([itemValido], 1, '2024-01-15');
console.log('Resultado:', teste5 ? '✅ PASSOU (CORRETO)' : '❌ FALHOU (ERRO!)');

console.log('\n🧪 TESTE 6: Compra com item válido + item vazio');
const teste6 = simulateValidation([itemValido, itemVazio], 1, '2024-01-15');
console.log('Resultado:', teste6 ? '✅ PASSOU (CORRETO)' : '❌ FALHOU (ERRO!)');

console.log('\n📊 RESUMO DOS TESTES:');
console.log('- Teste 1 (vazia):', teste1 ? '❌ ERRO' : '✅ OK');
console.log('- Teste 2 (sem itens):', teste2 ? '❌ ERRO' : '✅ OK');
console.log('- Teste 3 (item vazio):', teste3 ? '❌ ERRO' : '✅ OK');
console.log('- Teste 4 (item parcial):', teste4 ? '❌ ERRO' : '✅ OK');
console.log('- Teste 5 (item válido):', teste5 ? '✅ OK' : '❌ ERRO');
console.log('- Teste 6 (válido + vazio):', teste6 ? '✅ OK' : '❌ ERRO');

// Função para testar no formulário real
function testRealForm() {
    console.log('\n🔍 TESTANDO FORMULÁRIO REAL');
    
    // Tentar encontrar o botão de salvar
    const saveButton = document.querySelector('button[type="submit"]');
    if (!saveButton) {
        console.log('❌ Botão de salvar não encontrado');
        return;
    }
    
    console.log('✅ Botão de salvar encontrado:', saveButton);
    
    // Verificar se há campos preenchidos
    const obraSelect = document.querySelector('select');
    const dataInput = document.querySelector('input[type="date"]');
    const materialInputs = document.querySelectorAll('input[placeholder*="material"], input[placeholder*="Material"]');
    
    console.log('📋 Estado atual do formulário:');
    console.log('- Obra selecionada:', obraSelect ? obraSelect.value : 'não encontrada');
    console.log('- Data preenchida:', dataInput ? dataInput.value : 'não encontrada');
    console.log('- Inputs de material encontrados:', materialInputs.length);
    
    // Simular clique no botão salvar
    console.log('🔄 Simulando clique no botão salvar...');
    saveButton.click();
    
    // Aguardar um pouco e verificar erros
    setTimeout(() => {
        const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, .border-red-500, [class*="error"]');
        console.log('🔍 Elementos de erro encontrados:', errorElements.length);
        
        errorElements.forEach((el, index) => {
            if (el.textContent.trim()) {
                console.log(`   ${index + 1}. ${el.textContent.trim()}`);
            }
        });
        
        if (errorElements.length === 0) {
            console.log('❌ PROBLEMA: Nenhum erro de validação encontrado!');
        } else {
            console.log('✅ Validação funcionando: erros encontrados');
        }
    }, 500);
}

// Disponibilizar função para teste manual
window.debugValidation = {
    simulate: simulateValidation,
    testReal: testRealForm
};

console.log('\n🛠️ FUNÇÕES DISPONÍVEIS:');
console.log('- debugValidation.simulate(items, obraId, dataCompra) - Simular validação');
console.log('- debugValidation.testReal() - Testar formulário real');
console.log('\n💡 Execute: debugValidation.testReal() para testar o formulário atual');