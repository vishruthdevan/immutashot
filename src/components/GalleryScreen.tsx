import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import { getBlockchain } from '../utils/blockchain';
import { hashImageAndMetadata } from '../utils/hashUtils';
import { Block } from '../types';

const GalleryScreen: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [validity, setValidity] = useState<boolean[]>([]);

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const chain = await getBlockchain();
        setBlocks(chain);

        const results = await Promise.all(
          chain.map(async (block) => {
            try {
              const filePath = block.imageHash; // Or store separate imagePath in future
              const imageBase64 = await RNFS.readFile(filePath, 'base64');
              const recomputedHash = hashImageAndMetadata(imageBase64, block.metadata);
              return recomputedHash === block.imageHash;
            } catch (e) {
              return false;
            }
          })
        );

        setValidity(results);
      } catch (e) {
        Alert.alert('Error', 'Failed to load gallery.');
      } finally {
        setLoading(false);
      }
    };

    loadBlocks();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <FlatList
      data={blocks}
      keyExtractor={(item) => item.hash}
      renderItem={({ item, index }) => (
        <View style={styles.blockCard}>
          <Image
            source={{ uri: 'file://' + item.imagePath }}
            style={{ width: '100%', height: 200, borderRadius: 8 }}
          />

          <Text style={styles.label}>Timestamp:</Text>
          <Text style={styles.value}>{item.timestamp}</Text>

          <Text style={styles.label}>Image Hash:</Text>
          <Text style={styles.value}>{item.imageHash.slice(0, 20)}...</Text>

          <Text style={styles.label}>Valid:</Text>
          <Text style={[styles.value, { color: validity[index] ? 'green' : 'red' }]}>
            {validity[index] ? 'Yes' : 'Tampered'}
          </Text>
        </View>
      )}
    />
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  blockCard: {
    backgroundColor: '#1e1e1e',
    margin: 10,
    borderRadius: 10,
    padding: 15,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
  },
});
