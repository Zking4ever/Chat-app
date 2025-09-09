import { View,Text, ImageBackground } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import styles from '@/constants/styles';

interface Movie {
    poster_path?: string;
    // add other properties as needed
}

interface CardsProps {
    movies: Movie[];
}

export default function Cards({ movies }: CardsProps){
    const moviesList = movies;
    const length = moviesList.length;
    const firstCardAnimation = useSharedValue(0);
    const secondCardAnimation = useSharedValue(0);
    
    const firstcard = useAnimatedStyle(() => ({
        transform: [{ rotateZ: `${firstCardAnimation.value}deg` }],
        width:"30%",
        maxWidth:160,
        aspectRatio:2.5/3,
        borderRadius: 5,
        overflow:'hidden'
    }));
    const thirdcard = useAnimatedStyle(() => ({
        transform: [{ rotateZ: `${secondCardAnimation.value}deg` }],
        width:"30%",
        maxWidth:160,
        aspectRatio:2.5/3,
        borderRadius: 5,
        overflow:'hidden'
    }));

    useEffect(() => {
        firstCardAnimation.value = withRepeat(
        withSequence(withTiming(0, { duration: 1000 }), withTiming(-10, { duration: 1000 })),
        1 // Run the animation 1 times
        );
        secondCardAnimation.value = withRepeat(
        withSequence(withTiming(0, { duration: 1000 }), withTiming(10, { duration: 1000 })),
        1 // Run the animation 1 times
        );
    }, [firstCardAnimation,secondCardAnimation]);

    //if movies exist pick three random movies
     const randomThree = () => {
                    //lets create three random index to load movies
                    const rand = Math.floor(Math.random() * (length));
                    var rand2 = Math.floor(Math.random() * (length));
                    while(rand==rand2){ //making sure they are different
                        rand2 = Math.floor(Math.random() * (length));
                    }
                    const rand3 = Math.floor((rand+rand2)%length);
            
                    return [rand,rand2,rand3];
                }
    const index = (moviesList?randomThree():[1,2,3]);
    const baseUrl = "https://image.tmdb.org/t/p/w500";
    return(
        <View style={styles.cards}>
              <Animated.View style={firstcard}>
                <ImageBackground 
                    source={{uri:`${baseUrl}${moviesList[index[0]]?.poster_path}`}}
                    style={{alignSelf:"center",width:"100%",height:"100%",overflow:"hidden"}}
                    ><Text></Text></ImageBackground>
                </Animated.View>
              <View style={styles.card}>
                <ImageBackground 
                    source={{uri:`${baseUrl}${moviesList[index[1]]?.poster_path}`}}
                    style={{alignSelf:"center",width:"100%",height:"100%"}}
                    ></ImageBackground>
            </View>
              <Animated.View style={thirdcard}>
                <ImageBackground 
                    source={{uri:`${baseUrl}${moviesList[index[2]]?.poster_path}`}}
                    style={{alignSelf:"center",width:"100%",height:"100%"}}></ImageBackground>
                </Animated.View>
        </View>
    )
}