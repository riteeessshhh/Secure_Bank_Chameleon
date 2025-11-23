import time
import random

class DeceptionEngine:
    def __init__(self):
        self.strategies = {
            'SQLi': [
                self.slow_loading_with_fake_dashboard  # Always use slow loading + fake dashboard for SQLi
            ],
            'XSS': [
                self.slow_loading_with_fake_dashboard  # Always use slow loading + fake dashboard for XSS
            ],
            'Benign': [
                self.normal_response
            ]
        }

    def decide_strategy(self, attack_type):
        if attack_type in self.strategies:
            strategies = self.strategies[attack_type]
            # If only one strategy, return it directly; otherwise choose randomly
            return strategies[0] if len(strategies) == 1 else random.choice(strategies)
        return self.normal_response

    def fake_db_error(self):
        return {
            "status": 500,
            "error": "Database Error: Syntax error in SQL statement at line 1. Check your syntax near '''.",
            "deception": "Fake Database Error"
        }

    def network_lag(self):
        time.sleep(2) # Artificial delay
        return {
            "status": 408,
            "error": "Request Timeout",
            "deception": "Artificial Network Lag"
        }

    def silent_fail(self):
        return {
            "status": 200,
            "message": "Login failed. Invalid credentials.",
            "deception": "Silent Failure (Credential Harvesting Trap)"
        }

    def sanitized_reflection(self):
        return {
            "status": 200,
            "message": "Search results for: &lt;script&gt;... (Sanitized)",
            "deception": "Fake Sanitization"
        }

    def fake_success(self):
        return {
            "status": 200,
            "message": "Comment posted successfully! (Pending moderation)",
            "deception": "Fake Success Message"
        }

    def normal_response(self):
        return {
            "status": 200,
            "message": "Login Successful",
            "deception": "Benign Tarpit (Fake Success)",
            "action": "fake_dashboard"
        }

    def slow_loading(self):
        time.sleep(5)  # 5 second delay to waste attacker's time
        return {
            "status": 200,
            "message": "Login Successful",
            "deception": "Slow Loading Tarpit",
            "action": "fake_dashboard"
        }

    def fake_dashboard_redirect(self):
        return {
            "status": 200,
            "message": "Login Successful",
            "deception": "Fake Dashboard Redirect",
            "action": "fake_dashboard"
        }

    def slow_loading_with_fake_dashboard(self):
        """
        Slow loading deception strategy: Show authentication successful after delay,
        then redirect to fake dashboard. This wastes attacker's time and fools them
        into thinking they've successfully breached the system.
        """
        time.sleep(3)  # 3 second delay to simulate slow authentication
        return {
            "status": 200,
            "message": "Authentication Successful",
            "deception": "Slow Loading + Fake Dashboard Tarpit",
            "action": "slow_loading_then_fake_dashboard"  # New action type
        }
