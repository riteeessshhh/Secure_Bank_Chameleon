"""
Test script to verify PDF generation works correctly
Run this from the project root directory
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_pdf_generation():
    """Test PDF generation directly"""
    try:
        from backend.routes.report import generate_pdf_report, REPORTLAB_AVAILABLE
        from backend.database import Database
        
        print("=" * 60)
        print("PDF Generation Test")
        print("=" * 60)
        print(f"ReportLab Available: {REPORTLAB_AVAILABLE}")
        print()
        
        # Check if we have logs
        db = Database()
        logs = db.get_logs()
        print(f"Total logs in database: {len(logs)}")
        
        if not logs:
            print("WARNING: No logs found in database. Cannot test PDF generation.")
            return False
        
        # Get first IP with logs
        test_ip = logs[0].get('ip_address', '127.0.0.1')
        ip_logs = [log for log in logs if log.get('ip_address') == test_ip]
        print(f"Testing with IP: {test_ip} ({len(ip_logs)} events)")
        print()
        
        # Generate PDF
        print("Generating PDF...")
        try:
            pdf_buffer = generate_pdf_report(test_ip)
            pdf_data = pdf_buffer.read()
            
            print(f"PDF generated successfully!")
            print(f"Size: {len(pdf_data)} bytes")
            print(f"Starts with: {pdf_data[:20]}")
            print()
            
            # Check if it's a valid PDF
            if pdf_data.startswith(b'%PDF'):
                print("✓ Valid PDF header found!")
                print("✓ PDF generation is working correctly!")
                print()
                print("The issue is likely that the server needs to be restarted.")
                print("Please restart the backend server and try again.")
                return True
            else:
                print("✗ Invalid PDF - doesn't start with %PDF")
                print(f"First 50 bytes: {pdf_data[:50]}")
                return False
                
        except Exception as e:
            print(f"✗ Error generating PDF: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except ImportError as e:
        print(f"✗ Import error: {e}")
        print("Make sure you're running this from the project root directory")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_pdf_generation()
    sys.exit(0 if success else 1)



