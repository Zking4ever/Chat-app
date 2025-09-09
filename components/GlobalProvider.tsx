// GlobalContext.js
import React, { createContext, useState } from 'react';

export const GlobalContext = createContext({ selectedMovie:null, setSelectedMovie: (movie:any) => {} });

export const GlobalProvider = ({children}) => {
  const [selectedMovie, setSelectedMovie] = useState(null);

  return (
    <GlobalContext.Provider value={{ selectedMovie, setSelectedMovie }}>
      {children}
    </GlobalContext.Provider>
  );
};
