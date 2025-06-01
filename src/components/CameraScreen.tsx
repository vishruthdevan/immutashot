import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { extractMetadata } from '../utils/metadata';
import { hashImageAndMetadata } from '../utils/hashUtils';
import { addBlock } from '../utils/blockchain';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons'; // Make sure you have this package installed

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === cameraPosition);

  useEffect(() => {
    (async () => {
      const status = await Camera.getCameraPermissionStatus();
      if (status !== 'granted') {
        const cameraPermission = await Camera.requestCameraPermission();
        setHasPermission(cameraPermission === 'granted');
      } else {
        setHasPermission(true);
      }
    })();
  }, []);

  const takePhoto = async (): Promise<void> => {
    if (!cameraRef.current || isProcessing) {
      return;
    }
    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePhoto({
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
    return (
      <View style={styles.centeredContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Text>No access to camera. Please enable camera permissions.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        enableZoomGesture={false}
        onError={e => {
          console.error('Camera error:', e.message);
          Alert.alert('Camera Error', e.message);
        }}
      />
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => navigation.navigate('Gallery')}
          accessibilityLabel="Go to Gallery"
        >
          <Icon name="images-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.snapButton}
          onPress={takePhoto}
          disabled={isProcessing}
          accessibilityLabel="Take Photo"
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Icon name="camera" size={36} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => setCameraPosition(cameraPosition === 'front' ? 'back' : 'front')}
          accessibilityLabel="Switch Camera"
        >
          <Icon name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    backgroundColor: 'rgba(30,144,255,0.7)',
    padding: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapButton: {
    backgroundColor: '#1e90ff',
    padding: 22,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CameraScreen;