"""
Quick test script to verify PDF generation works
"""
import requests
import sys

def test_pdf_endpoint(ip="127.0.0.1", port=5000):
    """Test the PDF report endpoint"""
    url = f"http://localhost:{port}/api/report/{ip}"
    
    try:
        print(f"Testing: {url}")
        response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"Content-Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            # Check if it's a valid PDF
            if response.content.startswith(b'%PDF'):
                print("✓ Valid PDF header found!")
                print(f"✓ PDF size: {len(response.content)} bytes")
                return True
            else:
                print("✗ Invalid PDF - doesn't start with %PDF")
                print(f"First 50 bytes: {response.content[:50]}")
                return False
        else:
            print(f"✗ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error detail: {error_data}")
            except:
                print(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server. Is the backend running?")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    ip = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    success = test_pdf_endpoint(ip)
    sys.exit(0 if success else 1)



