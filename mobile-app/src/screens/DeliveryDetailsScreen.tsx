import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider, List, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DeliveryService } from '../services/DeliveryService';
import { Order, DeliveryStatus } from '../../../shared/types/entities/Order';
import { Package } from '../../../shared/types/common/Package';

type RouteParams = {
  orderId: string;
  stopId: string;
};

const DeliveryDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, stopId } = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orderData = await DeliveryService.getOrderDetails(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order details:', error);
        Alert.alert('Error', 'Failed to load delivery details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
  const handleStartDelivery = () => {
    navigation.navigate('DeliveryConfirmation', { orderId, stopId });
  };
  
  const handleReportIssue = () => {
    navigation.navigate('DeliveryIssue', { orderId, stopId });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading delivery details...</Text>
      </View>
    );
  }
  
  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Order not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Customer Information" />
        <Card.Content>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{order.customerName}</Text>
          
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{order.customerPhone}</Text>
          
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>
            {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
          </Text>
          
          {order.specialInstructions && (
            <>
              <Text style={[styles.label, styles.specialInstructions]}>Special Instructions:</Text>
              <Text style={styles.value}>{order.specialInstructions}</Text>
            </>
          )}
          
          {order.timeWindow && (
            <>
              <Text style={styles.label}>Delivery Window:</Text>
              <Text style={styles.value}>
                {new Date(order.timeWindow.start).toLocaleTimeString()} - {new Date(order.timeWindow.end).toLocaleTimeString()}
              </Text>
            </>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Package Details" />
        <Card.Content>
          <List.Section>
            {order.packageDetails.map((pkg: Package, index: number) => (
              <List.Item
                key={pkg.id}
                title={`Package ${index + 1}: ${pkg.description}`}
                description={`Weight: ${pkg.weight}kg • ${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height}cm ${pkg.fragile ? '• FRAGILE' : ''}`}
                left={props => <List.Icon {...props} icon="package-variant" />}
              />
            ))}
          </List.Section>
        </Card.Content>
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          icon="check-circle" 
          style={styles.button} 
          onPress={handleStartDelivery}
        >
          Start Delivery
        </Button>
        
        <Button 
          mode="outlined" 
          icon="alert-circle" 
          style={styles.button} 
          onPress={handleReportIssue}
        >
          Report Issue
        </Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  specialInstructions: {
    color: '#d32f2f',
  },
  buttonContainer: {
    marginVertical: 16,
  },
  button: {
    marginVertical: 8,
  },
});

export default DeliveryDetailsScreen;