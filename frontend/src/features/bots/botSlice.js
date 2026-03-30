import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchWithAuth } from '../../services/api'

export const fetchBots = createAsyncThunk('bots/fetchBots', async (_, { rejectWithValue }) => {
  try {
    const res = await fetchWithAuth('/api/bots')
    if (res && res.ok) {
      const data = await res.json()
      return data.bots || []
    }
    return rejectWithValue('Failed to fetch bots')
  } catch (e) {
    return rejectWithValue(e.message)
  }
})

const botSlice = createSlice({
  name: 'bots',
  initialState: {
    list: [],
    selectedId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedBotId: (state, action) => {
      state.selectedId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBots.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchBots.fulfilled, (state, action) => {
        state.list = action.payload
        state.loading = false
      })
      .addCase(fetchBots.rejected, (state, action) => {
        state.error = action.payload
        state.loading = false
      })
  },
})

export const { setSelectedBotId } = botSlice.actions
export default botSlice.reducer
