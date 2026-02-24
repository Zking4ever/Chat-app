import React from 'react';
import { SafeAreaView, Text, TextInput } from 'react-native';

export default function Home() {
  const network = 0;
  return (
    <SafeAreaView style={{paddingTop:40,marginHorizontal:10}}>
      <Text>Connecting...</Text>
      <Text>Home</Text>
      <TextInput style={{borderWidth:1}}/>
      <Text>Home</Text>
      <Text>Home</Text>
    </SafeAreaView>
  )
}
