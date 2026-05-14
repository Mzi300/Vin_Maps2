export declare class AppController {
    getHealth(): {
        status: string;
        tactical_link: string;
        timestamp: string;
        project: string;
        version: string;
        uptime: number;
    };
    getHello(): string;
}
