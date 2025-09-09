import { Text, View, TouchableOpacity,ScrollView,FlatList} from 'react-native';
import {useState, useEffect} from 'react'
import {GenereData,MoodData} from "@/constants/data"
import styles from '@/constants/styles';
import Cards from '@/components/Cards';
import MovieCard from '@/components/MovieCard'
import Catagory from '@/components/Catagory';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HomeScreen() {
  const [movies,setMovies] = useState(null);
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
          setMovies(null);
      }
    }
    useEffect(() => {
      getMovies();
    }, []);

  return (
          true ? (
            <FlatList
              data={movies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <MovieCard title={item.title} rating={item.vote_average} posterPath={item.poster_path} id={item.id} />
              )}
              numColumns={2}
              style={styles.wrapper}
              contentContainerStyle={styles.movies}
              ListHeaderComponent={<View>
                                      <View style={styles.hero}>
                                          {movies !=null && <Cards movies={movies}/>}
                                          <Text style={styles.title}>MovieMate</Text>
                                          <Text style={styles.subtitle}>Discover your next favorite movie</Text>
                                      </View>
                                      <View>
                                        <Text style={{fontSize:32,color:"azure"}}>Watch based on </Text>
                                        <View style={styles.catagory}>
                                          <Text style={styles.catagorytitle}>Mood</Text>
                                          <View style={styles.catagoryContainer}>
                                            {MoodData.map((catagory)=>(<Catagory CatInfo={catagory} />))}
                                          </View>
                                        </View>
                                        <View style={styles.catagory}>
                                          <Text style={styles.catagorytitle}>Genres</Text>
                                          <View style={styles.catagoryContainer}>
                                            {GenereData.map((catagory)=>(<Catagory CatInfo={catagory}/>))}
                                          </View>
                                        </View>
                                        
                                      </View>
                                  <Text style={{fontSize:32,color:"azure",marginLeft:20,marginBottom:10}}>Trending Movies</Text>

                                  </View>
            }
            />
          ) : (
            <Text style={{color:"black",fontSize:14,textAlign:"center"}}>Loading movies...</Text>
          )
  );
}
