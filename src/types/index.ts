export interface ImageMetadata {
    DateTime?: string;
    GPS?: Record<string, any>;
    [key: string]: any;
}

export interface Block {
    index: number;
    timestamp: string;
    imagePath: string;     // Add this
    imageHash: string;
    metadata: ImageMetadata;
    previousHash: string;
    hash: string;
}

