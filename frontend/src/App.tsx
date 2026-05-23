import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { HistoryBar } from './components/HistoryBar';
import { Rocket } from 'lucide-react';
import { useAuth } from 'react-oidc-context';

function App() {
  const { user } = useAuth();
  const { multiplier, status, message, roundId, serverSeed, connectSocket } = useGameStore();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [currentBetId, setCurrentBetId] = useState<string | null>(null);


  useEffect(() => {
    connectSocket();
    fetchBalance();
  }, []);

  useEffect(() => {
    if (user?.access_token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
      fetchBalance();
    }
  }, [user]);

  // Se a rodada "Crashou", a gente limpa o botão de aposta pra próxima rodada
  useEffect(() => {
    if (status === 'CRASHED') {
      setCurrentBetId(null);
      fetchBalance();
    }
  }, [status]);

  const fetchBalance = async () => {
    try {
      const res = await axios.get('http://localhost:4002/wallets/me');
      setBalance(Number(res.data.balance) / 100);
    } catch (e) { console.error("Erro ao buscar saldo"); }
  };

  const handleBet = async () => {
    try {
      const res = await axios.post('http://localhost:4001/games/bet', {
        amount: betAmount * 100,
        roundId: roundId
      });
      setCurrentBetId(res.data.betId);
      toast.success("Aposta registrada com sucesso! 🚀");
      fetchBalance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Não foi possível apostar");
    }
  };

  const handleCashOut = async () => {
    if (!currentBetId) return;
    try {
      const res = await axios.post('http://localhost:4001/games/cashout', {
        betId: currentBetId
      });
      toast.success(`🤑 SAQUE COM SUCESSO! Você ganhou R$ ${res.data.ganho.toFixed(2)}`);
      setCurrentBetId(null);
      fetchBalance();
    } catch (error) {
      toast.error("Erro no saque. Você demorou muito! 💥");
      setCurrentBetId(null);
    }
  };

  const getMultiplierColor = () => {
    if (status === 'CRASHED') return 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]';
    if (status === 'IN_PROGRESS') return 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]';
    return 'text-white';
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans flex flex-col">
      {/* 1. Injetor de Notificações com as cores de Dark Mode corretas */}
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#1e293b', color: '#fff' } }}
      />

      <Navbar balance={balance} onBalanceUpdate={fetchBalance} />
      <HistoryBar />

      {/* ÁREA CENTRAL DIVIDIDA (Gráfico na Esquerda, Controles na Direita) */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 w-full max-w-[1400px] mx-auto">

        {/* GRÁFICO GIGANTE */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/40 border border-slate-700/50 w-full h-[500px] rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md">
          <h2 className="text-gray-400 text-xl uppercase tracking-widest mb-4 font-semibold z-10">{message}</h2>

          <h1 className={`text-9xl font-black z-10 ${getMultiplierColor()} transition-colors duration-200`}>
            {multiplier.toFixed(2)}x
          </h1>

          {/* O FOGUETINHO ANIMADO 🚀 */}
          {status === 'IN_PROGRESS' && (
            <div
              className="absolute text-white transition-all duration-100 ease-linear"
              style={{
                // A matemática pra ele subir na diagonal conforme o multiplicador cresce!
                bottom: `${Math.min((multiplier - 1) * 15, 80)}%`,
                left: `${Math.min((multiplier - 1) * 20, 80)}%`,
                transform: 'rotate(45deg)'
              }}
            >
              <Rocket size={64} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse" />
            </div>
          )}

          {/* Linha de Base Verde */}
          {status === 'IN_PROGRESS' && (
            <div className="absolute bottom-0 w-full h-2 bg-green-400 animate-pulse drop-shadow-[0_0_15px_rgba(74,222,128,1)]"></div>
          )}
        </div>

        {/* PAINEL DE CONTROLE / APOSTAS */}
        <div className="bg-slate-800/60 border border-slate-700/50 p-6 rounded-3xl w-full lg:w-96 shadow-xl flex flex-col gap-6 h-[500px] backdrop-blur-md">
          <div className="text-center border-b border-slate-700/50 pb-4">
            <h3 className="text-lg font-bold text-gray-300 uppercase tracking-widest">Painel de Apostas</h3>
          </div>

          <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-700">
            <span className="text-gray-400 font-medium">Valor (R$)</span>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={status !== 'BETTING_PHASE'}
              className="bg-transparent text-right text-2xl font-black text-white outline-none w-32"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 500].map(val => (
              <button
                key={val}
                onClick={() => setBetAmount(val)}
                disabled={status !== 'BETTING_PHASE'}
                className="bg-slate-700/50 hover:bg-slate-600 rounded-lg py-2 text-sm font-bold disabled:opacity-50 transition-colors"
              >
                +{val}
              </button>
            ))}
          </div>

          {/* BOTÕES DINÂMICOS */}
          <div className="flex-1 flex items-end">
            {status === 'BETTING_PHASE' ? (
              <button
                onClick={handleBet}
                disabled={currentBetId !== null}
                className="w-full py-5 rounded-2xl font-black text-2xl uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(147,51,234,0.5)] disabled:opacity-50"
              >
                {currentBetId ? 'Aposta Registrada' : 'Place Bet'}
              </button>
            ) : (
              <button
                onClick={handleCashOut}
                disabled={status === 'CRASHED' || !currentBetId}
                className="w-full py-5 rounded-2xl font-black text-2xl uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-slate-900 transition-all shadow-[0_0_20px_rgba(74,222,128,0.6)] disabled:opacity-50 disabled:grayscale"
              >
                {status === 'CRASHED' ? 'CRASHED' : `CASH OUT (R$ ${(betAmount * multiplier).toFixed(2)})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PROVABLY FAIR (Transparência) */}
      {serverSeed && (
        <div className="mt-auto mb-6 text-center text-xs text-gray-500 max-w-2xl mx-auto">
          <p className="uppercase tracking-widest font-bold mb-2">🔒 Provably Fair Server Seed</p>
          <code className="bg-slate-800/80 p-3 rounded-lg block border border-slate-700 break-all">{serverSeed}</code>
        </div>
      )}
    </div>
  );
}

export default App;