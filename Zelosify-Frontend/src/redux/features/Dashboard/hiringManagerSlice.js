import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/Axios/AxiosInstance";

export const fetchManagerOpenings = createAsyncThunk(
  "hiringManager/fetchOpenings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/hiring-manager/openings");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch openings");
    }
  }
);

export const fetchManagerOpeningProfiles = createAsyncThunk(
  "hiringManager/fetchOpeningProfiles",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/hiring-manager/openings/${id}/profiles`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch profiles");
    }
  }
);

export const shortlistProfile = createAsyncThunk(
  "hiringManager/shortlistProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/hiring-manager/profiles/${profileId}/shortlist`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to shortlist");
    }
  }
);

export const rejectProfile = createAsyncThunk(
  "hiringManager/rejectProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/hiring-manager/profiles/${profileId}/reject`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to reject");
    }
  }
);

const hiringManagerSlice = createSlice({
  name: "hiringManager",
  initialState: {
    openings: [],
    selectedOpening: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearSelectedOpening: (state) => {
      state.selectedOpening = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerOpenings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagerOpenings.fulfilled, (state, action) => {
        state.loading = false;
        state.openings = action.payload;
      })
      .addCase(fetchManagerOpenings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchManagerOpeningProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagerOpeningProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOpening = action.payload;
      })
      .addCase(fetchManagerOpeningProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(shortlistProfile.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(shortlistProfile.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.selectedOpening) {
          state.selectedOpening.hiringProfiles =
            state.selectedOpening.hiringProfiles.map((p) =>
              p.id === action.payload.id ? action.payload : p
            );
        }
      })
      .addCase(shortlistProfile.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(rejectProfile.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(rejectProfile.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.selectedOpening) {
          state.selectedOpening.hiringProfiles =
            state.selectedOpening.hiringProfiles.map((p) =>
              p.id === action.payload.id ? action.payload : p
            );
        }
      })
      .addCase(rejectProfile.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedOpening } = hiringManagerSlice.actions;
export default hiringManagerSlice.reducer;