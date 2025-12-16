import { create } from 'zustand';
const useStore = create ((set) => ({
   advViewEnabled: false,
   
   switchAdvView: () => set((state) => ({
    advViewEnabled: !state.advViewEnabled
   })),

   setAdvView: (value) => set({advViewEnabled: value}),

   currentUser: null,

   setCurrentUser: (user) => set({currentUser: user}),
   logout: () => set({currentUser: null})
}));

export default useStore;