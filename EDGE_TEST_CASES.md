# Edge Test Cases for Attack Detection

This document contains challenging test cases for SQL Injection, XSS, and benign inputs to test the system's detection capabilities.

## SQL Injection (SQLi) - Edge Cases

### 1. **Time-Based Blind SQLi**
```
User ID: admin' OR SLEEP(5)--
Password: test
```
```
User ID: test' AND IF(1=1, SLEEP(3), 0)--
Password: pass
```

### 2. **Boolean-Based Blind SQLi**
```
User ID: admin' AND 1=1--
Password: test
```
```
User ID: admin' AND 1=2--
Password: test
```
```
User ID: test' OR 'x'='x
Password: anything
```

### 3. **Union-Based SQLi**
```
User ID: admin' UNION SELECT NULL--
Password: test
```
```
User ID: test' UNION SELECT 1,2,3--
Password: pass
```
```
User ID: admin' UNION SELECT username,password FROM users--
Password: test
```

### 4. **Stacked Queries**
```
User ID: admin'; DROP TABLE users;--
Password: test
```
```
User ID: test'; INSERT INTO logs VALUES('hacked');--
Password: pass
```

### 5. **Comment Variations**
```
User ID: admin'/**/OR/**/1=1--
Password: test
```
```
User ID: admin'-- 
Password: test
```
```
User ID: admin'#
Password: test
```
```
User ID: admin'/*comment*/OR 1=1--
Password: test
```

### 6. **Encoding Bypasses**
```
User ID: admin%27 OR 1=1--
Password: test
```
```
User ID: admin%27%20OR%201=1--
Password: test
```
```
User ID: admin' OR CHAR(49)=CHAR(49)--
Password: test
```

### 7. **Case Variations**
```
User ID: admin' Or 1=1--
Password: test
```
```
User ID: ADMIN' OR 1=1--
Password: test
```
```
User ID: AdMiN' oR 1=1--
Password: test
```

### 8. **Function-Based**
```
User ID: admin' OR LENGTH('test')=4--
Password: test
```
```
User ID: test' OR SUBSTRING('admin',1,1)='a'--
Password: pass
```
```
User ID: admin' OR ASCII('a')=97--
Password: test
```

### 9. **Nested Queries**
```
User ID: admin' OR (SELECT COUNT(*) FROM users)>0--
Password: test
```
```
User ID: test' AND (SELECT SUBSTRING(@@version,1,1))='5'--
Password: pass
```

### 10. **No-Space SQLi**
```
User ID: admin'OR'1'='1
Password: test
```
```
User ID: test'/**/OR/**/'1'='1
Password: pass
```

### 11. **Second-Order SQLi**
```
User ID: admin'--
Password: test' OR 1=1--
```

### 12. **Error-Based SQLi**
```
User ID: admin' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))--
Password: test
```
```
User ID: test' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--
Password: pass
```

---

## XSS (Cross-Site Scripting) - Edge Cases

### 1. **Basic Script Tags**
```
User ID: <script>alert('XSS')</script>
Password: test
```
```
User ID: <script>alert(String.fromCharCode(88,83,83))</script>
Password: pass
```

### 2. **Event Handlers**
```
User ID: <img src=x onerror=alert('XSS')>
Password: test
```
```
User ID: <body onload=alert('XSS')>
Password: test
```
```
User ID: <svg onload=alert('XSS')>
Password: test
```
```
User ID: <input onfocus=alert('XSS') autofocus>
Password: test
```

### 3. **JavaScript Protocol**
```
User ID: <a href="javascript:alert('XSS')">Click</a>
Password: test
```
```
User ID: javascript:alert('XSS')
Password: test
```

### 4. **Encoded XSS**
```
User ID: <script>alert('XSS')</script>
Password: test
```
```
User ID: %3Cscript%3Ealert('XSS')%3C/script%3E
Password: test
```
```
User ID: &#60;script&#62;alert('XSS')&#60;/script&#62;
Password: test
```

### 5. **SVG XSS**
```
User ID: <svg><script>alert('XSS')</script></svg>
Password: test
```
```
User ID: <svg/onload=alert('XSS')>
Password: test
```

### 6. **Iframe XSS**
```
User ID: <iframe src="javascript:alert('XSS')"></iframe>
Password: test
```
```
User ID: <iframe onload=alert('XSS')></iframe>
Password: test
```

