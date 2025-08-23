// SCRIPT DE DEBUG PARA VERIFICAR RENDERIZAÇÃO DE COMPONENTES
// Execute no console do navegador (F12) na página /compras/nova

console.log('🔥 INICIANDO DEBUG DE RENDERIZAÇÃO DE COMPONENTES');

// Função para verificar se elementos existem e estão visíveis
function checkElementVisibility(selector, name) {
  const elements = document.querySelectorAll(selector);
  console.log(`📋 ${name}:`, {
    found: elements.length,
    elements: Array.from(elements).map(el => ({
      visible: el.offsetParent !== null,
      display: window.getComputedStyle(el).display,
      visibility: window.getComputedStyle(el).visibility,
      opacity: window.getComputedStyle(el).opacity,
      innerHTML: el.innerHTML.substring(0, 100) + '...'
    }))
  });
  return elements;
}

// Verificar estrutura básica da página
console.log('\n=== VERIFICAÇÃO BÁSICA DA PÁGINA ===');
console.log('URL atual:', window.location.href);
console.log('Título da página:', document.title);

// Verificar se o formulário existe
const forms = checkElementVisibility('form', 'Formulários');

// Verificar campos básicos
console.log('\n=== VERIFICAÇÃO DE CAMPOS BÁSICOS ===');
checkElementVisibility('input[type="date"]', 'Campos de data');
checkElementVisibility('select', 'Campos select');
checkElementVisibility('input[type="text"]', 'Campos de texto');
checkElementVisibility('input[type="number"]', 'Campos numéricos');

// Verificar especificamente MaterialAutocomplete
console.log('\n=== VERIFICAÇÃO DO MATERIALAUTOCOMPLETE ===');
checkElementVisibility('[data-testid*="material"]', 'Elementos com data-testid material');
checkElementVisibility('input[placeholder*="material"]', 'Inputs com placeholder material');
checkElementVisibility('input[placeholder*="Material"]', 'Inputs com placeholder Material');

// Verificar tabela de itens
console.log('\n=== VERIFICAÇÃO DA TABELA DE ITENS ===');
const tables = checkElementVisibility('table', 'Tabelas');
checkElementVisibility('thead', 'Cabeçalhos de tabela');
checkElementVisibility('tbody', 'Corpos de tabela');
checkElementVisibility('tr', 'Linhas de tabela');
checkElementVisibility('td', 'Células de tabela');

// Verificar botões
console.log('\n=== VERIFICAÇÃO DE BOTÕES ===');
checkElementVisibility('button', 'Botões');
checkElementVisibility('button[type="submit"]', 'Botões de submit');
checkElementVisibility('button[type="button"]', 'Botões normais');

// Verificar erros visíveis
console.log('\n=== VERIFICAÇÃO DE ERROS ===');
checkElementVisibility('.text-red-500', 'Textos de erro (text-red-500)');
checkElementVisibility('.text-red-600', 'Textos de erro (text-red-600)');
checkElementVisibility('.border-red-500', 'Bordas de erro (border-red-500)');
checkElementVisibility('[class*="error"]', 'Elementos com classe error');

// Verificar se há elementos React
console.log('\n=== VERIFICAÇÃO DO REACT ===');
const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
console.log('Elementos React encontrados:', reactElements.length);

// Tentar acessar o estado do React (se disponível)
try {
  const reactFiber = document.querySelector('#root')?._reactInternalFiber || 
                    document.querySelector('#root')?._reactInternalInstance;
  console.log('React Fiber/Instance encontrado:', !!reactFiber);
} catch (e) {
  console.log('Não foi possível acessar o estado do React:', e.message);
}

// Verificar console errors
console.log('\n=== VERIFICAÇÃO DE ERROS NO CONSOLE ===');
const originalError = console.error;
let errorCount = 0;
console.error = function(...args) {
  errorCount++;
  console.log(`❌ ERRO ${errorCount}:`, ...args);
  originalError.apply(console, args);
};

// Função para testar preenchimento de campos
function testarPreenchimentoCampos() {
  console.log('\n🧪 TESTANDO PREENCHIMENTO DE CAMPOS');
  
  // Tentar preencher campo de data
  const dateInputs = document.querySelectorAll('input[type="date"]');
  if (dateInputs.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    dateInputs[0].value = today;
    dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Data preenchida:', today);
  }
  
  // Tentar preencher campos de texto
  const textInputs = document.querySelectorAll('input[type="text"]');
  textInputs.forEach((input, index) => {
    if (input.placeholder && input.placeholder.toLowerCase().includes('fornecedor')) {
      input.value = 'Fornecedor Teste';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Campo fornecedor ${index} preenchido`);
    }
  });
  
  // Tentar preencher campos numéricos
  const numberInputs = document.querySelectorAll('input[type="number"]');
  numberInputs.forEach((input, index) => {
    if (input.placeholder && input.placeholder.toLowerCase().includes('quantidade')) {
      input.value = '10';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Campo quantidade ${index} preenchido`);
    }
    if (input.placeholder && input.placeholder.toLowerCase().includes('valor')) {
      input.value = '25.50';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Campo valor ${index} preenchido`);
    }
  });
}

// Função para verificar estado após preenchimento
function verificarEstadoAposPreenchimento() {
  console.log('\n🔍 VERIFICANDO ESTADO APÓS PREENCHIMENTO');
  
  setTimeout(() => {
    // Verificar se apareceram novos erros
    checkElementVisibility('.text-red-500', 'Novos erros (text-red-500)');
    
    // Verificar se campos foram realmente preenchidos
    const filledInputs = Array.from(document.querySelectorAll('input')).filter(input => input.value.trim() !== '');
    console.log('Campos preenchidos:', filledInputs.length);
    
    filledInputs.forEach((input, index) => {
      console.log(`Campo ${index}:`, {
        type: input.type,
        placeholder: input.placeholder,
        value: input.value,
        name: input.name
      });
    });
  }, 1000);
}

console.log('\n🎯 FUNÇÕES DISPONÍVEIS:');
console.log('- testarPreenchimentoCampos(): Tenta preencher campos automaticamente');
console.log('- verificarEstadoAposPreenchimento(): Verifica estado após preenchimento');
console.log('\n✅ DEBUG DE COMPONENTES CONCLUÍDO!');

// Executar teste automático
setTimeout(() => {
  testarPreenchimentoCampos();
  verificarEstadoAposPreenchimento();
}, 2000);