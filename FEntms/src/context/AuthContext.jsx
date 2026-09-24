import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = {
    TECHNICIAN: 'TECHNICIAN',
    SPV: 'SPV',
    DEPT_HEAD: 'DEPT_HEAD',
    ADMIN: 'ADMIN'
};

export function AuthProvider({ children }) {
    // Default session role (disimpan di localStorage agar persistent)
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('ntms_user');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }
        return {
            nik: '1001',
            nama: 'Staff Teknisi IT',
            dept: 'IT Infrastructure',
            role: ROLES.TECHNICIAN
        };
    });

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('ntms_user', JSON.stringify(currentUser));
        }
    }, [currentUser]);

    const changeRole = (newRole) => {
        setCurrentUser(prev => ({
            ...prev,
            role: newRole,
            nama: newRole === ROLES.DEPT_HEAD ? 'Bpk. Hendra (Dept Head IT)' :
                  newRole === ROLES.SPV ? 'Ibu Rina (SPV Network)' : 'Ahmad Fauzi (Teknisi IT)'
        }));
    };

    /**
     * RBAC Permission Matrix Helper
     */
    const canCreateReport = [ROLES.TECHNICIAN, ROLES.SPV, ROLES.DEPT_HEAD, ROLES.ADMIN].includes(currentUser?.role);
    const canTroubleshoot = [ROLES.TECHNICIAN, ROLES.SPV, ROLES.DEPT_HEAD, ROLES.ADMIN].includes(currentUser?.role);
    const canResolve = [ROLES.TECHNICIAN, ROLES.SPV, ROLES.DEPT_HEAD, ROLES.ADMIN].includes(currentUser?.role);
    const canCloseIncident = [ROLES.SPV, ROLES.DEPT_HEAD, ROLES.ADMIN].includes(currentUser?.role);
    const canDeleteArchive = [ROLES.DEPT_HEAD, ROLES.ADMIN].includes(currentUser?.role);
    // Terbuka untuk semua role user saat ini
    const canManageUsers = true;

    return (
        <AuthContext.Provider value={{
            currentUser,
            setCurrentUser,
            changeRole,
            canCreateReport,
            canTroubleshoot,
            canResolve,
            canCloseIncident,
            canDeleteArchive,
            canManageUsers,
            ROLES
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
