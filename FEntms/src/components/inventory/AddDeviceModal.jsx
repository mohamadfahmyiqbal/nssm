import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import BasicInfoFields from './modal/BasicInfoFields';
import DeviceTypeAndMethod from './modal/DeviceTypeAndMethod';
import ModularPortConfig from './modal/ModularPortConfig';
import SnmpAuthFields from './modal/SnmpAuthFields';
import SnmpTestResultStep from './modal/SnmpTestResultStep';

export default function AddDeviceModal({ isOpen, onClose, onSave, device = null }) {
    const [step, setStep] = useState('form'); // 'form' | 'testing' | 'result'
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);

    // Initial State Setup
    const getInitialState = () => {
        const initialVersion = device?.snmpVersion || device?.SNMP_VERSION;
        const isSnmpEnabled = initialVersion && initialVersion !== 'none' && initialVersion !== '';

        return {
            hostname: device?.hostname || device?.name || '',
            ip: device?.ip || device?.IP || '',
            mac: device?.mac || device?.MAC || '',
            type: device?.type || device?.TYPE || 'Endpoint',
            vendor: device?.vendor || device?.VENDOR || '',
            port: device?.port || device?.PORT || (device?.type?.toLowerCase() === 'switch' ? '24' : ''),
            pingMethod: device?.pingMethod || device?.PING_METHOD || 'tcp',
            enableSnmp: isSnmpEnabled !== undefined ? Boolean(isSnmpEnabled) : false,
            snmpVersion: (initialVersion && initialVersion !== 'none') ? initialVersion : 'v2c',
            snmpPort: device?.snmpPort || device?.SNMP_PORT || '161',
            snmpCommunity: device?.snmpCommunity || device?.SNMP_COMMUNITY || 'public',
            snmpUser: device?.snmpUser || device?.SNMP_USER || '',
            snmpAuthProto: device?.snmpAuthProto || device?.SNMP_AUTH_PROTO || 'sha',
            snmpAuthKey: device?.snmpAuthKey || device?.SNMP_AUTH_KEY || '',
            snmpPrivProto: device?.snmpPrivProto || device?.SNMP_PRIV_PROTO || 'aes',
            snmpPrivKey: device?.snmpPrivKey || device?.SNMP_PRIV_KEY || '',
            autoDiscover: true,
        };
    };

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setStep('form');
            setTestResult(null);
            setTestError(null);
        }
    }, [isOpen, device]);

    if (!isOpen) return null;

    const handleTestSNMP = async () => {
        if (!formData.enableSnmp && formData.pingMethod !== 'snmp') {
            const dataToSave = {
                ...formData,
                snmpVersion: 'none',
                snmpPort: null,
                snmpCommunity: null,
                snmpUser: null,
                snmpAuthProto: null,
                snmpAuthKey: null,
                snmpPrivProto: null,
                snmpPrivKey: null
            };
            onSave(dataToSave);
            onClose();
            return;
        }

        if (formData.pingMethod !== 'snmp') {
            onSave(formData);
            onClose();
            return;
        }

        setStep('testing');
        setTestResult(null);
        setTestError(null);

        try {
            const res = await api.post('/devices/snmp-test', formData);
            if (res.data.success) {
                setTestResult(res.data.data);
            } else {
                setTestError(res.data.error || 'Test SNMP gagal');
            }
        } catch (error) {
            setTestError(error.response?.data?.error || error.message || 'Gagal terhubung ke server');
        } finally {
            setStep('result');
        }
    };

    const handleResetAndClose = () => {
        setStep('form');
        onClose();
    };

    const isEdit = !!device;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans text-xs text-slate-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-5 py-3.5 bg-slate-800/80 border-b border-slate-700">
                    <h3 className="font-bold text-sm tracking-wide text-slate-100 uppercase">
                        {isEdit ? 'EDIT PERANGKAT' : 'TAMBAH PERANGKAT BARU'}
                    </h3>
                    <button onClick={handleResetAndClose} className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {step === 'form' ? (
                        <>
                            <BasicInfoFields formData={formData} setFormData={setFormData} />
                            
                            <DeviceTypeAndMethod formData={formData} setFormData={setFormData} />

                            <ModularPortConfig formData={formData} setFormData={setFormData} />

                            <SnmpAuthFields formData={formData} setFormData={setFormData} />

                            {/* Action Button */}
                            <button
                                onClick={handleTestSNMP}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-colors"
                            >
                                <span>✓ Simpan {formData.pingMethod === 'snmp' ? '& Uji SNMP' : 'Data'}</span>
                            </button>
                        </>
                    ) : (
                        <SnmpTestResultStep
                            step={step}
                            formData={formData}
                            testError={testError}
                            testResult={testResult}
                            onCancel={handleResetAndClose}
                            onSave={() => {
                                onSave(formData);
                                handleResetAndClose();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}