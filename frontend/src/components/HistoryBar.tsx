import { TrendingUp } from 'lucide-react';

export function HistoryBar() {
    // Histórico fake (por enquanto) para vermos o design das badges!
    const lastRounds = [1.32, 2.45, 1.08, 3.67, 1.25, 5.32, 1.76, 2.01, 1.44, 3.12, 1.00, 2.89];

    return (
        <div className="w-full bg-slate-900 border-b border-slate-800 p-3 flex items-center gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2 border-r border-slate-700">
                <TrendingUp size={16} className="text-slate-500" />
                Last Rounds
            </div>

            <div className="flex gap-2">
                {lastRounds.map((multiplier, index) => {
                    // Se o multiplicador for maior ou igual a 2.00, fica Verde. Se não, Roxo/Cinza.
                    const isHigh = multiplier >= 2.0;
                    return (
                        <div
                            key={index}
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border 
                ${isHigh
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_8px_rgba(74,222,128,0.2)]'
                                    : 'bg-slate-800 text-purple-300 border-slate-700'
                                }`}
                        >
                            {multiplier.toFixed(2)}x
                        </div>
                    );
                })}
            </div>
        </div>
    );
}