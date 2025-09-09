import { Text,View,TouchableOpacity,ImageBackground } from "react-native"
import styles from '@/constants/styles';

export default function MovieCard({title,rating,posterPath}){
  const baseUrl = "https://image.tmdb.org/t/p/w500/";
    return(
        <TouchableOpacity style={[styles.movie]} >
          <ImageBackground 
            source={{uri:`${baseUrl}${posterPath}.jpg`}}
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