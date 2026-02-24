import { Link, useNavigation } from 'expo-router'
import React from 'react'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'

const Style = StyleSheet.create({
    container:{
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        height:'100%'
    },
    inputContainer :{
        marginHorizontal:'auto',
        width:'95%'
    }
})

export default function Login() {
  const navigator = useNavigation();
  return (
    <View style={Style.container}>
      <Text style={{fontSize:28,color:'scenet'}}>Welcome back</Text>
      <View style={Style.inputContainer}>
        <Text style={{fontSize:18,marginVertical:5}}>Username</Text>
        <TextInput 
            style={{height:40,borderWidth:1}}
            
            />
      </View>
      <View style={Style.inputContainer}>
        <Text style={{fontSize:18,marginVertical:5}}>Password</Text>
        <TextInput 
            style={{height:40,borderWidth:1}}
            
            />
      </View>
      <View style={[Style.inputContainer,{marginVertical:5}]}>
        <Button title='Login' onPress={()=>navigator.navigate('Home')}/>
      </View>
      <Text style={{fontSize:16,marginTop:50}}>Don't have accpunt? <Link href={'./Register'} style={{color:'blue'}}>Sign up</Link></Text>
    </View>
  )
}
