"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendorOpeningById,
  presignUploadURLs,
  submitProfiles,
  deleteProfile,
  clearUploadSuccess,
} from "@/redux/features/Dashboard/vendorSlice";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Trash2, FileText,
  MapPin, Briefcase, Clock, User, Eye,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const statusColors = {
  OPEN:    "bg-green-500/20 text-green-600 dark:text-green-400",
  CLOSED:  "bg-red-500/20 text-red-600 dark:text-red-400",
  ON_HOLD: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
};

const profileStatusColors = {
  SUBMITTED:  "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  SHORTLISTED:"bg-green-500/20 text-green-600 dark:text-green-400",
  REJECTED:   "bg-red-500/20 text-red-600 dark:text-red-400",
};

export default function VendorOpeningDetailPage({ id }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { selectedOpening, loading, uploadLoading, uploadSuccess } = useSelector((s) => s.vendor);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { dispatch(fetchVendorOpeningById(id)); }, [dispatch, id]);

  useEffect(() => {
    if (uploadSuccess) {
      setSelectedFiles([]);
      dispatch(clearUploadSuccess());
      dispatch(fetchVendorOpeningById(id));
      toast.success("Profiles submitted successfully! AI recommendation is processing.");
    }
  }, [uploadSuccess, dispatch, id]);

  const isClosed = selectedOpening?.status === "CLOSED";

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (isClosed) return;
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pptx")
    );
    if (files.length === 0) { toast.error("Only PDF and PPTX files are supported."); return; }
    setSelectedFiles((prev) => [...prev, ...files]);
    toast.info(`${files.length} file(s) ready to upload`);
  };

  const handleFileSelect = (e) => {
    if (isClosed) return;
    const files = Array.from(e.target.files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pptx")
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isClosed) return;
    setUploading(true);
    const toastId = toast.loading(`Uploading ${selectedFiles.length} file(s)...`);
    try {
      const presignResult = await dispatch(
        presignUploadURLs({ openingId: id, files: selectedFiles.map((f) => ({ fileName: f.name })) })
      ).unwrap();
      await dispatch(
        submitProfiles({ openingId: id, profiles: presignResult.map(({ s3Key, fileName }) => ({ s3Key, fileName })) })
      ).unwrap();
      toast.success("Profiles submitted! AI is analyzing candidates.", { id: toastId });
    } catch (err) {
      toast.error(err?.message || "Upload failed. Please try again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (profileId) => {
    try {
      await dispatch(deleteProfile(profileId)).unwrap();
      toast.success("Profile deleted successfully.");
    } catch {
      toast.error("Failed to delete profile.");
    }
  };

  const handlePreview = async (s3Key) => {
    try {
      toast.loading("Generating preview link...");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/vendor/profiles/preview?key=${encodeURIComponent(s3Key)}`,
        { withCredentials: true }
      );
      window.open(response.data.url, "_blank");
      toast.dismiss();
    } catch {
      toast.dismiss();
      toast.error("Preview not available.");
    }
  };

  if (loading || !selectedOpening) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => router.push("/vendor/openings")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Openings
      </button>

      {/* Opening details */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedOpening.title}</h1>
            <p className="text-muted-foreground mt-1">{selectedOpening.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedOpening.status]}`}>
            {selectedOpening.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />{selectedOpening.location || "Remote"}
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />{selectedOpening.contractType}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {selectedOpening.experienceMin}{selectedOpening.experienceMax ? `–${selectedOpening.experienceMax}` : "+"} years
          </div>
          {selectedOpening.hiringManagerName && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />{selectedOpening.hiringManagerName}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Posted: {new Date(selectedOpening.postedDate).toLocaleDateString()}</span>
          <span className="font-medium text-foreground">
            {selectedOpening._count?.hiringProfiles || 0} profile(s) submitted
          </span>
        </div>
      </div>

      {/* Upload section */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Upload Candidate Profiles</h2>
          {isClosed && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
              Closed — uploads disabled
            </span>
          )}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); if (!isClosed) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isClosed && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${isClosed
              ? "opacity-40 cursor-not-allowed border-border"
              : dragOver
                ? "border-primary bg-primary/5 cursor-pointer"
                : "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
            }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {isClosed
              ? "This opening is closed. No further uploads are accepted."
              : <>Drag & drop PDF or PPTX files here, or <span className="text-primary font-medium">browse</span></>
            }
          </p>
          {!isClosed && (
            <p className="text-xs text-muted-foreground mt-1">Multiple files supported</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.pptx"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isClosed}
          />
        </div>

        {selectedFiles.length > 0 && !isClosed && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading || uploadLoading}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading || uploadLoading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Submitted profiles */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Submitted Profiles ({selectedOpening._count?.hiringProfiles || selectedOpening.hiringProfiles?.length || 0})
        </h2>

        {selectedOpening.hiringProfiles?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No profiles submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedOpening.hiringProfiles?.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {profile.fileName || profile.s3Key.split("/").pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(profile.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${profileStatusColors[profile.status]}`}>
                    {profile.status}
                  </span>
                  <button
                    onClick={() => handlePreview(profile.s3Key)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Preview file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {profile.status === "SUBMITTED" && (
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}