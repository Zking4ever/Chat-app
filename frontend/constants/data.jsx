//these are the datas to make request based on mood and genere
//using these json data we render the buttons instead of doing it manualy(thats why there is a name)

//to differentiate the type of the catagory based on index
//lets make the mood one string and  use isNaN to check

//gonna change the icon for the corresponding catagory
export const GenereData =[
    { "key":0,
      "name":"Action & Adventure",
      "id":"28,12,10752",
      "icon":"🔫",
    },
    { "key":1,
      "name":"Comedy",
      "id":35,
      "icon":"😆"
    },
    {"key":2,
      "name":"Real & Creative Forms",
        "id":"99,10402,16",
        "icon":"🌠"
    },
    { "key":3,
      "name":"Drama & Romance",
      "id":"18,10749,10751,36",
      "icon":"💝"
    },
    { "key":4,
      "name" : "Sci-Fi & Fantasy",
      "id":"14,878",
      "icon":"😇"
    },
    { "key":5,
      "name" : "Horror & Thriller",
        "id":"27,53,9648,80",
        "icon":"😱"
    }
]

export const MoodData =[
    { "key":"6",
      "name":"Happy",
      "id":"35,10751,12,10402",
      'icon':'😊'
    },
    {"key":"7",
      "name":"Nostalgic",
        "id":"36,10751,16",
        "icon":"🪄"
    },
    { "key":"8",
      "name" : "Relaxed",
        "id":"35,14,10770",
        "icon":"😋"
    },
    { "key":"9",
      "name":"Sad",
      "id":"18,10749,99,36",
      "icon":"😥"
    },
    { "key":"10",
      "name" : "Scared",
      "id":"27,53,9648,80",
      "icon":"👻"
    },
    { "key":"11",
      "name":"Excited",
      "id":"28,12.878,14,10752",
      "icon":"🤩"
    }
]


