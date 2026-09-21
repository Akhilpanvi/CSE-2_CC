import { useState } from "react";

import { API_URL, downloadReport, uploadExcel } from "../../api";

function UploadPanel() {

  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const [scope, setScope] = useState("all");
  const [reportError, setReportError] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);


  async function handleDownload() {

    setReportError("");
    setReportMessage("");
    setReportLoading(true);

    try {

      const count = await downloadReport(scope);

      setReportMessage(`Report downloaded — ${count} students.`);

    } catch {

      setReportError("Could not generate the report.");

    } finally {
      setReportLoading(false);
    }
  }


  async function handleUpload(e) {

    e.preventDefault();

    setUploadError("");
    setUploadMessage("");

    if (!file) {
      setUploadError("Please choose an .xlsx file first.");
      return;
    }

    setUploadLoading(true);

    try {

      const result = await uploadExcel(file);

      setUploadMessage(
        `${result.message} (${result.students_imported} students, `
        + `${result.courses_imported} courses)`
      );

      setFile(null);

    } catch (err) {

      setUploadError(
        err.response?.data?.detail || "Upload failed."
      );

    } finally {
      setUploadLoading(false);
    }
  }


  return (

    <>

    <section className="card">

      <div className="section-title">
        <h2>Download Report</h2>
        <p>
          Export the current data as an Excel workbook, in the same
          format as the master file.
        </p>
      </div>

      <div className="radio-row">

        <label
          className={`radio-option ${scope === "all" ? "active" : ""}`}
        >
          <input
            type="radio"
            name="report-scope"
            checked={scope === "all"}
            onChange={() => setScope("all")}
          />
          All Students
        </label>

        <label
          className={`radio-option ${scope === "placed" ? "active" : ""}`}
        >
          <input
            type="radio"
            name="report-scope"
            checked={scope === "placed"}
            onChange={() => setScope("placed")}
          />
          Placed Only
        </label>

      </div>

      {reportError && <div className="alert error">{reportError}</div>}

      {reportMessage && (
        <div className="alert success">{reportMessage}</div>
      )}

      <button onClick={handleDownload} disabled={reportLoading}>
        {reportLoading ? "Preparing..." : "Download Report"}
      </button>

    </section>

    <section className="card">

      <div className="section-title">
        <h2>Upload Master Excel File</h2>
        <p>
          Upload a new registration workbook to replace the current
          data. Existing student logins and replacement lock states
          are kept &mdash; only academic data is refreshed. New
          students get a default password equal to their Student ID.
        </p>
      </div>

      <p className="description">
        Required sheets: <strong>Overall Regitrations</strong> (sic) and{" "}
        <strong>courses</strong>. Column positions matter (Student ID in
        column C, name in D, placed in G, semesters 2-1 to 3-2 from H,
        4-1 in AM, 4-2 in AO).{" "}
        <a href={`${API_URL}/api/sample-excel`}>
          Download sample format
        </a>
      </p>

      <form onSubmit={handleUpload}>

        <div className="form-field">
          <input
            type="file"
            accept=".xlsx,.xlsm"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </div>

        {uploadError && (
          <div className="alert error">{uploadError}</div>
        )}

        {uploadMessage && (
          <div className="alert success">{uploadMessage}</div>
        )}

        <button type="submit" disabled={uploadLoading}>
          {uploadLoading ? "Uploading..." : "Upload & Import"}
        </button>

      </form>

    </section>

    </>
  );
}

export default UploadPanel;
