// Teste para reproduzir o problema dos "números infinitos" no navegador
// Cole este código no console do navegador (F12 -> Console)

console.log('=== TESTE DE DEBUG - COMPRA ===');

// Dados de teste simples para criar uma compra
const testCompraData = {
  tipo: 'COMPRA',
  obra: 8, // ID válido encontrado no banco
  data_compra: '2024-01-15',
  data_pagamento: null,
  fornecedor: 'Fornecedor Teste',
  nota_fiscal: 'NF-12345',
  desconto: 0,
  observacoes: 'Teste de compra',
  itens: [
    {
      material: 2, // ID válido encontrado no banco (CIMENTO 50KG)
      quantidade: 10,
      valor_unitario: 5.50,
      categoria_uso: null
    }
  ],
  pagamento_parcelado: JSON.stringify({
    tipo: 'UNICO',
    parcelas: []
  }),
  anexos: []
};

console.log('Dados a serem enviados:', testCompraData);

// Função para testar a criação de compra usando fetch diretamente
async function testCreateCompraFetch() {
  try {
    console.log('Iniciando teste de criação de compra com fetch...');
    
    // Preparar FormData como faz a função prepareCompraFormData
    const formData = new FormData();
    
    // Append simple key-value pairs
    Object.keys(testCompraData).forEach(key => {
      if (key === 'itens' || key === 'parcelas' || key === 'anexos' || key === 'anexos_a_remover') {
        return;
      }
      if (testCompraData[key] !== null && testCompraData[key] !== undefined) {
        formData.append(key, testCompraData[key]);
      }
    });
    
    // Append complex data as JSON strings
    if (testCompraData.itens) {
      formData.append('itens', JSON.stringify(testCompraData.itens));
    }
    
    console.log('FormData preparado');
    
    // Fazer a requisição
    const token = localStorage.getItem('accessToken');
    const response = await fetch('http://localhost:8000/api/compras/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      console.log('✅ Compra criada com sucesso');
      try {
        const responseData = JSON.parse(responseText);
        console.log('Response data:', responseData);
      } catch {
        console.log('Response não é JSON válido');
      }
    } else {
      console.error('❌ Erro ao criar compra');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
    }
  } catch (error) {
    console.log('❌ Erro ao fazer requisição:', error);
  }
}

// Executar o teste
testCreateCompraFetch();

// Instruções para o usuário
console.log('\n=== INSTRUÇÕES ===');
console.log('1. Abra http://localhost:5173 no navegador');
console.log('2. Faça login no sistema');
console.log('3. Abra o DevTools (F12)');
console.log('4. Vá para a aba Console');
console.log('5. Cole este código e pressione Enter');
console.log('6. Observe os logs para identificar o problema dos "números infinitos"');
console.log('\n=== DADOS USADOS NO TESTE ===');
console.log('- Obra ID: 8');
console.log('- Material ID: 2 (CIMENTO 50KG)');
console.log('- Quantidade: 10');
console.log('- Valor unitário: 5.50');