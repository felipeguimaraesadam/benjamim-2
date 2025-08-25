// Script de Debug Completo para Página de Compras
// Execute este script no console do navegador na página /compras/nova

console.log('=== INICIANDO DEBUG COMPLETO DA PÁGINA DE COMPRAS ===');

// 1. Verificar URL atual
console.log('1. URL atual:', window.location.href);

// 2. Verificar se o formulário está carregado
const form = document.querySelector('form');
console.log('2. Formulário encontrado:', !!form);

if (!form) {
  console.error('ERRO: Formulário não encontrado na página!');
} else {
  console.log('Formulário HTML:', form.outerHTML.substring(0, 200) + '...');
}

// 3. Verificar campos obrigatórios
const campos = {
  obra: document.querySelector('input[placeholder*="obra"], select[name*="obra"], input[name*="obra"]'),
  dataCompra: document.querySelector('input[type="date"], input[name*="data"]'),
  material: document.querySelector('input[placeholder*="material"], input[name*="material"]'),
  quantidade: document.querySelector('input[type="number"], input[name*="quantidade"]'),
  valorUnitario: document.querySelector('input[name*="valor"], input[placeholder*="valor"]'),
  botaoSalvar: document.querySelector('button[type="submit"], button:contains("Salvar")')
};

console.log('3. Campos encontrados:');
Object.entries(campos).forEach(([nome, elemento]) => {
  console.log(`   ${nome}:`, !!elemento, elemento?.tagName, elemento?.type, elemento?.name, elemento?.placeholder);
});

// 4. Verificar estado inicial dos itens
const itemRows = document.querySelectorAll('[data-testid*="item"], .item-row, tr:has(input)');
console.log('4. Linhas de itens encontradas:', itemRows.length);

// 5. Função para preencher campo
function preencherCampo(elemento, valor) {
  if (!elemento) return false;
  
  // Simular eventos de usuário
  elemento.focus();
  elemento.value = valor;
  
  // Disparar eventos
  elemento.dispatchEvent(new Event('input', { bubbles: true }));
  elemento.dispatchEvent(new Event('change', { bubbles: true }));
  elemento.dispatchEvent(new Event('blur', { bubbles: true }));
  
  return true;
}

// 6. Função para clicar em botão
function clicarBotao(elemento) {
  if (!elemento) return false;
  
  elemento.focus();
  elemento.click();
  return true;
}

// 7. TESTE 1: Submissão de formulário vazio
console.log('\n=== TESTE 1: SUBMISSÃO DE FORMULÁRIO VAZIO ===');
if (campos.botaoSalvar) {
  console.log('Clicando no botão salvar com formulário vazio...');
  clicarBotao(campos.botaoSalvar);
  
  // Aguardar e verificar mensagens de erro
  setTimeout(() => {
    const erros = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error"]');
    console.log('Erros encontrados após submissão vazia:', erros.length);
    erros.forEach((erro, index) => {
      console.log(`   Erro ${index + 1}:`, erro.textContent.trim());
    });
  }, 1000);
} else {
  console.error('ERRO: Botão salvar não encontrado!');
}

// 8. TESTE 2: Preenchimento apenas da obra
setTimeout(() => {
  console.log('\n=== TESTE 2: PREENCHIMENTO APENAS DA OBRA ===');
  
  if (campos.obra) {
    console.log('Preenchendo campo obra...');
    preencherCampo(campos.obra, 'Obra Teste');
    
    if (campos.dataCompra) {
      console.log('Preenchendo data da compra...');
      preencherCampo(campos.dataCompra, '2024-01-15');
    }
    
    // Tentar salvar
    setTimeout(() => {
      if (campos.botaoSalvar) {
        console.log('Clicando no botão salvar com obra preenchida...');
        clicarBotao(campos.botaoSalvar);
        
        setTimeout(() => {
          const erros = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error"]');
          console.log('Erros após preenchimento da obra:', erros.length);
          erros.forEach((erro, index) => {
            console.log(`   Erro ${index + 1}:`, erro.textContent.trim());
          });
        }, 1000);
      }
    }, 500);
  }
}, 2000);

// 9. TESTE 3: Verificar validação de itens parcialmente preenchidos
setTimeout(() => {
  console.log('\n=== TESTE 3: VALIDAÇÃO DE ITENS PARCIAIS ===');
  
  // Tentar preencher apenas material sem quantidade
  if (campos.material) {
    console.log('Preenchendo apenas material...');
    preencherCampo(campos.material, 'Cimento');
    
    setTimeout(() => {
      if (campos.botaoSalvar) {
        console.log('Tentando salvar com material sem quantidade...');
        clicarBotao(campos.botaoSalvar);
        
        setTimeout(() => {
          const erros = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error"]');
          console.log('Erros com item parcial:', erros.length);
          erros.forEach((erro, index) => {
            console.log(`   Erro ${index + 1}:`, erro.textContent.trim());
          });
        }, 1000);
      }
    }, 500);
  }
}, 4000);

// 10. Estado final do formulário
setTimeout(() => {
  console.log('\n=== ESTADO FINAL DO FORMULÁRIO ===');
  
  // Capturar todos os valores dos campos
  const todosInputs = document.querySelectorAll('input, select, textarea');
  console.log('Total de campos:', todosInputs.length);
  
  const valoresFormulario = {};
  todosInputs.forEach((input, index) => {
    const nome = input.name || input.id || input.placeholder || `campo_${index}`;
    valoresFormulario[nome] = input.value;
  });
  
  console.log('Valores do formulário:', valoresFormulario);
  
  // Verificar erros visíveis
  const errosVisiveis = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error"]');
  console.log('\nErros visíveis na página:', errosVisiveis.length);
  errosVisiveis.forEach((erro, index) => {
    console.log(`   Erro ${index + 1}:`, erro.textContent.trim());
  });
  
  console.log('\n=== DEBUG COMPLETO FINALIZADO ===');
}, 6000);