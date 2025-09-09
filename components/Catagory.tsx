import { Text,TouchableOpacity } from "react-native";
import styles from "@/constants/styles";
import useStore from "@/stores/store";
import { IconSymbol } from "./ui/IconSymbol";
import { router } from "expo-router";

function Catagory({CatInfo}){
    
    const {catagory,setCatagory} = useStore();

    const handlePress = (key)=>{
            setCatagory(key);
            router.push('/catagory-details');
        }

    const catKey = CatInfo.key;
    return <TouchableOpacity onPress={()=>handlePress(catKey)} style={styles.catagoryButton}>
                <IconSymbol color={"azure"} name={CatInfo.icon}/>
                <Text style={{fontSize:24,textAlign:"center"}}>{CatInfo.name}</Text>
            </TouchableOpacity>
}

export default Catagory;