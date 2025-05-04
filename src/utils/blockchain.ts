import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Block } from '../types';

const BLOCKCHAIN_KEY = 'PHOTO_BLOCKCHAIN';

export const getBlockchain = async (): Promise<Block[]> => {
    const stored = await AsyncStorage.getItem(BLOCKCHAIN_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const addBlock = async (
    imageHash: string,
    imagePath: string, // <- Add this
    metadata: any,
): Promise<Block> => {
    const chain = await getBlockchain();
    const lastBlock = chain[chain.length - 1];

    const newBlock: Block = {
        index: chain.length,
        timestamp: new Date().toISOString(),
        imageHash,
        imagePath, // <- Save it here
        metadata,
        previousHash: lastBlock ? lastBlock.hash : '0',
        hash: '', // will be computed below
    };

    newBlock.hash = computeHash(newBlock);
    chain.push(newBlock);
    await AsyncStorage.setItem(BLOCKCHAIN_KEY, JSON.stringify(chain));
    return newBlock;
};


const computeHash = (block: Block): string => {
    const { imageHash, timestamp, metadata, previousHash } = block;
    const blockStr = imageHash + timestamp + JSON.stringify(metadata) + previousHash;
    return CryptoJS.SHA256(blockStr).toString();
};
