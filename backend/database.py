import sqlite3
import datetime
import os

class Database:
    def __init__(self, db_name=None):
        # Use environment variable or default path
        if db_name is None:
            # For Render, use absolute path in /tmp or current directory
            db_name = os.getenv("DATABASE_PATH", "logs.db")
        self.db_name = db_name
        self.init_db()

    def init_db(self):
        conn = sqlite3.connect(self.db_name)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS logs
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      timestamp TEXT,
                      ip_address TEXT,
                      input_payload TEXT,
                      attack_type TEXT,
                      confidence REAL,
                      deception_strategy TEXT,
                      merkle_hash TEXT)''')
        conn.commit()
        conn.close()

    def log_attack(self, ip, payload, attack_type, confidence, strategy, merkle_hash):
        conn = sqlite3.connect(self.db_name)
        c = conn.cursor()
        timestamp = datetime.datetime.now().isoformat()
        c.execute("INSERT INTO logs (timestamp, ip_address, input_payload, attack_type, confidence, deception_strategy, merkle_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  (timestamp, ip, payload, attack_type, confidence, strategy, merkle_hash))
        log_id = c.lastrowid
        conn.commit()
        conn.close()
        return log_id

    def get_logs(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM logs ORDER BY id DESC")
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
