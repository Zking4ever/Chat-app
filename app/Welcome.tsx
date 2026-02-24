import { useNavigation } from 'expo-router';
import React from 'react';
import { Button, Text, View } from 'react-native';

export default function Welcome() {
  const navigator = useNavigation();
  return (
    <View style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
      <Text style={{fontSize:40}}>Hey there</Text>
      <Button title='Get Started' onPress={()=>navigator.navigate('Login')}/>
    </View>
  )
}
