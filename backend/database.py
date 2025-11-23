import sqlite3
import datetime
import os
from datetime import timezone

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
        # Create actions table for session replay
        c.execute('''CREATE TABLE IF NOT EXISTS session_actions
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      event_id INTEGER,
                      actions_json TEXT,
                      created_at TEXT,
                      FOREIGN KEY (event_id) REFERENCES logs(id) ON DELETE CASCADE)''')
        conn.commit()
        conn.close()

    def log_attack(self, ip, payload, attack_type, confidence, strategy, merkle_hash):
        conn = sqlite3.connect(self.db_name)
        c = conn.cursor()
        # Use UTC timezone for consistent timestamps across timezones
        timestamp = datetime.datetime.now(timezone.utc).isoformat()
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
    
    def save_actions(self, event_id, actions):
        """Save session actions for an event"""
        import json
        from datetime import timezone
        conn = sqlite3.connect(self.db_name)
        c = conn.cursor()
        timestamp = datetime.datetime.now(timezone.utc).isoformat()
        actions_json = json.dumps(actions)
        c.execute("INSERT INTO session_actions (event_id, actions_json, created_at) VALUES (?, ?, ?)",
                  (event_id, actions_json, timestamp))
        conn.commit()
        conn.close()
    
    def get_actions(self, event_id):
        """Get session actions for an event"""
        import json
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT actions_json FROM session_actions WHERE event_id = ? ORDER BY id DESC LIMIT 1",
                  (event_id,))
        row = c.fetchone()
        conn.close()
        if row:
            return json.loads(row['actions_json'])
        return []
