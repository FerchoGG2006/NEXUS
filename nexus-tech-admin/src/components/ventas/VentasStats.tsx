import { Ticket, DollarSign, TrendingUp } from 'lucide-react'

interface VentasStatsProps {
    totalVentas: number;
    ingresosBrutos: number;
    gananciaNeta: number;
}

export function VentasStats({ totalVentas, ingresosBrutos, gananciaNeta }: VentasStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Ticket className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <p className="text-3xl font-bold text-white tracking-widest">{totalVentas}</p>
                    <p className="text-xs text-indigo-300 uppercase tracking-wider font-bold">Transacciones</p>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <DollarSign className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                    <p className="text-3xl font-bold text-white tracking-wide">${ingresosBrutos.toFixed(2)}</p>
                    <p className="text-xs text-cyan-300 uppercase tracking-wider font-bold">Ingresos Brutos</p>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <p className="text-3xl font-bold text-emerald-400 tracking-wide">${gananciaNeta.toFixed(2)}</p>
                    <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold">Ganancia Neta</p>
                </div>
            </div>
        </div>
    )
}
