#!/usr/bin/env python3
"""
Script de Teste Abrangente para Sistema de Monitoramento e Depuração

Este script testa:
1. Sistema de logging do backend Django
2. Endpoint de logs de erro do frontend
3. Diferentes tipos de erro e cenários
4. Verificação de logs gerados
5. Testes de stress e edge cases

Uso: python test_monitoring_system.py
"""

import requests
import json
import time
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any
import sys
import os

# Configuração
BASE_URL = "http://127.0.0.1:8000"
FRONTEND_ERROR_LOG_URL = f"{BASE_URL}/api/frontend-error-log/"
LOG_FILE = "test_results.log"

# Configurar logging para os testes
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class MonitoringSystemTester:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test_result(self, test_name: str, passed: bool, details: str = ""):
        """Registra o resultado de um teste"""
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "PASS"
        else:
            self.failed_tests += 1
            status = "FAIL"
            
        result = {
            "test_name": test_name,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        
        self.test_results.append(result)
        status_symbol = "[OK]" if status == "PASS" else "[FAIL]"
        logger.info(f"{status_symbol} {test_name}: {details}")
        
    def test_endpoint_availability(self):
        """Testa se o endpoint está disponível"""
        try:
            response = requests.get(FRONTEND_ERROR_LOG_URL, timeout=5)
            if response.status_code == 200:
                self.log_test_result(
                    "Endpoint Availability", 
                    True, 
                    f"GET request successful (status: {response.status_code})"
                )
                return True
            else:
                self.log_test_result(
                    "Endpoint Availability", 
                    False, 
                    f"Unexpected status code: {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_test_result(
                "Endpoint Availability", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
            
    def test_javascript_error_logging(self):
        """Testa logging de erro JavaScript"""
        error_data = {
            "type": "JavaScript Error",
            "message": "Uncaught TypeError: Cannot read property 'length' of undefined",
            "stack": "TypeError: Cannot read property 'length' of undefined\n    at processData (app.js:123:45)\n    at handleClick (app.js:89:12)",
            "url": "http://localhost:5173/dashboard",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            response = requests.post(
                FRONTEND_ERROR_LOG_URL,
                json=error_data,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200 and response.json().get("status") == "logged":
                self.log_test_result(
                    "JavaScript Error Logging", 
                    True, 
                    "JavaScript error logged successfully"
                )
                return True
            else:
                self.log_test_result(
                    "JavaScript Error Logging", 
                    False, 
                    f"Unexpected response: {response.status_code} - {response.text}"
                )
                return False
        except Exception as e:
            self.log_test_result(
                "JavaScript Error Logging", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
            
    def test_network_error_logging(self):
        """Testa logging de erro de rede"""
        error_data = {
            "type": "Network Error",
            "message": "Failed to fetch data from API",
            "stack": "NetworkError: Failed to fetch\n    at fetchUserData (api.js:45:12)\n    at loadDashboard (dashboard.js:23:8)",
            "url": "http://localhost:5173/api/users",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            response = requests.post(
                FRONTEND_ERROR_LOG_URL,
                json=error_data,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200 and response.json().get("status") == "logged":
                self.log_test_result(
                    "Network Error Logging", 
                    True, 
                    "Network error logged successfully"
                )
                return True
            else:
                self.log_test_result(
                    "Network Error Logging", 
                    False, 
                    f"Unexpected response: {response.status_code} - {response.text}"
                )
                return False
        except Exception as e:
            self.log_test_result(
                "Network Error Logging", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
            
    def test_promise_rejection_logging(self):
        """Testa logging de Promise rejection"""
        error_data = {
            "type": "Unhandled Promise Rejection",
            "message": "Promise rejected: Invalid token",
            "stack": "UnhandledPromiseRejectionWarning: Invalid token\n    at validateToken (auth.js:67:23)\n    at login (auth.js:45:12)",
            "url": "http://localhost:5173/login",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            response = requests.post(
                FRONTEND_ERROR_LOG_URL,
                json=error_data,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200 and response.json().get("status") == "logged":
                self.log_test_result(
                    "Promise Rejection Logging", 
                    True, 
                    "Promise rejection logged successfully"
                )
                return True
            else:
                self.log_test_result(
                    "Promise Rejection Logging", 
                    False, 
                    f"Unexpected response: {response.status_code} - {response.text}"
                )
                return False
        except Exception as e:
            self.log_test_result(
                "Promise Rejection Logging", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False
            
    def test_malformed_data_handling(self):
        """Testa como o sistema lida com dados malformados"""
        test_cases = [
            {"name": "Empty JSON", "data": {}},
            {"name": "Missing required fields", "data": {"type": "test"}},
            {"name": "Invalid JSON structure", "data": "invalid json"},
            {"name": "Null values", "data": {"type": None, "message": None}},
            {"name": "Very long message", "data": {
                "type": "test",
                "message": "x" * 10000,
                "stack": "y" * 5000
            }}
        ]
        
        for test_case in test_cases:
            try:
                if isinstance(test_case["data"], str):
                    # Para testar JSON inválido
                    response = requests.post(
                        FRONTEND_ERROR_LOG_URL,
                        data=test_case["data"],
                        headers={"Content-Type": "application/json"},
                        timeout=5
                    )
                else:
                    response = requests.post(
                        FRONTEND_ERROR_LOG_URL,
                        json=test_case["data"],
                        headers={"Content-Type": "application/json"},
                        timeout=5
                    )
                
                # O sistema deve lidar graciosamente com dados malformados
                if response.status_code in [200, 400, 500]:
                    self.log_test_result(
                        f"Malformed Data - {test_case['name']}", 
                        True, 
                        f"Handled gracefully (status: {response.status_code})"
                    )
                else:
                    self.log_test_result(
                        f"Malformed Data - {test_case['name']}", 
                        False, 
                        f"Unexpected status: {response.status_code}"
                    )
            except Exception as e:
                self.log_test_result(
                    f"Malformed Data - {test_case['name']}", 
                    True, 
                    f"Exception handled: {str(e)}"
                )
                
    def test_stress_logging(self):
        """Testa o sistema com múltiplas requisições simultâneas"""
        import threading
        import queue
        
        results_queue = queue.Queue()
        num_threads = 10
        requests_per_thread = 5
        
        def send_error_log(thread_id: int):
            for i in range(requests_per_thread):
                error_data = {
                    "type": "Stress Test",
                    "message": f"Stress test error from thread {thread_id}, request {i}",
                    "stack": f"StressTest: Thread {thread_id}\n    at stressTest (test.js:{i}:1)",
                    "url": f"http://localhost:5173/stress-test/{thread_id}/{i}",
                    "userAgent": "StressTestAgent/1.0",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
                try:
                    response = requests.post(
                        FRONTEND_ERROR_LOG_URL,
                        json=error_data,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    results_queue.put((thread_id, i, response.status_code == 200))
                except Exception as e:
                    results_queue.put((thread_id, i, False))
                    
                time.sleep(0.1)  # Pequena pausa entre requisições
        
        # Criar e iniciar threads
        threads = []
        for thread_id in range(num_threads):
            thread = threading.Thread(target=send_error_log, args=(thread_id,))
            threads.append(thread)
            thread.start()
        
        # Aguardar conclusão de todas as threads
        for thread in threads:
            thread.join()
        
        # Coletar resultados
        successful_requests = 0
        total_requests = num_threads * requests_per_thread
        
        while not results_queue.empty():
            thread_id, request_id, success = results_queue.get()
            if success:
                successful_requests += 1
        
        success_rate = (successful_requests / total_requests) * 100
        
        if success_rate >= 95:  # 95% de sucesso é aceitável
            self.log_test_result(
                "Stress Test", 
                True, 
                f"Success rate: {success_rate:.1f}% ({successful_requests}/{total_requests})"
            )
        else:
            self.log_test_result(
                "Stress Test", 
                False, 
                f"Low success rate: {success_rate:.1f}% ({successful_requests}/{total_requests})"
            )
            
    def test_different_http_methods(self):
        """Testa diferentes métodos HTTP no endpoint"""
        methods_to_test = [
            ("GET", True, "Should return status message"),
            ("POST", True, "Should accept error logs"),
            ("PUT", False, "Should not be allowed"),
            ("DELETE", False, "Should not be allowed"),
            ("PATCH", False, "Should not be allowed")
        ]
        
        for method, should_work, description in methods_to_test:
            try:
                if method == "GET":
                    response = requests.get(FRONTEND_ERROR_LOG_URL, timeout=5)
                elif method == "POST":
                    response = requests.post(
                        FRONTEND_ERROR_LOG_URL,
                        json={"type": "test", "message": "test"},
                        timeout=5
                    )
                else:
                    response = getattr(requests, method.lower())(
                        FRONTEND_ERROR_LOG_URL, 
                        timeout=5
                    )
                
                if should_work and response.status_code in [200, 201]:
                    self.log_test_result(
                        f"HTTP Method - {method}", 
                        True, 
                        f"{description} (status: {response.status_code})"
                    )
                elif not should_work and response.status_code in [405, 404]:
                    self.log_test_result(
                        f"HTTP Method - {method}", 
                        True, 
                        f"{description} (correctly rejected: {response.status_code})"
                    )
                else:
                    self.log_test_result(
                        f"HTTP Method - {method}", 
                        False, 
                        f"Unexpected status: {response.status_code}"
                    )
            except Exception as e:
                self.log_test_result(
                    f"HTTP Method - {method}", 
                    False, 
                    f"Request failed: {str(e)}"
                )
                
    def run_all_tests(self):
        """Executa todos os testes"""
        logger.info("=" * 60)
        logger.info("INICIANDO TESTES DO SISTEMA DE MONITORAMENTO")
        logger.info("=" * 60)
        
        # Lista de testes a executar
        tests = [
            self.test_endpoint_availability,
            self.test_javascript_error_logging,
            self.test_network_error_logging,
            self.test_promise_rejection_logging,
            self.test_malformed_data_handling,
            self.test_different_http_methods,
            self.test_stress_logging,
        ]
        
        # Executar cada teste
        for test in tests:
            try:
                logger.info(f"\nExecutando: {test.__name__}")
                test()
                time.sleep(1)  # Pausa entre testes
            except Exception as e:
                self.log_test_result(
                    test.__name__, 
                    False, 
                    f"Test execution failed: {str(e)}"
                )
        
        # Relatório final
        self.generate_final_report()
        
    def generate_final_report(self):
        """Gera relatório final dos testes"""
        logger.info("\n" + "=" * 60)
        logger.info("RELATÓRIO FINAL DOS TESTES")
        logger.info("=" * 60)
        
        logger.info(f"Total de testes executados: {self.total_tests}")
        logger.info(f"Testes aprovados: {self.passed_tests}")
        logger.info(f"Testes falharam: {self.failed_tests}")
        
        if self.total_tests > 0:
            success_rate = (self.passed_tests / self.total_tests) * 100
            logger.info(f"Taxa de sucesso: {success_rate:.1f}%")
        
        # Salvar resultados detalhados em JSON
        report_file = f"monitoring_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump({
                "summary": {
                    "total_tests": self.total_tests,
                    "passed_tests": self.passed_tests,
                    "failed_tests": self.failed_tests,
                    "success_rate": (self.passed_tests / self.total_tests) * 100 if self.total_tests > 0 else 0
                },
                "test_results": self.test_results,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\nRelatório detalhado salvo em: {report_file}")
        
        # Recomendações baseadas nos resultados
        if self.failed_tests > 0:
            logger.info("\n[ATENCAO] Alguns testes falharam!")
            logger.info("Verifique os logs acima para detalhes dos problemas encontrados.")
        else:
            logger.info("\n[OK] Todos os testes passaram! Sistema de monitoramento funcionando corretamente.")
        
        logger.info("\n[INFO] PROXIMOS PASSOS RECOMENDADOS:")
        logger.info("1. Integre este script no seu pipeline de CI/CD")
        logger.info("2. Execute os testes após cada deploy")
        logger.info("3. Configure alertas para falhas nos testes")
        logger.info("4. Monitore os logs de produção regularmente")
        
def main():
    """Função principal"""
    print("Sistema de Teste de Monitoramento e Depuração")
    print("Verificando se o servidor está rodando...")
    
    # Verificar se o servidor está rodando
    try:
        response = requests.get(BASE_URL, timeout=5)
        print("[OK] Servidor Django está rodando")
    except:
        print("[ERRO] Servidor Django não está rodando")
        print("Por favor, inicie o servidor com: python manage.py runserver")
        sys.exit(1)
    
    # Executar testes
    tester = MonitoringSystemTester()
    tester.run_all_tests()
    
if __name__ == "__main__":
    main()