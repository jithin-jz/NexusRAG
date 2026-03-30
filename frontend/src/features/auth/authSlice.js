import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchWithAuth, API_BASE } from '../../services/api'

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
  try {
    const res = await fetchWithAuth('/api/user')
    if (res && res.ok) return await res.json()
    return rejectWithValue('Failed to fetch user')
  } catch (e) {
    return rejectWithValue(e.message)
  }
})

export const devLogin = createAsyncThunk('auth/devLogin', async (email, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('session_token', data.session_token)
      return data
    }
    return rejectWithValue(data.error || 'Login failed')
  } catch (e) {
    return rejectWithValue(e.message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    session: localStorage.getItem('session_token'),
    loading: !!localStorage.getItem('session_token'),
    error: null,
    config: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.session = null
      localStorage.removeItem('session_token')
    },
    setSession: (state, action) => {
      state.session = action.payload
      localStorage.setItem('session_token', action.payload)
    },
    setAuthConfig: (state, action) => {
      state.config = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
      })
      .addCase(fetchUser.rejected, (state) => {
        state.user = null
        state.session = null
        state.loading = false
        localStorage.removeItem('session_token')
      })
      .addCase(devLogin.fulfilled, (state, action) => {
        state.session = action.payload.session_token
        state.loading = false
      })
  },
})

export const { logout, setSession, setAuthConfig } = authSlice.actions
export default authSlice.reducer
