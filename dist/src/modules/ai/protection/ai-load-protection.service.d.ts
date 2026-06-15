export declare class AILoadProtectionService {
    private readonly logger;
    private concurrentExecutions;
    private readonly MAX_CONCURRENT;
    executeProtected<T>(operation: () => Promise<T>): Promise<T>;
}
