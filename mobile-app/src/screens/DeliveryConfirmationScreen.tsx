import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Button, TextInput, Checkbox, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import SignatureCanvas from 'react-native-signature-canvas';
import { DeliveryService } from '../services/DeliveryService';

type RouteParams = {
  orderId: string;
  stopId: string;
};

const DeliveryConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, stopId } = route.params as RouteParams;
  
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [handedToCustomer, setHandedToCustomer] = useState(false);
  
  const signatureRef = useRef(null);
  
  const handleSignature = (signature: string) => {
    setSignature(signature);
  };
  
  const clearSignature = () => {
    if (signatureRef.current) {
      // @ts-ignore
      signatureRef.current.clearSignature();
    }
    setSignature(null);
  };
  
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to grant camera permission to take photos.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };
  
  const handleConfirmDelivery = async () => {
    if (!handedToCustomer && !signature && !photo) {
      Alert.alert(
        'Missing Confirmation', 
        'Please provide at least one form of delivery confirmation (signature, photo, or confirm hand delivery).'
      );
      return;
    }
    
    try {
      setLoading(true);
      
      const deliveryProof = {
        signature: signature,
        photo: photo,
        notes: notes,
        handedToCustomer: handedToCustomer,
        timestamp: new Date().toISOString(),
      };
      
      await DeliveryService.confirmDelivery(orderId, stopId, deliveryProof);
      
      Alert.alert(
        'Success', 
        'Delivery confirmed successfully!',
        [{ text: 'OK', onPress: () => navigation.navigate('DeliveryList') }]
      );
    } catch (error) {
      console.error('Error confirming delivery:', error);
      Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Confirm Delivery</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Confirmation</Text>
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={handedToCustomer ? 'checked' : 'unchecked'}
            onPress={() => setHandedToCustomer(!handedToCustomer)}
          />
          <Text style={styles.checkboxLabel}>
            I confirm that I handed the package directly to the customer
          </Text>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Signature</Text>
        <View style={styles.signatureContainer}>
          {signature ? (
            <Image
              source={{ uri: signature }}
              style={styles.signatureImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.signaturePlaceholder}>
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleSignature}
                webStyle={`
                  .m-signature-pad--footer {display: none; margin: 0px;}
                  body {width: 100%; height: 100%;}
                  .m-signature-pad {width: 100%; height: 100%;}
                  canvas {width: 100%; height: 100%;}
                `}
              />
            </View>
          )}
        </View>
        <Button 
          mode="outlined" 
          onPress={clearSignature} 
          style={styles.button}
        >
          Clear Signature
        </Button>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Photo</Text>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text>No photo taken</Text>
          </View>
        )}
        <Button 
          mode="outlined" 
          icon="camera" 
          onPress={takePhoto} 
          style={styles.button}
        >
          {photo ? 'Retake Photo' : 'Take Photo'}
        </Button>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Notes</Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={4}
          placeholder="Add any notes about this delivery (optional)"
          value={notes}
          onChangeText={setNotes}
          style={styles.notesInput}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <Button 
              mode="contained" 
              icon="check-circle" 
              onPress={handleConfirmDelivery} 
              style={styles.submitButton}
            >
              Confirm Delivery
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()} 
              style={styles.button}
            >
              Cancel
            </Button>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    flex: 1,
  },
  signatureContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  signaturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginVertical: 16,
  },
  button: {
    marginVertical: 8,
  },
  submitButton: {
    marginVertical: 8,
    backgroundColor: '#4CAF50',
  },
});

export default DeliveryConfirmationScreen;