import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // Aqui a gente bate no Keycloak para validar se o crachá é verdadeiro ou falsificado!
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: 'http://localhost:8080/realms/crash-game/protocol/openid-connect/certs',
            }),
        });
    }

    // Se o crachá for válido, o NestJS chama essa função e nos entrega os dados do usuário
    async validate(payload: any) {
        // O Keycloak guarda o ID do usuário na variável 'sub'
        return { userId: payload.sub, username: payload.preferred_username };
    }
}