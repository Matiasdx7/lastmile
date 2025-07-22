import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Button, TextInput, RadioButton, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { DeliveryService } from '../services/DeliveryService';

type RouteParams = {
  orderId: string;
  stopId: string;
};

type FailureReason = 
  | 'customer_not_available' 
  | 'address_not_found' 
  | 'access_issue' 
  | 'package_damaged' 
  | 'weather_conditions' 
  | 'other';

const failureReasons = [
  { value: 'customer_not_available', label: 'Customer not available' },
  { value: 'address_not_found', label: 'Address not found or incorrect' },
  { value: 'access_issue', label: 'Access issue (gate locked, no entry, etc.)' },
  { value: 'package_damaged', label: 'Package damaged during transit' },
  { value: 'weather_conditions', label: 'Severe weather conditions' },
  { value: 'other', label: 'Other reason' },
];

const DeliveryIssueScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, stopId } = route.params as RouteParams;
  
  const [failureReason, setFailureReason] = useState<FailureReason | null>(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextAction, setNextAction] = useState<'retry_later' | 'return_to_depot'>('retry_later');
  
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
  
  const handleSubmitIssue = async () => {
    if (!failureReason) {
      Alert.alert('Missing Information', 'Please select a reason for the failed delivery.');
      return;
    }
    
    try {
      setLoading(true);
      
      const failureDetails = {
        reason: failureReason,
        notes: notes,
        photo: photo,
        nextAction: nextAction,
        timestamp: new Date().toISOString(),
      };
      
      await DeliveryService.reportDeliveryFailure(orderId, stopId, failureDetails);
      
      Alert.alert(
        'Report Submitted', 
        'Delivery issue has been reported successfully.',
        [{ text: 'OK', onPress: () => navigation.navigate('DeliveryList') }]
      );
    } catch (error) {
      console.error('Error reporting delivery issue:', error);
      Alert.alert('Error', 'Failed to report delivery issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Delivery Issue</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reason for Failed Delivery</Text>
        <RadioButton.Group 
          onValueChange={(value) => setFailureReason(value as FailureReason)} 
          value={failureReason || ''}
        >
          {failureReasons.map((reason) => (
            <View key={reason.value} style={styles.radioItem}>
              <RadioButton value={reason.value} />
              <Text style={styles.radioLabel}>{reason.label}</Text>
            </View>
          ))}
        </RadioButton.Group>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Action</Text>
        <RadioButton.Group 
          onValueChange={(value) => setNextAction(value as 'retry_later' | 'return_to_depot')} 
          value={nextAction}
        >
          <View style={styles.radioItem}>
            <RadioButton value="retry_later" />
            <Text style={styles.radioLabel}>Retry delivery later</Text>
          </View>
          <View style={styles.radioItem}>
            <RadioButton value="return_to_depot" />
            <Text style={styles.radioLabel}>Return package to depot</Text>
          </View>
        </RadioButton.Group>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo Evidence (Optional)</Text>
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
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={4}
          placeholder="Provide additional details about the issue"
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
              icon="alert-circle" 
              onPress={handleSubmitIssue} 
              style={styles.submitButton}
            >
              Submit Report
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
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
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
    backgroundColor: '#FF9800',
  },
});

export default DeliveryIssueScreen;