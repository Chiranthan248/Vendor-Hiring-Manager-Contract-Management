import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/Axios/AxiosInstance";

// Fetch all openings for vendor
export const fetchVendorOpenings = createAsyncThunk(
  "vendor/fetchOpenings",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/vendor/openings?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch openings");
    }
  }
);

// Fetch single opening details
export const fetchVendorOpeningById = createAsyncThunk(
  "vendor/fetchOpeningById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/vendor/openings/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch opening");
    }
  }
);

// Presign upload URLs
export const presignUploadURLs = createAsyncThunk(
  "vendor/presignUploadURLs",
  async ({ openingId, files }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/presign`,
        { files }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to generate upload URLs");
    }
  }
);

// Submit profiles
export const submitProfiles = createAsyncThunk(
  "vendor/submitProfiles",
  async ({ openingId, profiles }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/upload`,
        { profiles }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit profiles");
    }
  }
);

// Soft delete profile
export const deleteProfile = createAsyncThunk(
  "vendor/deleteProfile",
  async (profileId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/vendor/profiles/${profileId}`);
      return profileId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete profile");
    }
  }
);

const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    openings: [],
    totalOpenings: 0,
    currentPage: 1,
    totalPages: 1,
    selectedOpening: null,
    loading: false,
    uploadLoading: false,
    error: null,
    uploadSuccess: false,
  },
  reducers: {
    clearSelectedOpening: (state) => {
      state.selectedOpening = null;
    },
    clearUploadSuccess: (state) => {
      state.uploadSuccess = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchVendorOpenings
      .addCase(fetchVendorOpenings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorOpenings.fulfilled, (state, action) => {
        state.loading = false;
        state.openings = action.payload.openings;
        state.totalOpenings = action.payload.total;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchVendorOpenings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchVendorOpeningById
      .addCase(fetchVendorOpeningById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorOpeningById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOpening = action.payload;
      })
      .addCase(fetchVendorOpeningById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // submitProfiles
      .addCase(submitProfiles.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
        state.uploadSuccess = false;
      })
      .addCase(submitProfiles.fulfilled, (state) => {
        state.uploadLoading = false;
        state.uploadSuccess = true;
      })
      .addCase(submitProfiles.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
      })

      // deleteProfile
      .addCase(deleteProfile.fulfilled, (state, action) => {
        if (state.selectedOpening) {
          state.selectedOpening.hiringProfiles =
            state.selectedOpening.hiringProfiles.filter(
              (p) => p.id !== action.payload
            );
        }
      });
  },
});

export const { clearSelectedOpening, clearUploadSuccess, clearError } =
  vendorSlice.actions;
export default vendorSlice.reducer;