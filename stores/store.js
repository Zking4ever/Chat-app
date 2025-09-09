import {create} from 'zustand';

const useStore = create((set) => ({
  selectedMovie: 0,//movie id
  setSelectedMovie: (id) => set(() => ({ selectedMovie: id })),
  catagory:0,//catagory key
  setCatagory: (key)=>set(()=>({catagory:key}))
}));

export default useStore;