# Contributing Guidelines

## CI/CD Pipeline

This project uses automated CI/CD to validate all code before it's merged. Every push and pull request triggers validation checks.

## Pre-Commit Validation

Before pushing code, the following checks run automatically:

### 1. File Validation
- ✓ No binary files (.exe, .dll, .so)
- ✓ File size limit: 10MB
- ✓ No hardcoded credentials
- ✓ No sensitive data

### 2. Code Quality
- ✓ HTML validation (DOCTYPE, proper structure)
- ✓ JavaScript/TypeScript syntax checking
- ✓ JSON validation
- ✓ ESLint compliance
- ✓ TypeScript type checking

### 3. Security Checks
- ✓ npm audit (vulnerability scanning)
- ✓ Credential scanning
- ✓ Secret detection

### 4. Dashboard Tests
- ✓ Required libraries present (Leaflet, Chart.js)
- ✓ Proper HTML structure
- ✓ No console.log statements
- ✓ No debugger statements

## How to Contribute

### 1. Fork and Clone
```bash
git clone https://github.com/Ad1th21/Adith.git
cd Adith
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes
- Write clean, documented code
- Follow existing code style
- Remove debugging statements

### 4. Test Locally
```bash
# Open live-dashboard.html in browser
# Verify all features work
```

### 5. Commit with Good Messages
```bash
git add .
git commit -m "feat: add new vehicle status filter"
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### 6. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pre-Commit Checklist

Before committing, ensure:
- [ ] Code runs without errors
- [ ] All `console.log` removed
- [ ] All `debugger` removed
- [ ] No hardcoded passwords/tokens
- [ ] Files under 10MB
- [ ] HTML has proper DOCTYPE
- [ ] JSON is valid
- [ ] Commit message is descriptive

## CI/CD Pipeline Stages

### Stage 1: File Validation
Validates file types, sizes, and checks for forbidden content.

### Stage 2: Frontend Validation
Checks HTML/CSS/JS syntax and structure.

### Stage 3: TypeScript Validation
Type checks and builds TypeScript files.

### Stage 4: Linting
Runs ESLint on all code files.

### Stage 5: Security Scan
Scans for vulnerabilities and secrets.

### Stage 6: Dashboard Tests
Validates the live dashboard structure and dependencies.

### Stage 7: Integration Tests
Runs integration tests across components.

### Stage 8: Deploy
Automatically deploys to production if all checks pass (main branch only).

## Questions?

Open an issue on GitHub or contact the maintainers.

---

Thank you for contributing! 🚀
