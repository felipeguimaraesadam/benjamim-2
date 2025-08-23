// Teste para verificar se a correção da validação de números infinitos está funcionando

// Simular a função isFinite (disponível nativamente no JavaScript)
function testValidation() {
  console.log('=== TESTE DA CORREÇÃO DE VALIDAÇÃO ===\n');
  
  // Casos de teste
  const testCases = [
    { name: 'Números normais', quantidade: '10', valorUnitario: '25.50' },
    { name: 'Números com vírgula', quantidade: '5,5', valorUnitario: '12,75' },
    { name: 'Números grandes válidos', quantidade: '999999999', valorUnitario: '999999999' },
    { name: 'Valores infinitos', quantidade: 'Infinity', valorUnitario: 'Infinity' },
    { name: 'Valores -infinitos', quantidade: '-Infinity', valorUnitario: '-Infinity' },
    { name: 'Números exponenciais grandes', quantidade: '1e400', valorUnitario: '1e400' },
    { name: 'Strings inválidas', quantidade: 'abc', valorUnitario: 'xyz' },
    { name: 'NaN', quantidade: 'NaN', valorUnitario: 'NaN' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`--- ${testCase.name} ---`);
    console.log(`Input: quantidade="${testCase.quantidade}", valorUnitario="${testCase.valorUnitario}"`);
    
    try {
      // Simular o processamento do frontend
      const quantidade = parseFloat(String(testCase.quantidade).replace(',', '.')) || 0;
      const valor_unitario = parseFloat(String(testCase.valorUnitario).replace(',', '.')) || 0;
      
      console.log(`Após parseFloat: quantidade=${quantidade}, valor_unitario=${valor_unitario}`);
      
      // Aplicar a validação implementada
      if (!isFinite(quantidade) || !isFinite(valor_unitario)) {
        throw new Error('Valores numéricos inválidos detectados. Por favor, verifique os campos de quantidade e valor unitário.');
      }
      
      console.log('✅ PASSOU na validação - valores são finitos');
      
    } catch (error) {
      console.log(`❌ FALHOU na validação: ${error.message}`);
    }
    
    console.log('');
  });
  
  console.log('=== FIM DO TESTE ===');
}

// Executar o teste
testValidation();