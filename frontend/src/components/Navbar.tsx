import { Wallet, HelpCircle, User, Rocket, LogIn, } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import toast from 'react-hot-toast';
import axios from 'axios';

interface NavbarProps {
    balance: number;
    onBalanceUpdate: () => void;
}

export function Navbar({ balance, onBalanceUpdate }: NavbarProps) {
    const auth = useAuth();

    const handleQuickDeposit = async () => {
        try {
            await axios.post('http://localhost:4002/wallets/credit', {
                amount: 5000,
                referenceId: `deposito-${Date.now()}`
            });
            toast.success('R$ 50,00 depositados com sucesso! 💰');
            onBalanceUpdate();
        } catch (error) {
            toast.error('Erro ao realizar depósito.');
        }
    };

    return (
        <nav className="w-full flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shadow-md z-50">
            <div className="flex items-center gap-2 cursor-pointer">
                <Rocket className="text-purple-500" size={28} />
                <span className="text-xl font-black tracking-widest text-white italic">
                    CRASH<span className="text-purple-500">X</span>
                </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                    <HelpCircle size={18} />
                    How to Play?
                </button>
            </div>

            <div className="flex items-center gap-4">
                {/* Se NÃO estiver logado, mostra o botão de Login */}
                {!auth.isAuthenticated ? (
                    <button
                        onClick={() => void auth.signinRedirect()}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-md font-bold shadow-lg hover:scale-105 transition-transform"
                    >
                        <LogIn size={18} />
                        Entrar no Cassino
                    </button>
                ) : (
                    /* Se estiver logado, mostra o Saldo e o Perfil! */
                    <>
                        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                            <span className="text-purple-400 font-bold px-3">
                                R$ {balance.toFixed(2)}
                            </span>
                            <button
                                onClick={handleQuickDeposit}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-md font-bold text-sm transition-all shadow-lg"
                            >
                                <Wallet size={16} />
                                Deposit
                            </button>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                            <div className="text-right hidden sm:block">
                                {/* Nome de usuário vindo direto do Token do Keycloak! */}
                                <p className="text-sm font-bold text-white">{auth.user?.profile.preferred_username}</p>
                                <p className="text-xs text-slate-400 cursor-pointer hover:text-red-400" onClick={() => void auth.signoutRedirect()}>Sair</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-purple-500/50">
                                <User className="text-slate-300" size={20} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
}