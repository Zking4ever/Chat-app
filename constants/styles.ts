import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  wrapper:{
    backdropFilter:"blur(10px)",
    backgroundColor: '#1e2939',
  },
  title:{
    fontSize:40,
    color: "rgba(255, 255, 255, 0.87)",
  },
  subtitle:{
    fontSize:12,
    color: "rgba(255, 255, 255, 0.87)",
    backgroundColor:"transparent",
  },
  hero:{
    height:500,
    justifyContent:"center",
    alignItems:"center",
    textAlign:"center",
    top:20,
  },
  cards:{
    flexDirection:"row",
    gap:1,
    width:"100%",
    justifyContent:"center",
  },
  card:{
    width:"30%",
    maxWidth:160,
    aspectRatio:2.5/3,
    borderRadius: 5,
    backgroundColor:"azure",
    backgroundPosition: "center",
    backgroundSize: "cover",
    zIndex:1,
    transform:"translateY(-12px)",
    overflow:'hidden'
  },
  catagory:{
    borderRadius:10,
    margin:5,
    padding:3
  },
  catagoryContainer:{
    padding:8,
    flexDirection:"row",
    flexWrap:"wrap",
    rowGap:12,
    justifyContent:"space-around",
  },
  catagoryButton:{
    padding:10 ,
    backgroundColor:"rgba(255, 255, 255, 0.1)",
    borderRadius:10,
    flexDirection:"column",
    justifyContent:"center",
    alignItems: "center",
    gap:5,
    width:120
  },
  catagorytitle:{
    textAlign:"center",
    fontSize:28,
    marginBottom:5
  },
  catTitle:{
    fontSize:23,
    color:"azure",
    marginVertical:10,
  },
  movies:{
    rowGap:18,
    margin:"auto",
    width:"95%",
    marginBottom:50,
    padding:10,
  },
  movie:{
    width:"48%",
    aspectRatio:9/16,
    marginRight:"4%",
    backgroundColor:'rgba(255, 255, 255, 0.1)',
    borderRadius:10,
    backgroundPosition: "center",
    backgroundSize: "cover",
    marginBottom:10,
  },
  details:{
    padding:5,
    backgroundColor:"rgba(0, 0, 0, 0.5)",
  },
  movieTitle:{
    fontSize:30,
    color:"azure",
    textOverflow:"ellipsis",
    overflow:"hidden",
  },
  movieRating:{
    fontSize:22,
    color:"azure"
  }
});

export default styles;
