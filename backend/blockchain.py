import hashlib

class MerkleTree:
    def __init__(self):
        self.leaves = []
        self.root = None

    def add_leaf(self, data):
        # Hash the data (string)
        hashed_data = hashlib.sha256(data.encode('utf-8')).hexdigest()
        self.leaves.append(hashed_data)
        self.recalculate_root()

    def recalculate_root(self):
        if not self.leaves:
            self.root = None
            return

        current_level = self.leaves
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                if i + 1 < len(current_level):
                    right = current_level[i + 1]
                else:
                    right = left  # Duplicate last node if odd number
                
                combined = left + right
                new_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()
                next_level.append(new_hash)
            current_level = next_level
        
        self.root = current_level[0]

    def get_root(self):
        return self.root
