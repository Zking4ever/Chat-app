import { Text,View,TouchableOpacity,ImageBackground } from "react-native"
import { router } from 'expo-router';
import useStore from '@/stores/store';
import styles from '@/constants/styles';

export default function MovieCard({title,rating,posterPath,id}){
  const baseUrl = "https://image.tmdb.org/t/p/w500/";

  const { selectedMovie, setSelectedMovie } = useStore();
  const handleSelectMovie = async(movieid)=>{
      setSelectedMovie(movieid);
      router.push('/details');
  }

    return(
        <TouchableOpacity style={[styles.movie]} onPress={() => handleSelectMovie(id)}>
          <ImageBackground 
            source={{uri:`${baseUrl}${posterPath}`}}
            style={{width: '100%', height: '100%',justifyContent:'flex-end'}}
            resizeMode="cover">
                  <View style={styles.details}>
                    <Text numberOfLines={1} style={styles.movieTitle}>{title}</Text>
                    <Text style={styles.movieRating}>⭐{rating}/10</Text>
                  </View>
          </ImageBackground>
        </TouchableOpacity>
    )
}