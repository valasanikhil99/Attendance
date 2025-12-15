import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- Middleware ---
interface AuthRequest extends ExpressRequest {
  user?: { id: string };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// 1. Auth: Register
app.post('/api/auth/register', async (req: ExpressRequest, res: Response) => {
  const { name, rollNumber, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, roll_number, password_hash) VALUES ($1, $2, $3) RETURNING id, name, roll_number',
      [name, rollNumber, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ user: { id: user.id, name: user.name, rollNumber: user.roll_number }, token });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'User already exists' });
    res.status(500).json({ error: err.message });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req: ExpressRequest, res: Response) => {
  const { rollNumber, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE roll_number = $1', [rollNumber]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = result.rows[0];
    if (await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id }, JWT_SECRET);
      res.json({ user: { id: user.id, name: user.name, rollNumber: user.roll_number }, token });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Attendance (Fetch all records for user)
app.get('/api/attendance', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, 
        timetable_entry_id as "timetableEntryId", 
        TO_CHAR(date, 'YYYY-MM-DD') as date, 
        status 
       FROM attendance_records 
       WHERE user_id = $1`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Mark Attendance (Upsert)
app.post('/api/attendance', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { timetableEntryId, date, status } = req.body;
  try {
    // ON CONFLICT handles the case where the user changes their mind (Present -> Absent)
    await pool.query(
      `INSERT INTO attendance_records (user_id, timetable_entry_id, date, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, timetable_entry_id, date)
       DO UPDATE SET status = EXCLUDED.status`,
      [req.user!.id, timetableEntryId, date, status]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Holidays
app.get('/api/holidays', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id as "userId", TO_CHAR(date, 'YYYY-MM-DD') as date 
       FROM holidays WHERE user_id = $1`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Toggle Holiday
app.post('/api/holidays/toggle', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { date } = req.body;
  try {
    // Check if exists
    const check = await pool.query('SELECT * FROM holidays WHERE user_id = $1 AND date = $2', [req.user!.id, date]);
    
    if (check.rows.length > 0) {
      // Delete if exists
      await pool.query('DELETE FROM holidays WHERE user_id = $1 AND date = $2', [req.user!.id, date]);
      res.json({ isHoliday: false });
    } else {
      // Insert if not exists
      await pool.query('INSERT INTO holidays (user_id, date) VALUES ($1, $2)', [req.user!.id, date]);
      
      // CRITICAL: Remove any attendance records for this date
      await pool.query('DELETE FROM attendance_records WHERE user_id = $1 AND date = $2', [req.user!.id, date]);
      
      res.json({ isHoliday: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});