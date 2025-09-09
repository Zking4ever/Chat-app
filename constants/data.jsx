//these are the datas to make request based on mood and genere
//using these json data we render the buttons instead of doing it manualy(thats why there is a name)

//to differentiate the type of the catagory based on index
//lets make the mood one string and  use isNaN to check

//gonna change the icon for the corresponding catagory
export const GenereData =[
    { "key":0,
      "name":"Action & Adventure",
      "id":"28,12,10752,37",
      "icon":"camera",
    },
    { "key":1,
      "name":"Comedy",
      "id":35,
      "icon":"photo"
    },
    {"key":2,
      "name":"Real & Creative Forms",
        "id":"99,10402,10770,16",
        "icon":"umbrella"
    },
    { "key":3,
      "name":"Drama & Romance",
      "id":"18,10749,10751,36",
      "icon":"house"
    },
    { "key":4,
      "name" : "Sci-Fi & Fantasy",
      "id":"14,878",
      "icon":"login"
    },
    { "key":5,
      "name" : "Horror & Thriller",
        "id":"27,53,9648,80",
        "icon":"wifi"
    }
]

export const MoodData =[
    { "key":"6",
      "name":"Happy",
      "id":"35,10751,12,10402"
    },
    {"key":"7",
      "name":"Nostalgic",
        "id":"36,10749,10751,16,37"
    },
    { "key":"8",
      "name" : "Relaxed",
        "id":"35,14,878,99,10770"
    },
    { "key":"9",
      "name":"Sad",
      "icon" : '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 496 512" class="text-blue-400" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zM152 416c-26.5 0-48-21-48-47 0-20 28.5-60.4 41.6-77.8 3.2-4.3 9.6-4.3 12.8 0C171.5 308.6 200 349 200 369c0 26-21.5 47-48 47zm16-176c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm170.2 154.2C315.8 367.4 282.9 352 248 352c-21.2 0-21.2-32 0-32 44.4 0 86.3 19.6 114.7 53.8 13.8 16.4-11.2 36.5-24.5 20.4z"></path></svg>',
      "id":"18,10749,99,36"
    },
    { "key":"10",
      "name" : "Scared",
      "id":"27,53,9648,80"
    },
    { "key":"11",
      "name":"Excited",
      "id":"28,12.878,14,10752"
    }
]


