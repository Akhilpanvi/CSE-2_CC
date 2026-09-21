# CSE-2 Skill Certification Portal

Certification registration portal for KL University CSE-2. Students view their
semester-wise certification history, register their 4-1 certification, and
request replacements for certifications they did not complete. Admins manage
students, import the master Excel workbook, and export reports.

- **Backend** — FastAPI + MongoDB
- **Frontend** — React (Vite)

## Features

**Students**
- Log in with Student ID; first login forces a password change
- View semester history (2-1 to 3-2) with certification status
- Register a 4-1 certification from courses not already taken
- Request a replacement for a certification marked not completed
- Change password any time from the dashboard

**Admins**
- Search, create, edit and delete student records
- Lock / unlock a semester's replacement. A replacement locks once submitted,
  so changing it again needs an admin unlock
- Restrict replacement access to **all students** or **placed students only**
- Upload the master Excel workbook to refresh data
- Download a report (all students or placed only) in the same Excel format
- Create and remove other admin accounts; reset a student's password

## Setup

### Requirements
- Python 3.13, Node 20+, a MongoDB database

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (not committed — see Security):

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?appName=Cluster0
MONGODB_DB_NAME=cse2_certification
JWT_SECRET=<a long random string>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=720
```

If the password contains special characters, percent-encode them
(`@` becomes `%40`), or the connection string will not parse.

Import the master workbook and create the first admin:

```bash
python3 migrate.py "data/<your master workbook>.xlsx"
python3 seed_admin.py <username> <password>
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` to the backend URL when it is not `http://127.0.0.1:8000`.

## Logging in

There is **one login page** for both roles. It tries a student login first and
falls back to an admin login, so the admin portal is not advertised anywhere.

- **Students** — Student ID as both ID and password on first login, then they
  set their own. Admins can reset a student back to this default.
- **Admins** — the username and password given to `seed_admin.py`.

## Excel format

Uploads must match the master workbook exactly: a sheet named
`Overall Regitrations` (the typo is in the source file) and a sheet named
`courses`. Column positions matter — Student ID in column C, name in D,
placed in G, semesters 2-1 to 3-2 from H, 4-1 in AM and 4-2 in AO.

Download a sample from the admin portal (**Data & Reports**), or from
`GET /api/sample-excel`. An exported report is itself a valid upload, so it can
be exported, edited and uploaded back unchanged.

Re-uploading preserves existing student passwords and replacement lock states;
only academic data is refreshed. New students are created with the default
password.

## Deployment

`render.yaml` defines both services as a Render blueprint. Set `MONGODB_URI` on
the API service and `VITE_API_URL` on the web service, and allow the database
to accept connections from the host's IP range.

## Security

- `backend/.env` is gitignored. **Never commit real credentials.**
- Student data workbooks (`*.xlsx`) are gitignored. The only committed
  spreadsheet is `backend/sample_upload_format.xlsx`, which contains dummy
  records. Do not commit real student data.
- Passwords are hashed with bcrypt; API access uses JWTs, and every admin
  endpoint verifies the admin role.
- Students can only read and modify their own record.
- Rotate `JWT_SECRET` and all database credentials before going live, and
  change the seeded admin password.

### Known gaps
- No rate limiting on login, so the API is open to password guessing.
- Student password changes do not ask for the current one, so an unattended
  logged-in session can be taken over.
- Hiding the admin login is obscurity, not protection. `/api/auth/admin/login`
  is still reachable directly.
