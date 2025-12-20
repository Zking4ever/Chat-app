import Slider from '@/components/Slider'
import { Text } from '@react-navigation/elements'
import { router } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

export default function index() {
  return (
    <div
    style={{
      width:'100%',
      height:'100vh',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      position:'relative',
      backgroundColor:'black'
    }}
    >
      <Slider />
        <Text style={{color:'white',fontSize:24}}>MovieMate</Text>
        <Text style={{color:'white',}}>Get a movie that matches your mood</Text>
        <TouchableOpacity 
        onPress={()=>{router.push('/home')}}
        style={{
          width:'80%',
          display:'flex',
          alignItems:'center',
          paddingVertical:5,
          borderStyle:'solid',
          borderWidth:1,
          borderColor:'white',
          borderRadius: 20,
          position:'absolute',
          bottom:50,
          boxShadow:' 0 0 3px white'
        }}>
          <Text style={{color:'white',fontSize:18}}>Get Started</Text>
        </TouchableOpacity>
    </div>
  )
}
