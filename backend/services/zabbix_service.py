import requests
import json
import re
import traceback
from typing import List, Dict, Any
import time
from datetime import datetime, timedelta
from collections import defaultdict

# --- INÍCIO DO SISTEMA DE CACHE ---
_cache: Dict[str, Dict[str, Any]] = {}
# --- FIM DO SISTEMA DE CACHE ---

class ZabbixAPIException(Exception):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message)
        self.details = details

    def __str__(self):
        return f"{super().__str__()} Details: {self.details}"

def call_zabbix_api(api_url: str, token: str, method: str, params: Dict[str, Any], ttl_seconds: int = 0) -> Any:
    if ttl_seconds > 0:
        cache_key = f"{api_url}:{method}:{json.dumps(params, sort_keys=True)}"
        current_time = time.time()
        if cache_key in _cache and _cache[cache_key]['expires_at'] > current_time:
            return _cache[cache_key]['data']

    # Se não há TTL, ou se o cache expirou/não existe, executa a chamada
    payload = { "jsonrpc": "2.0", "method": method, "params": params, "auth": token, "id": 1 }
    try:
        response = requests.post(api_url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        if 'error' in result:
            raise ZabbixAPIException(f"Zabbix API Error: {result['error']}", result['error'])
        
        data = result.get('result', [])
        
        if ttl_seconds > 0:
            # Armazena o novo dado no cache
            _cache[cache_key] = {
                'data': data,
                'expires_at': time.time() + ttl_seconds
            }
        return data
    except requests.exceptions.RequestException as e:
        raise ZabbixAPIException(f"Erro de conexão com a API Zabbix: {e}")

def get_zabbix_hosts(api_url: str, token: str) -> List[Dict[str, Any]]:
    return call_zabbix_api(api_url, token, "host.get", {
        "output": ["hostid", "name"], "selectInterfaces": ["ip"], "filter": {"status": 0}
    }, ttl_seconds=300)

def get_active_triggers(api_url: str, token: str) -> List[Dict[str, Any]]:
    triggers = call_zabbix_api(api_url, token, "trigger.get", {
        "output": ["triggerid", "description", "priority", "lastchange"],
        "selectHosts": ["name"], 
        "filter": {"value": 1},
        "sortfield": "lastchange", 
        "sortorder": "DESC",
        "expandDescription": True
    }, ttl_seconds=30)
    for trigger in triggers:
        trigger['hosts'] = [{'name': h['name']} for h in trigger.get('hosts', [])]
    return triggers


def get_key_metrics(api_url: str, token: str, host_id: str):
    """Busca as principais métricas de um host: CPU, Memória, Disco(s) e Rede."""
    
    # 1. Buscar TODOS os itens de uma vez para otimizar
    all_items = call_zabbix_api(api_url, token, "item.get", {
        "output": ["key_", "lastvalue", "name"],
        "hostids": host_id,
    }, ttl_seconds=10)

    if not all_items:
        return []

    # 2. Criar um mapa de chave -> item para acesso rápido
    items_map = {item['key_']: item for item in all_items}
    
    results = []

    # 3. Processar CPU e Memória
    cpu_key = 'system.cpu.util'
    if cpu_key in items_map:
        value = items_map[cpu_key].get('lastvalue', '0')
        results.append({"key": "cpu_util", "value": f"{float(value):.2f}"})

    mem_key = 'vm.memory.utilization' # Chave principal
    if mem_key not in items_map:
        mem_key = 'vm.memory.size[pavailable]' # Chave alternativa

    if mem_key in items_map:
        value = float(items_map[mem_key].get('lastvalue', '0'))
        if 'pavailable' in mem_key:
             value = 100 - value
        results.append({"key": "memory_pused", "value": f"{value:.2f}"})

    # 4. Processar Discos (com lógica anti-duplicata)
    processed_partitions = set()
    for key, item in items_map.items():
        if (key.startswith('vfs.fs.size[') or key.startswith('vfs.fs.dependent.size[')) and ',pused]' in key:
            partition_match = re.search(r'\[([^,]+),pused\]', key)
            if partition_match:
                partition_name = partition_match.group(1)
                if partition_name not in processed_partitions:
                    processed_partitions.add(partition_name)
                    value = item.get('lastvalue', '0')
                    
                    results.append({
                        "key": f"disk_{partition_name.replace('/', '_').replace('-', '_')}",
                        "value": f"{float(value):.2f}",
                        "label": f"Espaço Utilizado ({partition_name})",
                        "partition": partition_name
                    })

    # 5. Processar Rede (Entrada e Saída)
    main_net_interface = None
    max_traffic = -1
    for key, item in items_map.items():
        if key.startswith('net.if.in[') and not ('lo' in key):
            try:
                traffic = float(item.get('lastvalue', 0))
                if traffic > max_traffic:
                    max_traffic = traffic
                    match = re.search(r'net\.if\.in\["?([^,\]"]+)', key)
                    if match:
                        main_net_interface = match.group(1)
            except (ValueError, TypeError):
                continue
    
    if main_net_interface:
        net_in_key = f'net.if.in["{main_net_interface}"]'
        if net_in_key not in items_map: net_in_key = f'net.if.in[{main_net_interface}]'
        
        net_out_key = f'net.if.out["{main_net_interface}"]'
        if net_out_key not in items_map: net_out_key = f'net.if.out[{main_net_interface}]'

        if net_in_key in items_map:
            value = items_map[net_in_key].get('lastvalue', '0')
            results.append({"key": "network_in", "value": f"{float(value):.0f}"})
        
        if net_out_key in items_map:
            value = items_map[net_out_key].get('lastvalue', '0')
            results.append({"key": "network_out", "value": f"{float(value):.0f}"})

    return results

def get_alert_history(api_url: str, token: str, time_from: int, time_till: int, hostids: List[str] = None):
    # --- 1. BUSCAR OS PROBLEMAS ---
    problem_params = {
        "output": ["objectid", "name", "severity", "clock", "eventid"],
        "time_from": time_from,
        "time_till": time_till,
        "sortfield": ["eventid"],
        "sortorder": "DESC"
    }
    if hostids:
        problem_params["hostids"] = hostids
    problems = call_zabbix_api(api_url, token, "problem.get", problem_params)

    if not problems:
        return []

    # --- 2. EXTRAIR OS IDs DAS TRIGGERS DOS PROBLEMAS ---
    trigger_ids = [p['objectid'] for p in problems]

    # --- 3. BUSCAR AS TRIGGERS E OS HOSTS RELACIONADOS ---
    triggers = call_zabbix_api(api_url, token, "trigger.get", {
        "output": ["triggerid"],
        "triggerids": trigger_ids,
        "selectHosts": ["name"],
    })

    # --- 4. CRIAR UM MAPA PARA JUNTAR AS INFORMAÇÕES ---
    trigger_host_map = {}
    for trigger in triggers:
        if trigger.get('hosts'):
            trigger_host_map[trigger['triggerid']] = trigger['hosts']

    # --- 5. MONTAR A RESPOSTA FINAL COM OS NOMES CORRETOS PARA O FRONTEND ---
    formatted_alerts = []
    for problem in problems:
        formatted_alerts.append({
            "triggerid": problem.get('objectid'),
            "description": problem.get('name'),
            "priority": problem.get('severity'),  # Mapeia 'severity' para 'priority'
            "hosts": trigger_host_map.get(problem['objectid'], []),
            "lastchange": problem.get('clock')  # Mapeia 'clock' para 'lastchange'
        })
            
    return formatted_alerts

def get_aggregated_history(api_url: str, token: str, period: str = "24h"):
    # Esta função não será mais usada pelo dashboard principal, mas pode ser mantida para uso futuro.
    days = 1
    if period == "7d":
        days = 7
    elif period == "30d":
        days = 30
    
    time_till = int(time.time())
    time_from = time_till - (days * 24 * 60 * 60)
    keys_to_fetch = ["system.cpu.util[,user]", "vm.memory.utilization"]
    
    items = call_zabbix_api(api_url, token, "item.get", {
        "output": ["itemid", "key_"], "selectHosts": ["name", "hostid"], "monitored": True,
        "search": { "key_": keys_to_fetch }, "searchByAny": True
    }, ttl_seconds=60)

    # ... (o resto da função continua aqui, sem alterações)
    itemid_to_host = {item['itemid']: item['hosts'][0]['name'] for item in items if item.get('hosts')}
    itemids_cpu = [item['itemid'] for item in items if item['key_'] == keys_to_fetch[0]]
    itemids_mem = [item['itemid'] for item in items if item['key_'] == keys_to_fetch[1]]
    history_params = {
        "output": "extend", "history": 0, "time_from": time_from, "time_till": time_till,
        "sortfield": "clock", "sortorder": "ASC"
    }
    history_cpu = call_zabbix_api(api_url, token, "history.get", {**history_params, "itemids": itemids_cpu}) if itemids_cpu else []
    history_mem = call_zabbix_api(api_url, token, "history.get", {**history_params, "itemids": itemids_mem}) if itemids_mem else []
   
    def aggregate_by_hour(history_data):
        hourly_aggr = defaultdict(lambda: {'sum': 0, 'count': 0, 'hosts': []})
        for point in history_data:
            dt_object = datetime.fromtimestamp(int(point['clock']))
            hour_key = dt_object.strftime('%Y-%m-%d %H:00')
            value = float(point['value'])
            host_name = itemid_to_host.get(point['itemid'], 'Desconhecido')
            hourly_aggr[hour_key]['sum'] += value
            hourly_aggr[hour_key]['count'] += 1
            hourly_aggr[hour_key]['hosts'].append({'name': host_name, 'value': value})
        formatted_data = []
        for hour_str, data in sorted(hourly_aggr.items()):
            avg = data['sum'] / data['count'] if data['count'] > 0 else 0
            top_hosts = sorted(data['hosts'], key=lambda x: x['value'], reverse=True)[:3]
            formatted_data.append({
                'time_dt': datetime.strptime(hour_str, '%Y-%m-%d %H:00'),
                'time': datetime.strptime(hour_str, '%Y-%m-%d %H:00').strftime('%H:%M'),
                'value': round(avg, 2),
                'top_hosts': [{'name': h['name'], 'value': round(h['value'], 2)} for h in top_hosts]
            })
        return formatted_data
    agg_cpu = aggregate_by_hour(history_cpu)
    agg_mem = aggregate_by_hour(history_mem)
    all_times_dt = set()
    if agg_cpu: all_times_dt.update([d['time_dt'] for d in agg_cpu])
    if agg_mem: all_times_dt.update([d['time_dt'] for d in agg_mem])
    sorted_times_dt = sorted(list(all_times_dt))
    if not sorted_times_dt: return []
    combined_data = {dt.strftime('%H:%M'): {'time': dt.strftime('%H:%M'), 'cpu': None, 'memory': None, 'top_cpu': [], 'top_memory': []} for dt in sorted_times_dt}
    for item in agg_cpu: combined_data[item['time']]['cpu'], combined_data[item['time']]['top_cpu'] = item['value'], item['top_hosts']
    for item in agg_mem: combined_data[item['time']]['memory'], combined_data[item['time']]['top_memory'] = item['value'], item['top_hosts']
    final_data, last_point = [], None
    if sorted_times_dt:
        last_cpu, last_mem, last_top_cpu, last_top_mem = 0, 0, [], []
        for dt in sorted_times_dt:
            point = combined_data[dt.strftime('%H:%M')]
            point['cpu'] = last_cpu if point['cpu'] is None else point['cpu']
            point['memory'] = last_mem if point['memory'] is None else point['memory']
            point['top_cpu'] = last_top_cpu if not point['top_cpu'] else point['top_cpu']
            point['top_memory'] = last_top_mem if not point['top_memory'] else point['top_memory']
            last_cpu, last_mem, last_top_cpu, last_top_mem = point['cpu'], point['memory'], point['top_cpu'], point['top_memory']
            final_data.append(point)
        last_point = final_data[-1]
        now = datetime.now()
        last_hour_dt = sorted_times_dt[-1]
        current_hour_dt = last_hour_dt + timedelta(hours=1)
        while current_hour_dt.hour <= now.hour:
            final_data.append({'time': current_hour_dt.strftime('%H:%M'),'cpu': last_point['cpu'], 'memory': last_point['memory'],'top_cpu': last_point['top_cpu'], 'top_memory': last_point['top_memory']})
            current_hour_dt += timedelta(hours=1)
        if final_data: final_data[-1]['time'] = "Agora"
    return final_data

def get_top_consumers(api_url: str, token: str):
    try:
        # 1. Buscar itens de CPU e Memória
        items = call_zabbix_api(api_url, token, "item.get", {
            "output": ["itemid", "name", "lastvalue", "key_"],
            "selectHosts": ["name"],
            "monitored": True,
            "search": {
                "key_": ["system.cpu.util[,user]", "vm.memory.utilization"]
            },
            "searchByAny": True
        }, ttl_seconds=60)

        # 2. Separar e processar os dados
        top_cpu = []
        top_memory = []

        for item in items:
            if not item.get('lastvalue') or not item.get('hosts'):
                continue

            try:
                value = float(item['lastvalue'])
                host_name = item['hosts'][0]['name']
                
                record = {"name": host_name, "value": round(value, 2)}

                if "system.cpu.util" in item['key_']:
                    top_cpu.append(record)
                elif "vm.memory.utilization" in item['key_']:
                    top_memory.append(record)
            except (ValueError, TypeError):
                # Ignora itens que não têm um valor numérico
                continue
        
        # 3. Ordenar e pegar o Top 5
        top_cpu = sorted(top_cpu, key=lambda x: x['value'], reverse=True)[:5]
        top_memory = sorted(top_memory, key=lambda x: x['value'], reverse=True)[:5]

        return {"top_cpu": top_cpu, "top_memory": top_memory}

    except ZabbixAPIException as e:
        # Repassa a exceção da API do Zabbix
        raise e
    except Exception as e:
        # Captura outros erros inesperados
        raise ZabbixAPIException(f"Erro ao processar top consumidores: {e}")

def get_host_triggers(api_url: str, token: str, host_id: str):
    """Busca todos os triggers de um host específico"""
    triggers = call_zabbix_api(api_url, token, "trigger.get", {
        "output": [
            "triggerid", "description", "priority", "lastchange", 
            "comments", "opdata", "state", "error", "value", "status"
        ],
        "hostids": host_id,
        "expandDescription": True,
        "selectHosts": ["name"],
        "sortfield": "lastchange",
        "sortorder": "DESC"
    }, ttl_seconds=15)
    
    grouped = {
        "critical": [],
        "warning": [],
        "info": [],
        "ok": []
    }
    
    for trigger in triggers:
        priority = int(trigger.get('priority', 0))
        value = int(trigger.get('value', 0))
        status = int(trigger.get('status', 0))
        
        # Formatar o timestamp 'lastchange'
        lastchange_timestamp = int(trigger.get('lastchange', 0))
        trigger['lastchange_formatted'] = datetime.fromtimestamp(lastchange_timestamp).strftime('%d/%m/%Y %H:%M:%S')
        
        if status == 0: # Apenas triggers ativados
            if value == 1:  # PROBLEMA ATIVO
                if priority >= 4: # High e Disaster
                    grouped["critical"].append(trigger)
                elif priority == 3 or priority == 2: # Average e Warning
                    grouped["warning"].append(trigger)
                else: # Information e Not classified
                    grouped["info"].append(trigger)
            else:  # OK
                grouped["ok"].append(trigger)
    
    return grouped

def get_host_system_info(api_url: str, token: str, host_id: str):
    """Busca informações do sistema do host"""
    # Buscar informações do host
    hosts = call_zabbix_api(api_url, token, "host.get", {
        "output": ["hostid", "name", "description"],
        "hostids": host_id,
        "selectInterfaces": ["ip", "dns"],
        "selectInventory": ["os", "os_full", "os_short", "os_version", "host_networks", "host_networks"]
    }, ttl_seconds=3600)
    
    if not hosts:
        return {"error": "Host não encontrado"}
    
    host = hosts[0]
    
    # Buscar itens específicos do sistema
    system_items = call_zabbix_api(api_url, token, "item.get", {
        "output": ["key_", "lastvalue", "name"],
        "hostids": host_id,
        "search": {
            "key_": [
                "system.uptime",
                "system.localtime",
                "kernel.maxfiles",
                "kernel.maxproc",
                "system.cpu.num",
                "system.sw.os",
                "system.sw.arch",
                "system.sw.packages"
            ]
        },
        "searchByAny": True
    }, ttl_seconds=3600)
    
    # Organizar informações
    system_info = {
        "host": {
            "name": host.get("name"),
            "description": host.get("description"),
            "ip": host.get("interfaces")[0].get("ip") if host.get("interfaces") else "N/A",
            "dns": host.get("interfaces")[0].get("dns") if host.get("interfaces") else "N/A"
        },
        "system": {}
    }
    
    # Processar itens
    for item in system_items:
        key = item.get('key_')
        value = item.get('lastvalue')
        
        if key == "system.uptime":
            system_info["system"]["uptime"] = value
        elif key == "system.sw.os":
            system_info["system"]["os"] = value
        elif key == "system.sw.arch":
            system_info["system"]["arch"] = value
        elif key == "system.cpu.num":
            system_info["system"]["cpu_cores"] = value
        elif key == "kernel.maxfiles":
            system_info["system"]["max_files"] = value
        elif key == "kernel.maxproc":
            system_info["system"]["max_processes"] = value
        elif key == "system.sw.packages":
            system_info["system"]["packages"] = value
    
    return system_info  

def get_full_zabbix_context(api_url: str, token: str):
    try:
        # 1. Obter todos os hosts monitorados primeiro
        hosts = get_zabbix_hosts(api_url, token)
        
        # CORREÇÃO DEFINITIVA: A linha que faltava está aqui.
        host_ids = [host['hostid'] for host in hosts]

        # 2. Estatísticas Gerais
        problems_count = call_zabbix_api(api_url, token, "problem.get", {"countOutput": True}, ttl_seconds=30)
        
        # 3. Triggers Ativos (Problemas)
        active_triggers = get_active_triggers(api_url, token)

        # 4. Itens de Disco para todos os hosts
        disk_items = call_zabbix_api(api_url, token, "item.get", {
            "output": ["name", "key_", "lastvalue"],
            "hostids": host_ids,
            "selectHosts": ["name"],
            "search": {"key_": "vfs.fs.size"},
            "filter": {"key_": "pused"}, 
            "sortfield": "name"
        }, ttl_seconds=60)

        # --- PROCESSAMENTO E AGREGAÇÃO DOS DADOS ---

        host_disk_details = defaultdict(list)
        for item in disk_items:
            host_name = item['hosts'][0]['name'] if item.get('hosts') else 'Desconhecido'
            partition_match = re.search(r'vfs\.fs\.size\[(.*),pused\]', item['key_'])
            partition = partition_match.group(1) if partition_match else item['name']
            
            try:
                used_percent = f"{float(item['lastvalue']):.2f}%"
            except (ValueError, TypeError):
                used_percent = item.get('lastvalue', 'N/A')

            host_disk_details[host_name].append({
                "partition": partition,
                "used_percent": used_percent
            })
        
        for host in hosts:
            host['disk_partitions'] = host_disk_details.get(host['name'], [])

        # Inicializa o dicionário 'context'
        context = {
            "hosts": hosts,
            "active_triggers": active_triggers,
            "general_stats": {
                "total_hosts": len(hosts),
                "active_problems": int(problems_count)
            },
        }

        # Adiciona os top consumers
        top_consumers = get_top_consumers(api_url, token)
        context.update(top_consumers)

        return context

    except ZabbixAPIException as e:
        raise e
    except Exception as e:
        print("!!!!!!!!!!!!!! ERRO INESPERADO AO GERAR CONTEXTO COMPLETO !!!!!!!!!!!!!!")
        traceback.print_exc()
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        raise ZabbixAPIException(f"Erro ao gerar contexto completo do Zabbix: {e}")

# --- INÍCIO DA CORREÇÃO ---
# Esta é a função unificada que aceita o 'hostids' opcionalmente.
# Ela substitui as duas versões que você tinha.
def get_event_log(api_url: str, token: str, time_from: int, time_till: int, hostids: List[str] = None):
    """Busca o log de eventos do Zabbix e formata para o frontend."""
    params = {
        "output": "extend",
        "selectHosts": ["name"],
        "selectRelatedObject": ["priority"],
        "object": 0,
        "source": 0,
        "value": [0, 1],
        "expandDescription": True,
        "time_from": time_from,
        "time_till": time_till,
        "sortfield": ["clock"],
        "sortorder": "DESC",
        "limit": 100 
    }
    # Adiciona o filtro de hostids se ele for fornecido
    if hostids:
        params["hostids"] = hostids
        
    events = call_zabbix_api(api_url, token, "event.get", params)

    formatted_log = []
    for event in events:
        trigger = event.get('relatedObject')
        if not trigger:
            continue
            
        log_entry = {
            "eventid": event.get('eventid'),
            "time": datetime.fromtimestamp(int(event.get('clock'))).strftime('%d/%m %H:%M:%S'),
            "description": event.get('name'),
            "priority": trigger.get('priority'),
            "host": event.get('hosts')[0]['name'] if event.get('hosts') else 'N/A',
            "status": "PROBLEMA" if event.get('value') == '1' else "RESOLVIDO"
        }
        formatted_log.append(log_entry)
            
    return formatted_log
# --- FIM DA CORREÇÃO ---

def get_company_inventory(api_url: str, token: str, filter_text: str = None, include_heavy: bool = False):
    """Retorna um inventário detalhado de hosts, incluindo contagem de itens e problemas."""
    params = {
        "output": ["hostid", "host", "name", "status", "available"],
        "selectGroups": ["name"],
        "selectParentTemplates": ["name"],
        "selectTags": ["tag", "value"],
        "selectInterfaces": ["ip"],
        "selectInventory": "extend",
        "selectItems": "count",
    }
    if filter_text:
        params["search"] = {"name": filter_text}

    hosts = call_zabbix_api(api_url, token, "host.get", params)

    if not hosts:
        return []

    host_ids = [h['hostid'] for h in hosts]

    active_triggers = call_zabbix_api(api_url, token, "trigger.get", {
        "output": ["triggerid"], "hostids": host_ids,
        "selectHosts": ["hostid"], "filter": {"value": 1}, "monitored": True,
    })

    problem_counts = defaultdict(int)
    if active_triggers:
        for trigger in active_triggers:
            if trigger.get('hosts'):
                for host_data in trigger['hosts']:
                    problem_counts[host_data['hostid']] += 1

    for host in hosts:
        host['item_count'] = host.pop('items', '0')
        host['active_problems'] = problem_counts.get(host['hostid'], 0)
        host['groups'] = [g['name'] for g in host.get('groups', [])]
        host['templates'] = [t['name'] for t in host.get('parentTemplates', [])]
        host['tags'] = [f"{tg['tag']}:{tg['value']}" for tg in host.get('tags', [])]
    
    return hosts