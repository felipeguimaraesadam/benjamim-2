// Automated test script for material selection issue
// Run this in browser console when the form is open

class MaterialSelectionTester {
  constructor() {
    this.results = [];
    this.testMaterial = {
      id: 1,
      nome: "TESTE AREIA",
      unidade_medida: "m³",
      categoria_uso_padrao: "CONSUMO"
    };
  }

  log(message, data = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔍 TEST: ${message}`, data);
    this.results.push({
      timestamp,
      message,
      data: JSON.stringify(data)
    });
  }

  async findMaterialAutocomplete() {
    // Find the first material autocomplete input
    const inputs = document.querySelectorAll('[id^="material-input-"]');
    if (inputs.length === 0) {
      throw new Error('No material autocomplete inputs found');
    }
    return inputs[0];
  }

  async simulateTyping(input, text) {
    this.log('Starting typing simulation', text);
    
    // Focus the input
    input.focus();
    input.value = '';
    
    // Type each character
    for (let char of text) {
      input.value += char;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await this.delay(50);
    }
    
    this.log('Typing completed', input.value);
  }

  async simulateKeyPress(input, key) {
    this.log('Simulating key press', key);
    
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    });
    
    input.dispatchEvent(event);
    
    // Wait for any async operations
    await this.delay(100);
    
    this.log('Key press completed', key);
  }

  async waitForSuggestions() {
    this.log('Waiting for suggestions to appear');
    
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const suggestions = document.querySelectorAll('[id^="suggestions-list-"] li');
      if (suggestions.length > 0) {
        this.log('Suggestions found', suggestions.length);
        return suggestions;
      }
      
      await this.delay(200);
      attempts++;
    }
    
    throw new Error('No suggestions appeared after waiting');
  }

  async highlightFirstSuggestion() {
    this.log('Highlighting first suggestion');
    
    const suggestions = await this.waitForSuggestions();
    if (suggestions.length > 0) {
      // Arrow down to highlight first suggestion
      const input = await this.findMaterialAutocomplete();
      await this.simulateKeyPress(input, 'ArrowDown');
      this.log('First suggestion highlighted');
    }
  }

  async getCurrentState() {
    // Get current form state
    const debugPanel = document.querySelector('.fixed.top-4.right-4');
    const items = window.__FORM_ITEMS__ || [];
    const errors = window.__FORM_ERRORS__ || {};
    
    return {
      items: items,
      errors: errors,
      materialError: errors['item_0_material'] || null,
      firstItemMaterial: items[0]?.material?.nome || null,
      firstItemMaterialId: items[0]?.materialId || null
    };
  }

  async runTest(name, testFunction) {
    this.log(`Starting test: ${name}`);
    
    try {
      const initialState = await this.getCurrentState();
      this.log('Initial state', initialState);
      
      await testFunction();
      
      // Wait for state to settle
      await this.delay(500);
      
      const finalState = await this.getCurrentState();
      this.log('Final state', finalState);
      
      const success = !finalState.materialError && finalState.firstItemMaterial;
      
      this.log(`Test ${name} completed`, {
        success,
        initial: initialState,
        final: finalState
      });
      
      return success;
    } catch (error) {
      this.log(`Test ${name} failed`, error.message);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllTests() {
    console.clear();
    this.log('Starting comprehensive material selection tests');
    
    try {
      // Test 1: Manual click selection
      const test1 = await this.runTest('Manual Click Selection', async () => {
        const input = await this.findMaterialAutocomplete();
        await this.simulateTyping(input, 'areia');
        await this.delay(1000);
        
        const suggestions = await this.waitForSuggestions();
        if (suggestions.length > 0) {
          suggestions[0].click();
        }
      });

      // Test 2: Enter key selection
      const test2 = await this.runTest('Enter Key Selection', async () => {
        const input = await this.findMaterialAutocomplete();
        await this.simulateTyping(input, 'areia');
        await this.delay(1000);
        
        await this.highlightFirstSuggestion();
        const input2 = await this.findMaterialAutocomplete();
        await this.simulateKeyPress(input2, 'Enter');
      });

      // Test 3: Tab key selection
      const test3 = await this.runTest('Tab Key Selection', async () => {
        const input = await this.findMaterialAutocomplete();
        await this.simulateTyping(input, 'areia');
        await this.delay(1000);
        
        await this.highlightFirstSuggestion();
        const input2 = await this.findMaterialAutocomplete();
        await this.simulateKeyPress(input2, 'Tab');
      });

      // Summary
      this.log('All tests completed', {
        manualClick: test1,
        enterKey: test2,
        tabKey: test3
      });

      console.table([
        { test: 'Manual Click', success: test1 },
        { test: 'Enter Key', success: test2 },
        { test: 'Tab Key', success: test3 }
      ]);

      return { test1, test2, test3 };

    } catch (error) {
      this.log('Test suite failed', error.message);
      return { error: error.message };
    }
  }

  // Quick test function for immediate debugging
  async quickTest() {
    console.log('🔍 QUICK TEST: Running immediate debug test');
    
    // Expose state globally for debugging
    window.__DEBUG_MATERIAL__ = {
      getCurrentState: this.getCurrentState.bind(this),
      runTest: this.runTest.bind(this),
      tester: this
    };
    
    console.log('🔍 Debug functions available:');
    console.log('window.__DEBUG_MATERIAL__.getCurrentState()');
    console.log('window.__DEBUG_MATERIAL__.runTest("testName", asyncFunction)');
    console.log('window.__DEBUG_MATERIAL__.tester.runAllTests()');
  }
}

// Global test runner
window.runMaterialTests = async () => {
  const tester = new MaterialSelectionTester();
  return await tester.runAllTests();
};

// Quick debug
window.quickMaterialDebug = async () => {
  const tester = new MaterialSelectionTester();
  await tester.quickTest();
};

console.log('🔍 Material Selection Test Suite loaded!');
console.log('Run: window.runMaterialTests() for full test suite');
console.log('Run: window.quickMaterialDebug() for quick debug');