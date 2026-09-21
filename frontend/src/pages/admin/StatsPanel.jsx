import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getStats } from "../../api";

const SEMESTERS = ["2-1", "2-2", "3-1", "3-2"];

function StatsPanel() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  async function loadStats() {

    setLoading(true);
    setError("");

    try {
      setStats(await getStats());
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not load stats."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadStats();
  }, []);


  if (loading) {
    return <section className="card">Loading stats...</section>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  if (!stats) {
    return null;
  }

  const placedOnly = stats.replacement_access === "PLACED";

  const tiles = [
    ["Total Students", stats.total_students],
    ["Placed", stats.placed],
    ["Replacements Chosen", stats.replacements_submitted],
    ["Still To Choose", stats.pending_total],
    ["4-1 Registered", `${stats.registered_4_1} / ${stats.total_students}`]
  ];


  return (

    <>

      <section className="card">

        <div className="section-title">
          <h2>Overview</h2>
          <p>
            Replacement access is currently set to{" "}
            <strong>
              {placedOnly ? "Placed students only" : "All students"}
            </strong>
            , so eligibility below counts only students who can act now.
          </p>
        </div>

        <div className="stat-tiles">
          {tiles.map(([label, value]) => (
            <div className="stat-tile" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

      </section>


      <section className="card">

        <div className="section-title">
          <h2>Replacements by Semester</h2>
          <p>
            Eligible means the certification is not completed and the
            student is allowed to replace it under the current policy.
          </p>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Semester</th>
              <th>Eligible</th>
              <th>Chosen</th>
              <th>Pending</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {SEMESTERS.map((semester) => {

              const row = stats.semesters[semester];

              const pct = row.eligible
                ? Math.round((row.submitted / row.eligible) * 100)
                : 0;

              return (
                <tr key={semester}>
                  <td><strong>{semester}</strong></td>
                  <td>{row.eligible}</td>
                  <td>{row.submitted}</td>
                  <td>{row.pending}</td>
                  <td>
                    <div className="meter" title={`${pct}% chosen`}>
                      <div
                        className="meter-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="meter-label">{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

      </section>


      <section className="card">

        <div className="section-title">
          <h2>
            Who Chose a Replacement ({stats.replacements.length})
          </h2>
          <p>Every replacement submitted so far.</p>
        </div>

        {stats.replacements.length === 0 ? (

          <div className="no-courses">
            No replacements have been submitted yet.
          </div>

        ) : (

          <table className="admin-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Sem</th>
                <th>Replaced</th>
                <th>Chosen Certification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.replacements.map((row) => (
                <tr key={`${row.student_id}-${row.semester}`}>
                  <td>
                    <Link to={`/admin/students/${row.student_id}`}>
                      {row.student_id}
                    </Link>
                  </td>
                  <td>{row.student_name}</td>
                  <td>{row.semester}</td>
                  <td>{row.original_code || "—"}</td>
                  <td>
                    <strong>{row.replacement_code}</strong>
                    <div className="muted-line">
                      {row.replacement_name}
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        `status-badge ${
                          row.locked ? "success" : "warning"
                        }`
                      }
                    >
                      {row.locked ? "Locked" : "Unlocked"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </section>

    </>
  );
}

export default StatsPanel;
