import { createSlice } from "@reduxjs/toolkit";

const initialState = { status: "unauthenticated", user: null };

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
  },
});

export const { signedIn } = authSlice.actions;
export default authSlice.reducer;
