import { createSlice } from '@reduxjs/toolkit';

const persistedUser = (() => {
  try {
    const raw = localStorage.getItem("jp_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: persistedUser,
    loading: false,
  },
  reducers: {
    setLoading:(state, action)=>{
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      try {
        if (action.payload) {
          localStorage.setItem("jp_user", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("jp_user");
        }
      } catch {
        // Ignore localStorage failures in restricted environments.
      }
    },
    logout: (state) => {
      state.user = null;
      try {
        localStorage.removeItem("jp_user");
      } catch {
        // Ignore localStorage failures in restricted environments.
      }
    },
  },
});

export const {setLoading, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
