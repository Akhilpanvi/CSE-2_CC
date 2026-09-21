import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Logo from "../Logo";
import {
  getStudent,
  registerCourse,
  replaceCourse
} from "../api";
import { useAuth } from "../useAuth";


function StudentDashboard() {

  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const [student, setStudent] = useState(null);

  const [selectedCourse, setSelectedCourse] = useState("");

  const [replacementChoice, setReplacementChoice] =
    useState({});

  const [replacementCourse, setReplacementCourse] =
    useState({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");


  // --------------------------------------------------
  // LOAD STUDENT
  // --------------------------------------------------

  async function loadStudent() {

    setLoading(true);
    setError("");

    try {

      const data = await getStudent(auth.id);

      setStudent(data);

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        "Could not load your details."
      );

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function handleLogout() {
    logout();
    navigate("/");
  }


  // --------------------------------------------------
  // 4-1 REGISTRATION
  // --------------------------------------------------

  async function submitRegistration() {

    if (!selectedCourse) {

      setError(
        "Please select a certification."
      );

      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {

      const result =
        await registerCourse(
          auth.id,
          selectedCourse
        );

      setMessage(result.message);

      await loadStudent();

      setSelectedCourse("");

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        "Registration failed."
      );

    } finally {

      setLoading(false);
    }
  }


  // --------------------------------------------------
  // REPLACEMENT
  // --------------------------------------------------

  function setReplacementOption(
    semester,
    value
  ) {

    setReplacementChoice(
      previous => ({
        ...previous,
        [semester]: value
      })
    );

    if (value === "no") {

      setReplacementCourse(
        previous => ({
          ...previous,
          [semester]: ""
        })
      );
    }
  }


  async function submitReplacement(
    semester
  ) {

    const courseCode =
      replacementCourse[semester];


    if (!courseCode) {

      setError(
        `Please select a replacement certification for ${semester}.`
      );

      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {

      const result =
        await replaceCourse(
          auth.id,
          semester,
          courseCode
        );

      setMessage(result.message);

      await loadStudent();

      setReplacementChoice(
        previous => ({
          ...previous,
          [semester]: "submitted"
        })
      );

      setReplacementCourse(
        previous => ({
          ...previous,
          [semester]: ""
        })
      );

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        "Replacement failed."
      );

    } finally {

      setLoading(false);
    }
  }


  // --------------------------------------------------
  // STATUS DISPLAY
  // --------------------------------------------------

  function getStatusLabel(data) {

    const erp =
      `${data.erp_status || ""}`
        .trim()
        .toLowerCase();

    const current =
      `${data.current_status || ""}`
        .trim()
        .toLowerCase();

    // Explicitly not completed
    if (
      current.includes("not completed") ||
      current.includes("not done")
    ) {
      return {
        text: "Not Completed",
        type: "warning"
      };
    }

    // GP without a completed current status
    // is treated as pending/not completed.
    if (erp === "gp") {
      return {
        text: "Not Completed (GP)",
        type: "warning"
      };
    }

    // Explicitly completed
    if (
      current.includes("completed") ||
      current.includes("released") ||
      current.includes("pass") ||
      current.includes("passed")
    ) {
      return {
        text: "Completed",
        type: "success"
      };
    }

    if (!erp && !current) {
      return {
        text: "Status Not Available",
        type: "neutral"
      };
    }

    return {
      text:
        data.current_status ||
        data.erp_status ||
        "Status Available",

      type: "neutral"
    };
  }



  // --------------------------------------------------
  // SEMESTER
  // --------------------------------------------------

  function SemesterCard({
    semester,
    data
  }) {

    const status =
      getStatusLabel(data);

    const choice =
      replacementChoice[semester];

    const selectedReplacement =
      replacementCourse[semester] || "";


    const hasReplacement =
      Boolean(data.replacement_code) && data.replacement_locked;


    return (

      <div className="semester">

        {/* SEMESTER HEADER */}

        <div className="semester-title">

          <span>
            {semester}
          </span>

        </div>


        {/* CURRENT CERTIFICATION */}

        {data.course_code ? (

          <div className="registered-course">

            <div className="check">
              ✓
            </div>

            <div className="course-details">

              <div className="course-code">
                {data.course_code}
              </div>

              <div className="course-name">
                {data.course_name}
              </div>

            </div>

          </div>

        ) : (

          <div className="no-course">

            No certification registered
            for this semester.

          </div>
        )}


        {/* STATUS */}

        {data.course_code && (

          <div className="status-section">

            <div className="status-heading">
              Certification Status
            </div>

            <span
              className={
                `status-badge ${status.type}`
              }
            >
              {status.text}
            </span>

          </div>
        )}


        {/* EXISTING REPLACEMENT */}

        {hasReplacement && (

          <div className="replacement-completed">

            <div className="replacement-title">
              Replacement Certification
            </div>

            <div className="replacement-code">
              {data.replacement_code}
            </div>

            <div className="replacement-name">
              {data.replacement_name}
            </div>

            <div className="replacement-success">
              ✓ Replacement already registered
            </div>

          </div>
        )}


        {/* REPLACEMENT OPTION */}

        {data.can_replace &&
          !hasReplacement && (

          <div className="replacement-section">

            <div className="replacement-question">

              <strong>
                Replace Certification?
              </strong>

              <p>
                This certification is marked as
                not completed. You can replace it
                with another certification.
              </p>

            </div>


            {/* YES / NO */}

            <div className="radio-row">

              <label
                className={
                  `radio-option ${
                    choice === "no"
                      ? "active"
                      : ""
                  }`
                }
              >

                <input
                  type="radio"
                  name={`replace-${semester}`}
                  checked={choice === "no"}
                  onChange={() =>
                    setReplacementOption(
                      semester,
                      "no"
                    )
                  }
                />

                No

              </label>


              <label
                className={
                  `radio-option ${
                    choice === "yes"
                      ? "active"
                      : ""
                  }`
                }
              >

                <input
                  type="radio"
                  name={`replace-${semester}`}
                  checked={choice === "yes"}
                  onChange={() =>
                    setReplacementOption(
                      semester,
                      "yes"
                    )
                  }
                />

                Yes

              </label>

            </div>


            {/* REPLACEMENT COURSES */}

            {choice === "yes" && (

              <div className="replacement-selector">

                <label>
                  Select Replacement Certification
                </label>

                <select
                  value={selectedReplacement}
                  onChange={(e) =>
                    setReplacementCourse(
                      previous => ({
                        ...previous,
                        [semester]:
                          e.target.value
                      })
                    )
                  }
                >

                  <option value="">
                    Select a certification
                  </option>

                  {student.available_courses.map(
                    course => (

                      <option
                        key={course.code}
                        value={course.code}
                      >
                        {course.code} - {course.title}
                      </option>

                    )
                  )}

                </select>


                {student.available_courses.length ===
                  0 && (

                  <div className="no-replacement">

                    No unused certifications
                    are available.

                  </div>
                )}


                {selectedReplacement && (

                  <button
                    className="replace-button"
                    onClick={() =>
                      submitReplacement(
                        semester
                      )
                    }
                    disabled={loading}
                  >

                    {loading
                      ? "Submitting..."
                      : `Replace ${semester} Certification`
                    }

                  </button>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    );
  }


  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (

    <div className="app">

      <header className="header">

        <div className="header-content admin-header-content">

          <div>
            <Logo />

            <h1>
              Skill Certification Registration
            </h1>

            <p>
              Student Certification Portal
            </p>
          </div>

          <div className="header-actions">

            <button
              className="logout-button"
              onClick={() =>
                navigate("/change-password", {
                  state: { voluntary: true }
                })
              }
            >
              Change Password
            </button>

            <button className="logout-button" onClick={handleLogout}>
              Log Out
            </button>

          </div>

        </div>

      </header>


      <main className="container">


        {/* ERROR */}

        {error && (

          <div className="alert error">

            {error}

          </div>
        )}


        {/* SUCCESS */}

        {message && (

          <div className="alert success">

            {message}

          </div>
        )}


        {loading && !student && (
          <div className="card">Loading your details...</div>
        )}


        {/* STUDENT */}

        {student && (

          <>

            {/* STUDENT DETAILS */}

            <section className="card">

              <div className="student-header">

                <div>

                  <p className="label">
                    Student ID
                  </p>

                  <h2>
                    {student.student_id}
                  </h2>

                </div>


                <div>

                  <p className="label">
                    Student Name
                  </p>

                  <h2>
                    {student.student_name}
                  </h2>

                </div>

              </div>


              <div className="profile-summary student-profile">

                <div>
                  <p className="label">Faculty Incharge</p>
                  <h2>{student.faculty_incharge || "—"}</h2>
                </div>

                <div>
                  <p className="label">Counsellor</p>
                  <h2>{student.counsellor_name || "—"}</h2>
                </div>

                <div>
                  <p className="label">Placement</p>
                  <h2>{student.placed || "Not Placed"}</h2>
                </div>

              </div>


              <div className="stats">

                <div className="stat">

                  <span>
                    Required Certifications
                  </span>

                  <strong>
                    {student.required}
                  </strong>

                </div>


                <div className="stat">

                  <span>
                    Total Registered
                  </span>

                  <strong>
                    {student.total_registered}
                  </strong>

                </div>

              </div>

            </section>


            {/* HISTORY */}

            <section className="card">

              <div className="section-title">

                <div>

                  <h2>
                    Registration History
                  </h2>

                  <p>
                    Semester-wise certification
                    registration and replacement
                    status.
                  </p>

                </div>

              </div>


              <div className="history">

                {Object.entries(
                  student.history
                ).map(
                  ([semester, data]) => (

                    <SemesterCard
                      key={semester}
                      semester={semester}
                      data={data}
                    />

                  )
                )}

              </div>

            </section>


            {/* 4-1 */}

            <section className="card">

              <div className="section-title">

                <div>

                  <h2>
                    4-1 Registration
                  </h2>

                  <p>
                    Select a certification that
                    you have not registered for
                    previously.
                  </p>

                </div>

              </div>


              {student.current_4_1 ? (

                <div className="current-registration">

                  <div className="status-icon">
                    ✓
                  </div>

                  <div>

                    <h3>
                      Current Registration
                    </h3>

                    <p>
                      {student.current_4_1}
                    </p>

                  </div>

                </div>

              ) : (

                <>

                  <div className="registration-info">

                    <h3>
                      Certification Required
                    </h3>

                    <p>
                      Select one certification
                      from the available list.
                    </p>

                  </div>


                  <div className="course-list">

                    {student.available_courses.map(
                      course => (

                        <label
                          key={course.code}
                          className={
                            "course-option " +
                            (
                              selectedCourse ===
                              course.code
                                ? "selected"
                                : ""
                            )
                          }
                        >

                          <input
                            type="radio"
                            name="certification"
                            value={course.code}
                            checked={
                              selectedCourse ===
                              course.code
                            }
                            onChange={() =>
                              setSelectedCourse(
                                course.code
                              )
                            }
                          />


                          <div>

                            <div className="option-code">
                              {course.code}
                            </div>

                            <div className="option-name">
                              {course.title}
                            </div>

                          </div>

                        </label>

                      )
                    )}

                  </div>


                  {student.available_courses.length >
                    0 && (

                    <button
                      className="submit-button"
                      onClick={
                        submitRegistration
                      }
                      disabled={loading}
                    >

                      {loading
                        ? "Submitting..."
                        : "Submit 4-1 Registration"
                      }

                    </button>
                  )}


                  {student.available_courses.length ===
                    0 && (

                    <div className="no-courses">

                      No new certifications are
                      available.

                    </div>
                  )}

                </>
              )}

            </section>

          </>
        )}

      </main>


      <footer>

        <p>
          Skill Certification Registration Portal
        </p>

      </footer>

    </div>
  );
}


export default StudentDashboard;
