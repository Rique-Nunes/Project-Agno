import requests
import json

# --- CONFIGURAÇÃO ---
# Por favor, preencha as três variáveis abaixo com os dados do seu Zabbix.
ZABBIX_API_URL = "http://34.59.147.198/zabbix/api_jsonrpc.php"  # Ex: "http://192.168.1.100/zabbix/api_jsonrpc.php"
ZABBIX_API_TOKEN = "b46cace5385ab46e087e8bb76d5b525be31264f7da19ab84d513da60bcf053a0"             # Token gerado na interface do Zabbix
HOST_NAME_TO_INSPECT = "srvprojeto"                     # O nome exato do host que queremos inspecionar

def call_zabbix_api(url, token, method, params):
    """Função genérica para chamar a API do Zabbix."""
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "auth": token,
        "id": 1
    }
    headers = {'Content-Type': 'application/json-rpc'}
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if 'error' in result:
            err_msg = result['error']['data']
            print(f"Erro na API Zabbix: {err_msg}")
            return None
            
        return result.get('result')
        
    except requests.exceptions.RequestException as e:
        print(f"Erro de conexão com a API Zabbix: {e}")
        return None

def main():
    """Função principal do script."""
    print("Iniciando extrator de dados do Zabbix...")

    if "seu-zabbix-url" in ZABBIX_API_URL or "seu_token" in ZABBIX_API_TOKEN:
        print("\n!!! ATENÇÃO !!!")
        print("Por favor, edite o script e preencha as variáveis ZABBIX_API_URL e ZABBIX_API_TOKEN.")
        return

    # 1. Encontrar o ID do host que queremos inspecionar
    print(f"Buscando pelo host: '{HOST_NAME_TO_INSPECT}'...")
    hosts = call_zabbix_api(ZABBIX_API_URL, ZABBIX_API_TOKEN, "host.get", {
        "output": ["hostid", "name"],
        "filter": {"host": [HOST_NAME_TO_INSPECT]}
    })

    if not hosts:
        print(f"Host '{HOST_NAME_TO_INSPECT}' não encontrado. Verifique o nome e tente novamente.")
        return
        
    host_id = hosts[0]['hostid']
    print(f"Host encontrado! ID: {host_id}")

    # 2. Obter TODOS os itens para este host
    print("Buscando todos os 'Itens' para este host...")
    items = call_zabbix_api(ZABBIX_API_URL, ZABBIX_API_TOKEN, "item.get", {
        "output": "extend",
        "hostids": host_id,
        "sortfield": "name"
    })

    if items is not None:
        print(f"Encontrado(s) {len(items)} item(ns). Salvando em 'items.json'...")
        with open('items.json', 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=4, ensure_ascii=False)
        print("Arquivo 'items.json' salvo com sucesso!")

    # 3. Obter TODAS as triggers para este host
    print("\nBuscando todas as 'Triggers' para este host...")
    triggers = call_zabbix_api(ZABBIX_API_URL, ZABBIX_API_TOKEN, "trigger.get", {
        "output": "extend",
        "hostids": host_id,
        "sortfield": "description"
    })

    if triggers is not None:
        print(f"Encontrada(s) {len(triggers)} trigger(s). Salvando em 'triggers.json'...")
        with open('triggers.json', 'w', encoding='utf-8') as f:
            json.dump(triggers, f, indent=4, ensure_ascii=False)
        print("Arquivo 'triggers.json' salvo com sucesso!")
        
    print("\nExtração concluída.")

if __name__ == "__main__":
    main()