### 7. **HTML5 Entities**
```
User ID: <img src=x onerror=&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;>
Password: test
```

### 8. **Data URI**
```
User ID: <object data="data:text/html,<script>alert('XSS')</script>"></object>
Password: test
```

### 9. **Filter Bypass Techniques**
```
User ID: <ScRiPt>alert('XSS')</ScRiPt>
Password: test
```
```
User ID: <script>alert(String.fromCharCode(88,83,83))</script>
Password: test
```
```
User ID: <script>eval('al'+'ert(\'XSS\')')</script>
Password: test
```

### 10. **CSS-Based XSS**
```
User ID: <style>@import'javascript:alert("XSS")';</style>
Password: test
```
```
User ID: <link rel=stylesheet href=javascript:alert('XSS')>
Password: test
```

### 11. **DOM-Based XSS**
```
User ID: <img src=x onerror="eval(atob('YWxlcnQoJ1hTUycp'))">
Password: test
```

### 12. **Polyglot XSS**
```
User ID: ';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//";alert(String.fromCharCode(88,83,83))//";alert(String.fromCharCode(88,83,83))//--></SCRIPT>">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>
Password: test
```

### 13. **Mutation XSS**
```
User ID: <noscript><p title="</noscript><img src=x onerror=alert('XSS')>">
Password: test
```

### 14. **Template Literal XSS**
```
User ID: <script>alert`XSS`</script>
Password: test
```

---

## Benign Inputs - Edge Cases (Should NOT be flagged)

### 1. **Normal Credentials**
```
User ID: john.doe@example.com
Password: MySecurePass123!
```

### 2. **Email Addresses**
```
User ID: user@domain.com
Password: password123
```

### 3. **Special Characters (Non-Malicious)**
```
User ID: user-name_123
Password: P@ssw0rd!
```

### 4. **SQL-Like Strings (But Not SQLi)**
```
User ID: SELECT username FROM profile
Password: test
```
```
User ID: admin OR user
Password: test
```

### 5. **HTML-Like Strings (But Not XSS)**
```
User ID: <username>
Password: test
```
```
User ID: script.js
Password: test
```

### 6. **Common Words That Might Trigger False Positives**
```
User ID: administrator
Password: password
```
```
User ID: admin123
Password: test123
```

### 7. **URLs (Benign)**
```
User ID: https://example.com
Password: test
```

### 8. **Code Snippets (Non-Malicious)**
```
User ID: function login() { return true; }
Password: test
```

### 9. **Quoted Strings (Normal)**
```
User ID: "John Doe"
Password: test
```

### 10. **Numbers and Math**
```
User ID: 12345
Password: 67890
```

### 11. **Unicode Characters**
```
User ID: 用户@example.com
Password: 密码123
```

### 12. **Long Strings (But Benign)**
```
User ID: thisisareallylongusernamethatshouldnotbetriggeredasattack
Password: thisisareallylongpasswordthatshouldnotbetriggeredasattack
```

### 13. **Mixed Case (Normal)**
```
User ID: JohnDoe123
Password: MyPassWord456
```

### 14. **Common Passwords (Should be Benign)**
```
User ID: user@test.com
Password: password
```
```
User ID: admin@test.com
Password: admin
```

### 15. **SQL Keywords in Context (Not SQLi)**
```
User ID: select_user_profile
Password: test
```
```
User ID: user_table_name
Password: test
```

---

## Testing Strategy

### Recommended Test Flow:
1. **Start with Benign Cases** - Ensure no false positives
2. **Test Basic SQLi/XSS** - Verify detection works
3. **Test Edge Cases** - Challenge the detection system
4. **Test Encoding Variations** - Ensure robust detection
5. **Test Filter Bypasses** - Test evasion techniques

### Expected Behavior:
- **SQLi cases**: Should redirect to fake dashboard with slow loading
- **XSS cases**: Should redirect to fake dashboard with slow loading
- **Benign cases**: Should show normal response or redirect to real dashboard (if admin credentials)

### Admin Credentials (Backdoor):
```
User ID: tanay@chameleon.com
Password: admin
```
This should always redirect to the real admin dashboard.

---

## Notes

- These test cases are designed to challenge the ML model and pattern-based detection
- Some edge cases may require model retraining to detect properly
- The system should prioritize false negatives over false positives (better to catch attacks)
- Regular model updates with new attack patterns are recommended



