import { useEffect, useState } from "react";

import { getSettings, updateSettings } from "../../api";

function SettingsPanel() {

  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  async function loadSettings() {

    setLoading(true);
    setError("");

    try {

      const data = await getSettings();

      setAccess(data.replacement_access);

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not load settings."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadSettings();
  }, []);


  async function handleChange(mode) {

    if (mode === access) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {

      const result = await updateSettings(mode);

      setAccess(mode);
      setMessage(result.message);

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not update setting."
      );

    } finally {
      setSaving(false);
    }
  }


  return (

    <section className="card">

      <div className="section-title">
        <h2>Replacement Certification Access</h2>
        <p>
          Control which students are allowed to submit a replacement
          certification.
        </p>
      </div>

      {loading && <p>Loading current setting...</p>}

      {!loading && (

        <div className="radio-row settings-toggle">

          <label
            className={
              `radio-option ${access === "ALL" ? "active" : ""}`
            }
          >
            <input
              type="radio"
              name="replacement-access"
              checked={access === "ALL"}
              disabled={saving}
              onChange={() => handleChange("ALL")}
            />
            All Students
          </label>

          <label
            className={
              `radio-option ${access === "PLACED" ? "active" : ""}`
            }
          >
            <input
              type="radio"
              name="replacement-access"
              checked={access === "PLACED"}
              disabled={saving}
              onChange={() => handleChange("PLACED")}
            />
            Placed Students Only
          </label>

        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      {message && <div className="alert success">{message}</div>}

      <p className="description settings-note">
        When set to <strong>Placed Students Only</strong>, students
        whose placement status is not &ldquo;Placed&rdquo; will not be
        able to submit a replacement certification, even if their
        certification is otherwise eligible.
      </p>

    </section>
  );
}

export default SettingsPanel;
