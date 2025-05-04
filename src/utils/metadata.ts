import piexif from "piexifjs"
import { ImageMetadata } from '../types';

export const extractMetadata = (base64Image: string): ImageMetadata => {
    try {
        const exif = piexif.load(base64Image);
        return {
            DateTime: exif['0th'][piexif.ImageIFD.DateTime],
            GPS: exif.GPS,
        };
    } catch (e) {
        return {};
    }
};
