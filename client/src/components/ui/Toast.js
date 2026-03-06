import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} removeToast={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
};

const Toast = ({ toast, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast, removeToast]);

    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={18} />,
        error: <AlertCircle className="text-red-500" size={18} />,
        info: <Info className="text-blue-500" size={18} />
    };

    const borders = {
        success: 'border-emerald-500/30',
        error: 'border-red-500/30',
        info: 'border-blue-500/30'
    };

    const glows = {
        success: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        error: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        info: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[#0a0a0b]/90 backdrop-blur-xl border ${borders[toast.type] || borders.info} ${glows[toast.type] || glows.info} min-w-[300px] max-w-[420px] shadow-2xl overflow-hidden relative group`}
        >
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />

            <div className="shrink-0 mt-0.5 ml-1">{icons[toast.type] || icons.info}</div>
            <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-sm font-bold text-white mb-1 tracking-tight capitalize">{toast.title}</h4>
                {toast.message && <p className="text-xs text-gray-400 font-medium leading-relaxed">{toast.message}</p>}
            </div>
            <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};
