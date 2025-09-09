import { Text, View, TouchableOpacity,ScrollView,FlatList} from 'react-native';
import {useState, useEffect,useContext} from 'react'
import {GenereData,MoodData} from "@/constants/data"
import styles from '@/constants/styles';
import Cards from '@/components/Cards';
import MovieCard from '@/components/MovieCard'
import { IconSymbol } from '@/components/ui/IconSymbol';
import { GlobalContext } from '@/components/Globalprovider';
import { useNavigation } from '@react-navigation/native';


export default function HomeScreen() {
  const [movies,setMovies] = useState([]);
  const { selectedMovie } = useContext(GlobalContext);
  const navigation = useNavigation();
  //to navigate through movie details screen when a movie is selected

  const getMovies = async() => {
    try {
          const response = await fetch('https://moviemate-beta.vercel.app/api/trending/movies/1',{
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          const movie = data.movies.results;
          setMovies(movie);
      } catch (error) {
          console.log('Error fetching data from backend:', error);
          setMovies([]);
      }
    }
    useEffect(() => {
      getMovies();
    }, []);
    useEffect(() => {
    if (selectedMovie) {
      // Navigate when selectedMovie changes
      navigation.navigate('MovieDetails', { movie: selectedMovie });
    }
  }, [selectedMovie]);

  return (
    <ScrollView style={{backgroundColor:"#242424",}}>
     
        <ScrollView>
         <Text style={{fontSize:32,color:"azure",marginLeft:20,marginBottom:10}}>Trending Movies</Text>
          {movies.length > 0 ? (
            <FlatList
              data={movies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <MovieCard title={item.title} rating={item.vote_average} posterPath={item.poster_path} />
              )}
              numColumns={2}
              contentContainerStyle={styles.movies}
              ListHeaderComponent={<View>
                                      <View style={styles.hero}>
                                          {movies.length>0 && <Cards movies={movies}/>}
                                          <Text style={styles.title}>MovieMate</Text>
                                          <Text style={styles.subtitle}>Discover your next favorite movie</Text>
                                      </View>
                                      <View>
                                        <Text style={{fontSize:32,color:"azure"}}>Watch based on </Text>
                                        <View style={styles.catagory}>
                                          <Text style={styles.catagorytitle}>Genres</Text>
                                          <View style={styles.catagoryContainer}>
                                            {GenereData.map((catagory)=>(
                                              <TouchableOpacity style={styles.catagoryButton}>
                                                <IconSymbol color={"azure"} name={catagory.icon}/>
                                                <Text style={{fontSize:24,textAlign:"center"}}>{catagory.name}</Text>
                                              </TouchableOpacity>))}
                                          </View>
                                        </View>
                                        <View style={styles.catagory}>
                                          <Text style={styles.catagorytitle}>Mood</Text>
                                          <View style={styles.catagoryContainer}>
                                            {MoodData.map((catagory)=>(
                                              <TouchableOpacity style={styles.catagoryButton}>
                                                <IconSymbol color={"azure"} />
                                                <Text style={{fontSize:24,textAlign:"center"}}>{catagory.name}</Text>
                                              </TouchableOpacity>))}
                                          </View>
                                        </View>
                                      </View>
                                  </View>
            }
            />
          ) : (
            <Text style={{color:"azure",fontSize:14,textAlign:"center"}}>Loading movies...</Text>
          )}
          </ScrollView>
    </ScrollView>
  );
}
