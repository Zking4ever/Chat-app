import { ImageBackground } from 'react-native';
import './slider.css'

export default function Slider() {

  const moviesList = [
    
    [
      {
        "backdrop_path": "/pcJft6lFWsJxutwpLHVYfmZRPQp.jpg",
        "id": 604079,
        "title": "The Long Walk",
        "original_title": "The Long Walk",
        "overview": "In a dystopian, alternate-America ruled by a totalitarian regime, fifty teenage boys take part in a deadly annual walking contest, forced to maintain a minimum pace or be executed, until only one survivor remains.",
        "poster_path": "/wobVTa99eW0ht6c1rNNzLkazPtR.jpg",
        "media_type": "movie",
        "original_language": "en",
      },
      {
          "backdrop_path": "/aHj7d7wSLqrg5cjAcgHhiGr97Ih.jpg",
          "id": 798645,
          "title": "The Running Man",
          "original_title": "The Running Man",
          "overview": "Desperate to save his sick daughter, working-class Ben Richards is convinced by The Running Man's charming but ruthless producer to enter the deadly competition game as a last resort. But Ben's defiance, instincts, and grit turn him into an unexpected fan favorite — and a threat to the entire system. As ratings skyrocket, so does the danger, and Ben must outwit not just the Hunters, but a nation addicted to watching him fall.",
          "poster_path": "/dKL78O9zxczVgjtNcQ9UkbYLzqX.jpg",
          "media_type": "movie",
          "original_language": "en",
      },
      {
          "backdrop_path": "/tql3kTLmF2FFeSVIlafFJiZfcfk.jpg",
          "id": 1415974,
          "title": "Raat Akeli Hai: The Bansal Murders",
          "original_title": "रात अकेली है: भाग २ - बंसल हत्याकांड",
          "overview": "When members of the Bansal family are found murdered, Inspector Jatil Yadav uncovers a trail of greed, betrayal and secrets tied to a deadly conspiracy.",
          "poster_path": "/8EpDSwnjMBc9dmTPEYBF4Bixmwf.jpg",
          "media_type": "movie",
          "original_language": "hi",
      },
    ],
    [
      {
          "backdrop_path": "/yfnDgz3Kiv0IkdujrFRh1vcd7Yu.jpg",
          "id": 62,
          "title": "2001: A Space Odyssey",
          "original_title": "2001: A Space Odyssey",
          "overview": "Humanity finds a mysterious object buried beneath the lunar surface and sets off to find its origins with the help of HAL 9000, the world's most advanced super computer.",
          "poster_path": "/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg",
          "media_type": "movie",
          "original_language": "en",
      },
      {
          "adult": false,
          "backdrop_path": "/kfXgo2rMF1A19celCwLyQ4Xwpf8.jpg",
          "id": 1218925,
          "title": "Chainsaw Man - The Movie: Reze Arc",
          "original_title": "劇場版 チェンソーマン レゼ篇",
          "overview": "In a brutal war between devils, hunters, and secret enemies, a mysterious girl named Reze has stepped into Denji's world, and he faces his deadliest battle yet, fueled by love in a world where survival knows no rules.",
          "poster_path": "/pHyxb2RV5wLlboAwm9ZJ9qTVEDw.jpg",
          "media_type": "movie",
          "original_language": "ja",
      },
      {
          "adult": false,
          "backdrop_path": "/zpEWFNqoN8Qg1SzMMHmaGyOBTdW.jpg",
          "id": 1054867,
          "title": "One Battle After Another",
          "original_title": "One Battle After Another",
          "overview": "Washed-up revolutionary Bob exists in a state of stoned paranoia, surviving off-grid with his spirited, self-reliant daughter, Willa. When his evil nemesis resurfaces after 16 years and she goes missing, the former radical scrambles to find her, father and daughter both battling the consequences of his past.",
          "poster_path": "/r4uXvqCeco0KmO0CjlhXuTEFuSE.jpg",
          "media_type": "movie",
          "original_language": "en",
      },
    ],
    [
      {
        "backdrop_path": "/tN3pTxkQoP96wtaEahYuRVdUWb2.jpg",
        "id": 701387,
        "title": "Bugonia",
        "overview": "Two conspiracy obsessed young men kidnap the high-powered CEO of a major company, convinced that she is an alien intent on destroying planet Earth.",
        "poster_path": "/oxgsAQDAAxA92mFGYCZllgWkH9J.jpg",
        "media_type": "movie",
        "original_language": "en",
      },
      {
          "backdrop_path": "/7JNzw1tSZZEgsBw6lu0VfO2X2Ef.jpg",
          "id": 19995,
          "title": "Avatar",
          "poster_path": "/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg",
          "media_type": "movie",
          "original_language": "en",
          "popularity": 83.845,
      },
      {
          "backdrop_path": "/yfnDgz3Kiv0IkdujrFRh1vcd7Yu.jpg",
          "id": 62,
          "title": "2001: A Space Odyssey",
          "original_title": "2001: A Space Odyssey",
          "overview": "Humanity finds a mysterious object buried beneath the lunar surface and sets off to find its origins with the help of HAL 9000, the world's most advanced super computer.",
          "poster_path": "/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg",
          "media_type": "movie",
          "original_language": "en",
      }
    ]
]
  const baseUrl = "https://image.tmdb.org/t/p/w500/";

  return (
    <div 
        style={{
          display:'flex',
          flexDirection:'column',
          gap:5,
          transform:'rotate(-5deg)',
          position:'absolute',
          opacity:0.4,
          backgroundColor:'transparent'
        }}>
          {
          moviesList.map((moviearray)=>{
              return (
                <div className="sliderContainer" >
                  <div className="slider" key={moviearray[0].id}>
                    {moviearray.map((movie)=>{
                      return <div className='card' key={movie.original_title}>
                        <ImageBackground
                          source={{uri:`${baseUrl}${movie.poster_path}`}} 
                          style={{width: '100%', height: '100%',justifyContent:'flex-end'}}/>
                      </div>;
                    })}
                  </div>
                  <div className="slider"  key={moviearray[1].id}>
                    {moviearray.map((movie)=>{
                      return <div className='card' key={movie.title}>
                        <ImageBackground
                          source={{uri:`${baseUrl}${movie.poster_path}`}} 
                          style={{width: '100%', height: '100%',justifyContent:'flex-end'}}/>
                      </div>;
                    })}
                  </div>
                </div>
              );
              
          })
          }
          </div>
  )
}

