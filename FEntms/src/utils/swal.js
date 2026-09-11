// src/utils/swal.js
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Kustomisasi SweetAlert2 dengan Tema Dark NOC NTMS
const darkSwal = MySwal.mixin({
    background: '#0f172a', // Slate 900
    color: '#f8fafc',      // Slate 50
    confirmButtonColor: '#2563eb', // Blue 600
    cancelButtonColor: '#475569',  // Slate 600
    customClass: {
        popup: 'border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md',
        title: 'text-base font-bold font-sans text-slate-100',
        htmlContainer: 'text-xs text-slate-300 font-sans',
        confirmButton: 'px-4 py-2 text-xs font-bold font-mono rounded-xl border border-blue-400/30 hover:bg-blue-500 transition-colors',
        cancelButton: 'px-4 py-2 text-xs font-bold font-mono rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors',
    },
});

/**
 * Toast Notification Melayang di Sudut Kanan Atas
 */
export const showToast = (icon, title) => {
    darkSwal.fire({
        icon: icon, // 'success' | 'error' | 'warning' | 'info'
        title: title,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1e293b', // Slate 800
    });
};

/**
 * Modal Alert Standar (Error, Warning, Success)
 */
export const showAlert = (title, text, icon = 'info') => {
    return darkSwal.fire({
        title,
        text,
        icon,
    });
};

/**
 * Modal Konfirmasi Tindakan (Delete, Maintenance, Re-poll)
 */
export const showConfirm = (title, text, confirmButtonText = 'Ya, Lanjutkan') => {
    return darkSwal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: 'Batal',
        reverseButtons: true,
    });
};

export default darkSwal;