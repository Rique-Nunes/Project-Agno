'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface Trigger {
    triggerid: string;
    description: string;
    priority: string;
    lastchange: string;
    comments: string;
    lastchange_formatted?: string;
}

interface GroupedTriggers {
    critical: Trigger[];
    warning: Trigger[];
    info: Trigger[];
    ok: Trigger[];
}

interface HostAlertsProps {
    hostId: string;
    empresaId: string;
}

const Section = ({ title, triggers, icon, color, isOpen, onToggle }: { title: string; triggers: Trigger[]; icon: JSX.Element; color: string; isOpen: boolean; onToggle: () => void; }) => {
    if (triggers.length === 0) return null;

    return (
        <div className="mb-4">
            <button onClick={onToggle} className={`w-full text-left p-3 rounded-lg flex justify-between items-center bg-${color}-100`}>
                <div className="flex items-center">
                    {icon}
                    <h3 className={`ml-3 font-semibold text-lg text-${color}-800`}>{title} ({triggers.length})</h3>
                </div>
                {isOpen ? <ChevronUp className={`text-${color}-800`} /> : <ChevronDown className={`text-${color}-800`} />}
            </button>
            {isOpen && (
                <div className={`mt-2 p-3 bg-white rounded-lg shadow-inner max-h-96 overflow-y-auto`}>
                    <ul className="space-y-3">
                        {triggers.map(trigger => (
                            <li key={trigger.triggerid} className="p-3 bg-gray-50 rounded-md border-l-4 border-gray-200">
                                <p className="font-medium text-gray-800">{trigger.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{trigger.lastchange_formatted}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default function HostAlerts({ hostId, empresaId }: HostAlertsProps) {
    const { data: session } = useSession();
    const [triggers, setTriggers] = useState<GroupedTriggers | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState({
        critical: true,
        warning: true,
        info: false,
        ok: false,
    });

    const fetchTriggers = useCallback(async () => {
        if (!hostId || !empresaId || !session?.accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/zabbix/triggers/host/${empresaId}/${hostId}`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data: GroupedTriggers = await response.json();
            setTriggers(data);
        } catch (e: any) {
            setError(e.message || 'Falha ao buscar os alertas do host');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [hostId, empresaId, session]);

    useEffect(() => {
        fetchTriggers();
    }, [fetchTriggers]);

    const handleToggle = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-gray-600">Carregando alertas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-lg shadow-md mt-6 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                <p className="font-semibold text-red-700">Erro: {error}</p>
            </div>
        );
    }

    const hasProblemTriggers = triggers && (triggers.critical.length > 0 || triggers.warning.length > 0 || triggers.info.length > 0);
    const hasNoTriggersAtAll = !triggers || (!hasProblemTriggers && triggers.ok.length === 0);

    if (hasNoTriggersAtAll) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-gray-600">Nenhum alerta para este host.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Alertas e Status do Host</h2>

            {!hasProblemTriggers && (
                <div className="p-4 mb-4 bg-green-100 rounded-lg flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <p className="font-semibold text-green-800">Nenhum problema detectado. Todos os status estão OK.</p>
                </div>
            )}

            <Section
                title="Críticos"
                triggers={triggers.critical}
                icon={<ShieldAlert className="text-red-600" />}
                color="red"
                isOpen={openSections.critical}
                onToggle={() => handleToggle('critical')}
            />

            <Section
                title="Avisos"
                triggers={triggers.warning}
                icon={<AlertTriangle className="text-yellow-600" />}
                color="yellow"
                isOpen={openSections.warning}
                onToggle={() => handleToggle('warning')}
            />

            <Section
                title="Informativos"
                triggers={triggers.info}
                icon={<Info className="text-blue-600" />}
                color="blue"
                isOpen={openSections.info}
                onToggle={() => handleToggle('info')}
            />

            <Section
                title="OK"
                triggers={triggers.ok}
                icon={<CheckCircle className="text-green-600" />}
                color="green"
                isOpen={openSections.ok}
                onToggle={() => handleToggle('ok')}
            />
        </div>
    );
}
