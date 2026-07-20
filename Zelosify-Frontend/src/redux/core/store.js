import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/redux/features/Auth/authSlice";
import vendorReducer from "@/redux/features/Dashboard/vendorSlice";
import hiringManagerReducer from "@/redux/features/Dashboard/hiringManagerSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    vendor: vendorReducer,
    hiringManager: hiringManagerReducer,
  },
});

export default store;