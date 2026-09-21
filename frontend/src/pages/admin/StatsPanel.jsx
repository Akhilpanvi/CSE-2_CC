import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getStats } from "../../api";

const SEMESTERS = ["2-1", "2-2", "3-1", "3-2"];

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;


// Single-hue progress donut: one gold arc on a neutral track.
// Percentage and counts are always written out, so nothing is
// carried by colour alone.
function Donut({ label, value, total, caption }) {

  const pct = total ? Math.round((value / total) * 100) : 0;

  return (

    <figure className="donut-card">

      <svg
        viewBox="0 0 140 140"
        className="donut"
        role="img"
        aria-label={`${label}: ${value} of ${total}, ${pct} percent`}
      >
        <title>{`${label}: ${value} of ${total} (${pct}%)`}</title>

        <circle className="donut-track" cx="70" cy="70" r={RADIUS} />

        <circle
          className="donut-value"
          cx="70"
          cy="70"
          r={RADIUS}
          strokeDasharray={
            `${(CIRCUMFERENCE * pct) / 100} ${CIRCUMFERENCE}`
          }
          transform="rotate(-90 70 70)"
        />

        <text className="donut-pct" x="70" y="68">{pct}%</text>
        <text className="donut-sub" x="70" y="90">
          {value} of {total}
        </text>
      </svg>

      <figcaption>
        <strong>{label}</strong>
        <span>{caption}</span>
      </figcaption>

    </figure>
  );
}


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


  return (

    <>

      <section className="card">

        <div className="section-title">
          <h2>Overview</h2>
          <p>
            {stats.total_students} students. Replacement access is set to{" "}
            <strong>
              {placedOnly ? "Placed students only" : "All students"}
            </strong>
            {placedOnly && ", so only placed students count as eligible"}.
          </p>
        </div>

        <div className="donut-row">

          <Donut
            label="Replacements Chosen"
            value={stats.replacements_submitted}
            total={stats.eligible_total}
            caption={`${stats.pending_total} still to choose`}
          />

          <Donut
            label="4-1 Registered"
            value={stats.registered_4_1}
            total={stats.total_students}
            caption={`${stats.pending_4_1} not registered yet`}
          />

          <Donut
            label="Placed"
            value={stats.placed}
            total={stats.total_students}
            caption={`${stats.not_placed} not placed`}
          />

        </div>

      </section>


      <section className="card">

        <div className="section-title">
          <h2>Replacements by Semester</h2>
          <p>Where the pending work is.</p>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Semester</th>
              <th>Eligible</th>
              <th>Chosen</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>
            {SEMESTERS.map((semester) => {
              const row = stats.semesters[semester];
              return (
                <tr key={semester}>
                  <td><strong>{semester}</strong></td>
                  <td>{row.eligible}</td>
                  <td>{row.submitted}</td>
                  <td>{row.pending}</td>
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
        </div>

        {stats.replacements.length === 0 ? (

          <div className="no-courses">
            No replacements have been chosen yet.
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
