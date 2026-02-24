import { Text,TouchableOpacity } from "react-native";
import styles from "@/constants/styles";
import useStore from "@/stores/store";
import { router } from "expo-router";

function Catagory({CatInfo}){
    
    const {catagory,setCatagory} = useStore();

    const handlePress = (key:number)=>{
            setCatagory(key);
            router.push('/catagory-details?id=keyInHere');
        }

    const catKey = CatInfo.key;
    return <TouchableOpacity onPress={()=>handlePress(catKey)} style={styles.catagoryButton}>
                <Text style={{fontSize:18,textAlign:"center",color:'azure'}}>{CatInfo.name}</Text>
            </TouchableOpacity>
}

export default Catagory;