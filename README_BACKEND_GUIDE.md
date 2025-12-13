# ClassTrack - Student Attendance System

## Running the App (Frontend Mode)
This application is currently configured to run in **Browser-Only Mode** for immediate demonstration and testing. 
- It uses `localStorage` to simulate a database.
- It calculates attendance statistics in real-time within the browser.

To run:
1. `npm install`
2. `npm run dev`

## Transitioning to Full Stack (Node/Postgres)

To move this to a production environment as requested:

1. **Database Setup:**
   - Install PostgreSQL.
   - Run the SQL commands found in `database.sql` to create the schema and seed static data (Subjects/Timetable).

2. **Backend API (Node/Express):**
   - Create endpoints that mirror the `StorageService` in `src/services/storageService.ts`:
     - `POST /auth/login`: Verify password hash, return JWT.
     - `POST /auth/register`: Insert into `users`.
     - `GET /attendance`: `SELECT * FROM attendance WHERE user_id = $1`.
     - `POST /attendance`: `INSERT INTO attendance ...`.

3. **Frontend Integration:**
   - Replace `src/services/storageService.ts` with `apiService.ts` that uses `fetch` or `axios` to hit your Node endpoints.
   - Store the JWT in `localStorage` instead of the full user object.

## Timetable Rules
- Labs count as **3** in calculations but appear as **1** entry in the UI.
- CLC classes count as normal Theory (1).
- Aggregation is done by `Subject ID`. e.g., 'DL&CO' and 'DL&CO (CLC)' both contribute to the 'DL_CO' subject statistics.
