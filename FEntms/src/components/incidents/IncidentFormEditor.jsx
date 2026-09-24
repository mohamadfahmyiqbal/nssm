import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsersFromDB } from '../../services/api';
import { 
    ShieldAlert, 
    Activity, 
    Wrench, 
    CheckCircle2, 
    HelpCircle, 
    Sparkles 
} from 'lucide-react';

import IncidentFormHeader from './IncidentFormHeader';
import IncidentStepper from './IncidentStepper';
import StageDetectionDevices from './StageDetectionDevices';
import StageTriageImpact from './StageTriageImpact';
import StageTroubleshooting from './StageTroubleshooting';
import StageResolutionRecovery from './StageResolutionRecovery';
import StageRootCause from './StageRootCause';

const STAGES = [
    { id: 1, label: '1. Deteksi & Perangkat', icon: ShieldAlert, color: 'rose' },
    { id: 2, label: '2. Triage & Dampak', icon: Activity, color: 'amber' },
    { id: 3, label: '3. Troubleshooting', icon: Wrench, color: 'blue' },
    { id: 4, label: '4. Resolusi & Recovery', icon: CheckCircle2, color: 'emerald' },
    { id: 5, label: '5. Root Cause (RCA)', icon: HelpCircle, color: 'purple' }
];

export default function IncidentFormEditor({
    reportForm,
    setReportForm,
    selectedDevices,
    toggleSelectDevice,
    setSelectedDevices,
    devices = []
}) {
    const { currentUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const res = await getUsersFromDB();
                if (isMounted && res?.success && Array.isArray(res.data)) {
                    setUsersList(res.data);
                }
            } catch (err) {
                console.error('Failed to load users for technician assignment:', err);
            } finally {
                if (isMounted) setLoadingUsers(false);
            }
        };
        fetchUsers();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto max-h-[640px] custom-scrollbar">
            {/* Header Summary */}
            <IncidentFormHeader 
                currentUser={currentUser} 
                reportNumber={reportForm.reportNumber} 
            />

            {/* Visual 5-Stage Pipeline Stepper */}
            <IncidentStepper 
                stages={STAGES} 
                currentStep={currentStep} 
                setCurrentStep={setCurrentStep} 
            />

            {/* Form Stages */}
            {currentStep === 1 && (
                <StageDetectionDevices
                    reportForm={reportForm}
                    setReportForm={setReportForm}
                    selectedDevices={selectedDevices}
                    toggleSelectDevice={toggleSelectDevice}
                    setSelectedDevices={setSelectedDevices}
                    devices={devices}
                    onNext={() => setCurrentStep(2)}
                />
            )}

            {currentStep === 2 && (
                <StageTriageImpact
                    reportForm={reportForm}
                    setReportForm={setReportForm}
                    usersList={usersList}
                    loadingUsers={loadingUsers}
                    onBack={() => setCurrentStep(1)}
                    onNext={() => setCurrentStep(3)}
                />
            )}

            {currentStep === 3 && (
                <StageTroubleshooting
                    reportForm={reportForm}
                    setReportForm={setReportForm}
                    onBack={() => setCurrentStep(2)}
                    onNext={() => setCurrentStep(4)}
                />
            )}

            {currentStep === 4 && (
                <StageResolutionRecovery
                    reportForm={reportForm}
                    setReportForm={setReportForm}
                    onBack={() => setCurrentStep(3)}
                    onNext={() => setCurrentStep(5)}
                />
            )}

            {currentStep === 5 && (
                <StageRootCause
                    reportForm={reportForm}
                    setReportForm={setReportForm}
                    onBack={() => setCurrentStep(4)}
                />
            )}

            {/* Preview Note */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-start gap-2.5 text-xs text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                    Setiap tahapan yang Anda isi di atas akan <strong>tersimpan di Database SQL Server</strong>, terdistribusi ke <strong>MS Teams</strong>, dan tercetak otomatis pada <strong>Formulir Berita Acara PDF</strong>.
                </span>
            </div>
        </div>
    );
}
