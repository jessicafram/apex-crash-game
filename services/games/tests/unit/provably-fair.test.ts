import { describe, it, expect } from "bun:test";
import { ProvablyFairService } from '../../src/domain/services/provably-fair.service';

describe('ProvablyFairService - Regras do Cassino', () => {
    it('deve gerar sempre o mesmo Crash Point para a mesma semente secreta (Determinístico)', () => {
        const serverSeed = 'semente_secreta_do_nosso_cassino_123';

        const crashPoint1 = ProvablyFairService.calculateCrashPoint(serverSeed);
        const crashPoint2 = ProvablyFairService.calculateCrashPoint(serverSeed);

        // Prova que o cassino não rouba: o resultado nunca muda pra mesma semente!
        expect(crashPoint1).toBe(crashPoint2);
        expect(crashPoint1).toBeGreaterThanOrEqual(1.0);
    });

    it('deve gerar um hash SHA-256 de 64 caracteres', () => {
        const hash = ProvablyFairService.hashServerSeed('minha_semente');
        expect(hash).toBeDefined();
        expect(hash.length).toBe(64);
    });
});