import { Link } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

export default function Welcome() {
  return (
    <View style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
      <Text style={{fontSize:40}}>Hey there</Text>
      <Link href={'./Login'} style={{paddingHorizontal:40,paddingVertical:10,fontSize:30,backgroundColor:'gray',color:'white',borderRadius:10}}>Get Started</Link>
    </View>
  )
}
