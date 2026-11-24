import { createSlice } from "@reduxjs/toolkit";

const initialState = { status: "checking", user: null };

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    signedIn(state, action) {
      state.user = {
        id: action.payload.id,
        username: action.payload.username,
        email: action.payload.email,
      };
      state.status = "authenticated";
    },
    signedOut(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
});

export const { signedIn, signedOut } = authSlice.actions;
export default authSlice.reducer;
