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
      <Text style={{fontSize:28,color:'scenet'}}>Create an account</Text>
      <View style={Style.inputContainer}>
        <Text style={{fontSize:18,marginVertical:5}}>Full Name</Text>
        <TextInput 
            style={{height:40,borderWidth:1}}
            
            />
      </View>
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
        <Button title='Register'/>
      </View>
      <Text style={{fontSize:16,marginTop:50}}>Already have account? <Link href={'./Login'} style={{color:'blue'}} onPress={()=>navigator.navigate('Login')}>Sign in</Link></Text>
    </View>
  )
}
