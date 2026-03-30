import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import botReducer from '../features/bots/botSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bots: botReducer,
  },
})
