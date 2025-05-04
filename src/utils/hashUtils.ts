import CryptoJS from 'crypto-js';
import { ImageMetadata } from '../types';

export const hashImageAndMetadata = (
    base64Image: string,
    metadata: ImageMetadata
): string => {
    const dataToHash = base64Image + JSON.stringify(metadata);
    return CryptoJS.SHA256(dataToHash).toString();
};
