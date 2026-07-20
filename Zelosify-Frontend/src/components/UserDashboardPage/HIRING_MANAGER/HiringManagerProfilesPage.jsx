"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchManagerOpeningProfiles,
  shortlistProfile,
  rejectProfile,
} from "@/redux/features/Dashboard/hiringManagerSlice";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const recommendationBadge = (profile) => {
  if (profile.recommended === null || profile.recommended === undefined) {
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground border border-border">
        <Clock className="w-3 h-3" /> Pending AI
      </span>
    );
  }
  if (profile.recommendationScore >= 0.75) {
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
        Recommended
      </span>
    );
  }
  if (profile.recommendationScore >= 0.5) {
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
        Borderline
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
      Not Recommended
    </span>
  );
};

const profileStatusColors = {
  SUBMITTED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  SHORTLISTED: "bg-green-500/20 text-green-400 border border-green-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border border-red-500/30",
};

function ConfirmDialog({ open, onConfirm, onCancel, action, fileName }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Confirm {action}
        </h3>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to{" "}
          <span className="font-medium text-foreground">{action.toLowerCase()}</span>{" "}
          <span className="font-medium text-foreground">{fileName}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              action === "Shortlist"
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
            }`}
          >
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HiringManagerProfilesPage({ id }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { selectedOpening, loading, actionLoading } = useSelector(
    (state) => state.hiringManager
  );

  const [confirm, setConfirm] = useState(null); // { action, profileId, fileName }

  useEffect(() => {
    dispatch(fetchManagerOpeningProfiles(id));
  }, [dispatch, id]);

  const handleShortlist = (profileId, fileName) => {
    setConfirm({ action: "Shortlist", profileId, fileName });
  };

  const handleReject = (profileId, fileName) => {
    setConfirm({ action: "Reject", profileId, fileName });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { action, profileId, fileName } = confirm;
    setConfirm(null);

    try {
      if (action === "Shortlist") {
        await dispatch(shortlistProfile(profileId)).unwrap();
        toast.success(`${fileName} has been shortlisted.`);
      } else {
        await dispatch(rejectProfile(profileId)).unwrap();
        toast.error(`${fileName} has been rejected.`);
      }
    } catch {
      toast.error("Action failed. Please try again.");
    }
  };

  const handlePreview = async (s3Key) => {
    try {
      const toastId = toast.loading("Generating preview...");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/hiring-manager/profiles/preview?key=${encodeURIComponent(s3Key)}`,
        { withCredentials: true }
      );
      toast.dismiss(toastId);
      window.open(response.data.url, "_blank");
    } catch {
      toast.error("Preview not available.");
    }
  };

  if (loading || !selectedOpening) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={!!confirm}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
        action={confirm?.action}
        fileName={confirm?.fileName}
      />

      <div className="p-6 space-y-6">
        <button
          onClick={() => router.push("/hiring-manager/openings")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Openings
        </button>

        {/* Opening header */}
        <div className="rounded-xl border border-border p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {selectedOpening.title}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {selectedOpening.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{selectedOpening.location}</span>
            <span>{selectedOpening.contractType}</span>
            <span>
              {selectedOpening.experienceMin}–{selectedOpening.experienceMax} yrs
            </span>
            {selectedOpening.hiringManagerName && (
              <span>Manager: {selectedOpening.hiringManagerName}</span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Profiles",
              value: selectedOpening.hiringProfiles?.length || 0,
              color: "text-foreground",
            },
            {
              label: "Shortlisted",
              value: selectedOpening.hiringProfiles?.filter(
                (p) => p.status === "SHORTLISTED"
              ).length || 0,
              color: "text-green-400",
            },
            {
              label: "Rejected",
              value: selectedOpening.hiringProfiles?.filter(
                (p) => p.status === "REJECTED"
              ).length || 0,
              color: "text-red-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-border p-4 text-center"
            >
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Profiles */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Candidate Profiles ({selectedOpening.hiringProfiles?.length || 0})
          </h2>

          {selectedOpening.hiringProfiles?.length === 0 ? (
            <div className="rounded-xl border border-border p-12 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No profiles submitted yet.
              </p>
            </div>
          ) : (
            selectedOpening.hiringProfiles?.map((profile) => (
              <div
                key={profile.id}
                className="rounded-xl border border-border p-5 space-y-4"
              >
                {/* Profile header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {profile.fileName || profile.s3Key.split("/").pop()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(profile.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {recommendationBadge(profile)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${profileStatusColors[profile.status]}`}>
                      {profile.status}
                    </span>
                    <button
                      onClick={() => handlePreview(profile.s3Key)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Preview file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI Recommendation */}
                {profile.recommendationScore !== null && (
                  <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-foreground">
                        AI Recommendation
                      </span>
                      {profile.recommendationVersion && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          v{profile.recommendationVersion}
                        </span>
                      )}
                    </div>

                    {/* Score bars */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Score</p>
                        <p className="text-2xl font-bold text-foreground">
                          {Math.round(profile.recommendationScore * 100)}%
                        </p>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${profile.recommendationScore * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-foreground">
                          {Math.round((profile.recommendationConfidence || 0) * 100)}%
                        </p>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${(profile.recommendationConfidence || 0) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Processing</p>
                        <p className="text-2xl font-bold text-foreground">
                          {profile.recommendationLatencyMs}ms
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {profile.recommendationLatencyMs < 1500 ? "✓ Within SLA" : "⚠ Over SLA"}
                        </p>
                      </div>
                    </div>

                    {profile.recommendationReason && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {profile.recommendationReason}
                        </p>
                      </div>
                    )}

                    {profile.recommendedAt && (
                      <p className="text-xs text-muted-foreground">
                        Analyzed: {new Date(profile.recommendedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {profile.status === "SUBMITTED" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleShortlist(
                          profile.id,
                          profile.fileName || profile.s3Key.split("/").pop()
                        )
                      }
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-colors disabled:opacity-50 border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Shortlist
                    </button>
                    <button
                      onClick={() =>
                        handleReject(
                          profile.id,
                          profile.fileName || profile.s3Key.split("/").pop()
                        )
                      }
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-50 border border-red-500/30"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {profile.status === "SHORTLISTED" && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Shortlisted on {new Date(profile.shortlistedAt).toLocaleDateString()}
                  </p>
                )}

                {profile.status === "REJECTED" && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Rejected on {new Date(profile.rejectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}