import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  wrapper:{
    backdropFilter:"blur(10px)",
    backgroundColor: '#21393ae8',

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
  catagoryContainer:{
    width:400,
    padding:10,
    alignSelf:'center',
    backgroundColor:'azure',
    borderRadius:15,
    alignItems:'center'
  },
  catagories:{
    padding:3,
    flexWrap:"wrap",
    flexDirection:'row',
    gap:5,
    rowGap:5,
  },
  catagoryButton:{
    paddingVertical:3,
    paddingHorizontal:7,
    backgroundColor:'black',
    borderRadius:10,
  },
  catagorytitle:{
    textAlign:"center",
    fontSize:25,
    margin:3,
    color:"black",
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
