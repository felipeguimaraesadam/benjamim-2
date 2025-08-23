// Teste para verificar processamento de números no frontend
// Simula o comportamento do itemsReducer e funções de processamento

// Simular o itemsReducer
const ITEM_ACTION_TYPES = {
  UPDATE_ITEM_FIELD: 'UPDATE_ITEM_FIELD'
};

const itemsReducer = (state, action) => {
  switch (action.type) {
    case ITEM_ACTION_TYPES.UPDATE_ITEM_FIELD:
      return state.map((item, i) => {
        if (i === action.payload.index) {
          let processedValue = action.payload.value;
          if (
            action.payload.fieldName === 'valorUnitario' ||
            action.payload.fieldName === 'quantidade'
          ) {
            processedValue =
              typeof action.payload.value === 'string'
                ? action.payload.value.replace(',', '.')
                : action.payload.value;
          }
          const newItem = {
            ...item,
            [action.payload.fieldName]: processedValue,
          };
          if (
            action.payload.fieldName === 'quantidade' ||
            action.payload.fieldName === 'valorUnitario'
          ) {
            const qty = parseFloat(newItem.quantidade) || 0;
            const price = parseFloat(newItem.valorUnitario) || 0;
            newItem.valorTotalItem = (qty * price).toFixed(2);
          }
          return newItem;
        }
        return item;
      });
    default:
      return state;
  }
};

// Simular o processamento no handleSubmit
const processItemsForSubmit = (items) => {
  return items.map(item => ({
    quantidade: parseFloat(String(item.quantidade).replace(',', '.')) || 0,
    valor_unitario: parseFloat(String(item.valorUnitario).replace(',', '.')) || 0,
  }));
};

// Casos de teste
const testCases = [
  {
    name: "Caso Normal",
    input: { quantidade: "10", valorUnitario: "25.50" }
  },
  {
    name: "Caso com Vírgula",
    input: { quantidade: "5,5", valorUnitario: "12,75" }
  },
  {
    name: "Caso com Números Grandes",
    input: { quantidade: "999999999", valorUnitario: "999999999" }
  },
  {
    name: "Caso com Números Muito Grandes",
    input: { quantidade: "9999999999999999999", valorUnitario: "9999999999999999999" }
  },
  {
    name: "Caso com String Inválida",
    input: { quantidade: "abc", valorUnitario: "xyz" }
  },
  {
    name: "Caso com Infinity",
    input: { quantidade: "Infinity", valorUnitario: "Infinity" }
  },
  {
    name: "Caso com -Infinity",
    input: { quantidade: "-Infinity", valorUnitario: "-Infinity" }
  },
  {
    name: "Caso com NaN",
    input: { quantidade: "NaN", valorUnitario: "NaN" }
  },
  {
    name: "Caso com Divisão por Zero",
    input: { quantidade: String(1/0), valorUnitario: String(1/0) }
  },
  {
    name: "Caso com Número Exponencial",
    input: { quantidade: "1e308", valorUnitario: "1e308" }
  },
  {
    name: "Caso com Número Exponencial Maior",
    input: { quantidade: "1e400", valorUnitario: "1e400" }
  }
];

console.log("=== TESTE DE PROCESSAMENTO DE NÚMEROS NO FRONTEND ===");
console.log();

testCases.forEach((testCase) => {
  console.log(`\n--- ${testCase.name} ---`);
  console.log(`Input: quantidade="${testCase.input.quantidade}", valorUnitario="${testCase.input.valorUnitario}"`);
  
  // Estado inicial
  const initialState = [{
    id: 1,
    quantidade: '',
    valorUnitario: '',
    valorTotalItem: '0.00'
  }];
  
  // Simular mudança na quantidade
  let state = itemsReducer(initialState, {
    type: ITEM_ACTION_TYPES.UPDATE_ITEM_FIELD,
    payload: { index: 0, fieldName: 'quantidade', value: testCase.input.quantidade }
  });
  
  // Simular mudança no valor unitário
  state = itemsReducer(state, {
    type: ITEM_ACTION_TYPES.UPDATE_ITEM_FIELD,
    payload: { index: 0, fieldName: 'valorUnitario', value: testCase.input.valorUnitario }
  });
  
  console.log(`Após processamento no reducer:`);
  console.log(`  quantidade: "${state[0].quantidade}"`);
  console.log(`  valorUnitario: "${state[0].valorUnitario}"`);
  console.log(`  valorTotalItem: "${state[0].valorTotalItem}"`);
  
  // Simular processamento para envio
  const processedForSubmit = processItemsForSubmit(state);
  console.log(`Após processamento para envio:`);
  console.log(`  quantidade: ${processedForSubmit[0].quantidade}`);
  console.log(`  valor_unitario: ${processedForSubmit[0].valor_unitario}`);
  
  // Verificar se são números infinitos
  const isQuantidadeInfinite = !isFinite(processedForSubmit[0].quantidade);
  const isValorInfinite = !isFinite(processedForSubmit[0].valor_unitario);
  
  if (isQuantidadeInfinite || isValorInfinite) {
    console.log(`⚠️  PROBLEMA DETECTADO: Números infinitos ou inválidos!`);
    console.log(`  quantidade é finito: ${isFinite(processedForSubmit[0].quantidade)}`);
    console.log(`  valor_unitario é finito: ${isFinite(processedForSubmit[0].valor_unitario)}`);
  } else {
    console.log(`✅ Números processados corretamente`);
  }
});

console.log("\n=== FIM DOS TESTES ===");