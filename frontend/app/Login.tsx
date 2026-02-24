import { useNavigation } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native'
import { authAPI } from '../lib/api'

const Style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
    color: '#333'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#075E54' // WhatsApp green
  }
})

export default function Login() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber) return Alert.alert('Error', 'Please enter a phone number');
    setLoading(true);
    try {
      // In a real app, trigger Firebase Phone Auth here
      // For now, we simulate sending OTP
      console.log('Sending OTP to', phoneNumber);
      setStep('otp');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter the OTP');
    setLoading(true);
    try {
      // Simulate Firebase verification
      const response = await authAPI.login(phoneNumber);
      const user = response.data;
      // Store user in global state/storage (e.g. Zustand)
      console.log('Logged in user:', user);
      navigation.navigate('Home' as never);
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={Style.container}>
      <Text style={Style.title}>WhatsApp Clone</Text>

      {step === 'phone' ? (
        <View style={Style.inputContainer}>
          <Text style={Style.label}>Phone Number</Text>
          <TextInput
            style={Style.input}
            placeholder="+1234567890"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <View style={{ marginTop: 20 }}>
            <Button title={loading ? 'Sending...' : 'Send OTP'} onPress={handleSendOTP} color="#25D366" />
          </View>
        </View>
      ) : (
        <View style={Style.inputContainer}>
          <Text style={Style.label}>Enter OTP</Text>
          <TextInput
            style={Style.input}
            placeholder="123456"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <View style={{ marginTop: 20 }}>
            <Button title={loading ? 'Verifying...' : 'Verify & Continue'} onPress={handleVerifyOTP} color="#25D366" />
          </View>
          <Text
            style={{ color: 'blue', marginTop: 15, textAlign: 'center' }}
            onPress={() => setStep('phone')}
          >
            Change Phone Number
          </Text>
        </View>
      )}
    </View>
  )
}
