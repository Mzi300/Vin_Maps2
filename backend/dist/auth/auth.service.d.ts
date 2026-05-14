import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    login(operator: any): Promise<{
        access_token: string;
        operator: {
            id: any;
            rank: string;
        };
    }>;
}
