export declare function uploadAsset(key: string, body: Buffer, contentType: string): Promise<{
    key: string;
    contentType: string;
    bucket: string;
}>;
export declare function getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
//# sourceMappingURL=storage-service.d.ts.map