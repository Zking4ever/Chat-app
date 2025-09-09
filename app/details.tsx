import { View, Text, ScrollView, ImageBackground,StyleSheet, TouchableOpacity,FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import useStore from '@/stores/store';
import WebView from 'react-native-webview';
import MovieCard from '@/components/MovieCard';

export default function Details() {

  const { selectedMovie, setSelectedMovie } = useStore();
  const backendURL = "https://moviemate-beta.vercel.app";
  //state to hold movie details
  const [movieInfo,setMovieInfo] = useState(null);
  const [isLoading,setIsLoading] = useState(true);
  const [showTrailer,setShowTrailor] = useState(false);
  const [trailerLink,setTrailerLink] = useState(null);
  const [relatedMovies,setRelatedMovies] = useState(null);


  //function to fetch movie details from backend
const getMovieInfo = async(id)=>{
      setIsLoading(true);
        try {
            const response = await fetch(`${backendURL}/api/movie/${id}`);
            const data = await response.json();
            setMovieInfo(data);
        } catch (error) {
            console.error("Error fetching from backend "+error);
        }
        finally{
          setIsLoading(false);
        }
    }
const openTrailer = (link) =>{
    setShowTrailor(true);
    setTrailerLink(link)
}
const closeTrailer = ()=>{
    setShowTrailor(false);
    setTrailerLink(null);
}
  

//based on the genere the movie belongs fetching related movies
const getRelatedMovies = async()=>{
  const generes = (movieInfo.genres.map((genere,i)=>(genere.id)));
  try {
      const response = await fetch(`${backendURL}/api/movies/genere/${generes}`);
      const data = await response.json();
      const related = data.results.filter((movie)=>(movie.id!==movieInfo.id));
      setRelatedMovies(related);
  } catch (error) {
      console.error("Error fetching related movies from backend "+error);
  }
}   
    useEffect(()=>{ 
      if(selectedMovie){
        getMovieInfo(selectedMovie);
      }
    },[selectedMovie]);
    useEffect(()=>{
       if(movieInfo){
        getRelatedMovies();
      }
    },[movieInfo]);

    if(isLoading){
      return (<View className="loading">
                <Text>Loading...</Text>
              </View>);
    }
    if(movieInfo.length!==0){
          const imageUrl = "https://image.tmdb.org/t/p/w500" + movieInfo.poster_path;
          const Videos = movieInfo.videos.results;
          return (
  movieInfo&& <FlatList 
            data={relatedMovies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <MovieCard title={item.title} rating={item.vote_average} posterPath={item.poster_path} id={item.id} />
            )}
            numColumns={2}
            style={styles.wrapper}
            contentContainerStyle={styles.movies}
            ListHeaderComponent={
                            <View className="container">
                                          <View style={styles.container}>
                                            <View  style={styles.poster}><ImageBackground source={{uri:`${imageUrl}`}} style={{width:'100%',height:'100%'}} resizeMode="cover"/></View>
                                            <View style={styles.discription}>
                                                <Text style={styles.title}> {movieInfo.original_title}</Text>
                                                <Text style={styles.date}> {movieInfo.release_date}</Text>
                                                <Text style={styles.rating}>  ⭐{movieInfo.vote_average}/10</Text>
                                                {Videos&&Videos.map((video)=>{var link="https://youtube.com/embed/"+video.key; return (video.type==="Trailer"&&video.name.toLowerCase().includes("official trailer")?<TouchableOpacity style={styles.button} onPress={()=>openTrailer(link)}><Text>{video.name}</Text></TouchableOpacity> : "")})}
                                            </View>
                                          </View>
                                            <Text style={styles.details}>{movieInfo.overview}</Text>
                                                <View style={styles.subDetail_container}>
                                                    <Text style={styles.subDetail}>Runtime:{movieInfo.runtime}</Text>
                                                    <Text style={styles.subDetail}>Generes: {movieInfo.genres.map((genere,i)=>(genere.name+(i!=movieInfo.genres.length-1? ", ": "")))}</Text>
                                                    <Text style={styles.subDetail}>Votes:{movieInfo.vote_count}</Text>
                                                </View>  
                                            {showTrailer && <View style={styles.trailer_container}>
                                                <WebView  style={styles.trailer}
                                                          source={{ uri: trailerLink || 'https://youtube.com/embed/Ldmhii3Jd1c' }}
                                                          allowsFullscreenVideo
                                                          allowsInlineMediaPlayback></WebView>
                                                <TouchableOpacity style={styles.close} onPress={()=>closeTrailer()}><Text>❌close</Text></TouchableOpacity>
                                            </View> }
                                        <View style={{margin:10}}><Text style={{fontSize:20,color:'azure',fontWeight:'bold'}}>Related Movies</Text></View>
                                  </View>
                                        
            }
            />
          );
    }
  
}
const styles = StyleSheet.create({
  wrapper:{
    backgroundColor: '#151718',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  poster:{
    width:120,
    height:180,
    marginTop:50,
    marginLeft:10,
    borderRadius:10,
    overflow:'hidden',
    borderColor:'azure',
    borderWidth:1
  },
  discription:{
    marginLeft:5,
    marginTop:50,
    flexDirection:'column',
  },
  title:{
    fontSize:26,
    color:"azure",
    fontWeight:"bold",
  },
  date:{
    fontSize:13,
    color:"#9BA1A6",
    margin:10,
    marginTop:0,
    marginBottom:3
  },
  rating:{
    fontSize:18,
    color:"azure",
    marginTop:10,
  },
  button:{
    marginTop:10,
    backgroundColor:"#e50914",
    padding:10,
    borderRadius:5,
    textAlign:"center",
    color:'azure',
    fontWeight:"bold",
    fontSize:16,
  },
  details:{
    fontFamily:'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji",',
    fontSize:16,
    margin:10,
    color:"azure",
    padding:5
  },
  subDetail_container:{
    margin:15,
    marginTop:0,
  },
  subDetail:{
    color:"#99a1af",
  },
  trailer_container:{
    width:'100%',
    height:300,
    marginTop:20,
    marginBottom:20,
    backgroundColor:'red',
    position:'relative'
  },
  trailer:{
    width:"100%",
    height:300,
  },
  close:{
    position:'absolute',
    top:-20,
    backgroundColor:'rgba(255, 255, 255, 0.7)',
    padding:5,
    borderRadius:5,
    right:10,
  }
});