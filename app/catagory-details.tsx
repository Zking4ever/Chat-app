import { View,Text,FlatList } from "react-native";
import {useState,useEffect} from 'react';
import useStore from "@/stores/store";
import {GenereData,MoodData} from '@/constants/data'
import MovieCard from "@/components/MovieCard";
import styles from "@/constants/styles";

const backendUrl = 'https://moviemate-beta.vercel.app';

//change the objects data to array to use by index
const GenereCat = Object.values(GenereData);
const MoodCat = Object.values(MoodData);

function CatagoryMovies(){
    
    const {catagory} = useStore();

    const currentCatagory = (catagory<=5)? GenereCat[catagory]:MoodCat[catagory%6];
    const [movies,setMovies] = useState([]);
    const [isloading,setIsloading] = useState(true);

    useEffect(()=>{
        if(!currentCatagory) return;
        getCatagoryMovies();
    },[catagory])

    const getCatagoryMovies = async()=>{
            const genreid = currentCatagory.id;
            setIsloading(true);
            try {
                const response = await fetch(`${backendUrl}/api/movies/genere/${genreid}`)
                const data = await response.json();
                setMovies(data.results);
                console.log(data);
                
            } catch (error) {
                console.log('Error geting catagory movies')
            }finally{
                setIsloading(false);
            }
    }
    if(isloading){
        return(
            <Text style={{color:'gray'}}>Loading...</Text>
        )
    }

    return(
        <FlatList
              data={movies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <MovieCard title={item.title} rating={item.vote_average} posterPath={item.poster_path} id={item.id} />
              )}
              numColumns={2}
              style={styles.wrapper}
              contentContainerStyle={styles.movies}
              ListHeaderComponent={
                    <Text style={styles.catTitle}>Movies for "{currentCatagory.name}"</Text>
              }>
        </FlatList>
    )
}

export default CatagoryMovies;