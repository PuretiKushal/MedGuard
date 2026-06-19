import { useEffect, useState, useRef } from "react";
import { getFacility, uploadProofDocument } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();
  const [facility, setFacility] = useState(null);
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (user?.facility_id) getFacility(user.facility_id).then((r) => setFacility(r.data));
  }, [user]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await uploadProofDocument(user.facility_id, fd);
      setUploaded(true);
    } finally {
      setLoading(false);
    }
  };

  if (!facility) return <div className="p-8 text-ink-faded font-mono text-sm">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="label mb-1">Facility</div>
      <h1 className="font-serif font-semibold text-2xl text-ink mb-7">Profile & location</h1>

      <div className="card p-6 mb-5">
        <div className="label mb-4">Facility details</div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-line pb-2.5"><span className="text-ink-faded">Name</span><span className="font-mono text-ink">{facility.name}</span></div>
          <div className="flex justify-between border-b border-line pb-2.5"><span className="text-ink-faded">Type</span><span className="font-mono text-ink capitalize">{facility.facility_type?.replace(/_/g, " ")}</span></div>
          <div className="flex justify-between border-b border-line pb-2.5"><span className="text-ink-faded">Address</span><span className="font-mono text-ink text-right">{facility.address}, {facility.area}</span></div>
          <div className="flex justify-between"><span className="text-ink-faded">Status</span>
            <span className={facility.verification_status === "verified" ? "stamp-safe" : "stamp-unverified"}>
              {facility.verification_status === "verified" ? "✓ Verified" : "Unverified facility"}
            </span>
          </div>
        </div>
      </div>

      {facility.verification_status === "pending_review" && (
        <div className="card p-6">
          <div className="label mb-2">Complete verification</div>
          <p className="text-sm text-ink-faded mb-1">{facility.verification_reason}</p>
          <p className="text-xs text-ink-faded font-mono mb-4">Upload a Drug License, hospital registration certificate, or similar proof document.</p>

          {uploaded ? (
            <div className="bg-green-light border border-green/20 rounded-lg px-4 py-3 text-sm text-green font-mono">
              ✓ Document uploaded. Awaiting manual review.
            </div>
          ) : (
            <>
              <div onClick={() => fileRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer mb-3 transition-colors ${file ? "border-green bg-green-light" : "border-line hover:border-amber/40"}`}>
                {file ? <div className="text-green font-mono text-sm">✓ {file.name}</div> : <div className="text-ink-faded text-sm">Click to upload proof document</div>}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
              </div>
              <button onClick={handleUpload} disabled={!file || loading} className="btn-fill w-full justify-center">{loading ? "Uploading..." : "Submit for review →"}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
