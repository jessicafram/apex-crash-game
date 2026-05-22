import * as crypto from 'crypto';

export class ProvablyFairService {

    // 1. Gera uma semente secreta do Servidor (ex: "b4c9...12f")
    static generateServerSeed(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // 2. Cria o Hash dessa semente para mostrarmos pro jogador ANTES da rodada começar (Para provar que não roubamos)
    static hashServerSeed(serverSeed: string): string {
        return crypto.createHash('sha256').update(serverSeed).digest('hex');
    }

    // 3. A Matemática pesada: Calcula onde o gráfico vai estourar!
    static calculateCrashPoint(serverSeed: string, clientSeed: string = '00000000000000000000'): number {
        // Junta a semente do cassino com a semente pública usando HMAC-SHA256
        const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');

        // Pegamos os primeiros 52 bits do hash (padrão da indústria de iGaming)
        const h = parseInt(hash.slice(0, 52 / 4), 16);
        const e = Math.pow(2, 52);

        // O multiplicador exato (se h for divisível, dá crash no 1.00x para dar vantagem pra casa)
        if (h % 33 === 0) return 1.00; // House edge (Margem do cassino de ~3%)

        // Calcula o ponto de crash
        const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100;

        // Retorna no máximo 1000x para não quebrar o banco, e no mínimo 1.00x
        return Math.max(1.00, Math.min(crashPoint, 1000.00));
    }
}