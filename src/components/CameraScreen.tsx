import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { extractMetadata } from '../utils/metadata';
import { hashImageAndMetadata } from '../utils/hashUtils';
import { addBlock } from '../utils/blockchain';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;


const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back;

  {device != null && (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      photo={true}
    />
  )}


  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'authorized');
    })();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePhoto({
        // quality: 90,
        flash: 'off',
      });

      const base64Image = await RNFS.readFile(photo.path, 'base64');

      const metadata = extractMetadata(base64Image);
      const imageHash = hashImageAndMetadata(base64Image, metadata);
      await addBlock(imageHash, photo.path, metadata);

      Alert.alert('Success', 'Photo captured and logged on blockchain!');
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to capture photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.centeredContainer}><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.centeredContainer}><Text>No access to camera. Please enable camera permissions.</Text></View>;
  }

  if (!device) {
    return <View style={styles.centeredContainer}><Text>Loading camera...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
      />
      <TouchableOpacity 
        style={styles.captureButton} 
        onPress={takePhoto}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.captureText}>Snap</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.captureButton, { bottom: 100 }]}
        onPress={() => navigation.navigate('Gallery')}
      >
        <Text style={styles.captureText}>Go to Gallery</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  camera: { 
    flex: 1 
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#1e90ff',
    padding: 20,
    borderRadius: 50,
    opacity: 1
  },
  captureText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CameraScreen;