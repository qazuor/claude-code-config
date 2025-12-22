---
name: atdd-methodology
category: patterns
description: Acceptance Test-Driven Development focusing on user acceptance criteria before implementation
usage: Use when acceptance criteria must be verified and stakeholder sign-off is required
input: User stories with acceptance criteria, business requirements
output: Automated acceptance tests, validated features meeting business requirements
config_required:
  - TEST_FRAMEWORK: "Acceptance test framework (e.g., Playwright, Cypress, TestCafe)"
  - ACCEPTANCE_DIR: "Directory for acceptance tests (e.g., tests/acceptance/)"
  - BASE_URL: "Application base URL for testing"
---

# ATDD Methodology

## Overview

Acceptance Test-Driven Development (ATDD) is a practice where the whole team collaboratively discusses acceptance criteria and creates acceptance tests before development begins, ensuring features meet business requirements.

## Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| TEST_FRAMEWORK | E2E framework | `Playwright`, `Cypress`, `TestCafe` |
| ACCEPTANCE_DIR | Test location | `tests/acceptance/`, `e2e/` |
| BASE_URL | App URL | `http://localhost:3000` |
| REPORT_DIR | Reports output | `reports/acceptance/` |

## The ATDD Cycle

### Discuss → Distill → Develop → Demo

1. **Discuss**: Team discusses user story and acceptance criteria
2. **Distill**: Write concrete acceptance tests from criteria
3. **Develop**: Implement feature until tests pass
4. **Demo**: Demonstrate passing tests to stakeholders

## Workflow

### 1. Discuss - Define Acceptance Criteria

**Participants**: Product Owner, Developers, QA

**User Story Format:**
```
As a [role]
I want [feature]
So that [benefit]

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

**Example:**
```markdown
## User Story: Password Reset

As a registered user
I want to reset my forgotten password
So that I can regain access to my account

### Acceptance Criteria:
- [ ] User can request password reset from login page
- [ ] System sends reset email within 5 minutes
- [ ] Reset link expires after 24 hours
- [ ] User can set new password with link
- [ ] Old password no longer works after reset
- [ ] User receives confirmation of password change
```

### 2. Distill - Write Acceptance Tests

**Transform criteria into executable tests:**

```typescript
// tests/acceptance/password-reset.spec.ts
import { test, expect } from '@playwright/test';
import { MailboxHelper } from '../helpers/mailbox';

test.describe('Password Reset', () => {
  test.describe('Request Reset', () => {
    test('user can request password reset from login page', async ({ page }) => {
      // Arrange
      await page.goto('/login');

      // Act
      await page.click('text=Forgot password?');
      await page.fill('[name="email"]', 'user@example.com');
      await page.click('button:has-text("Send reset link")');

      // Assert
      await expect(page.locator('.success-message')).toContainText(
        'Reset link sent'
      );
    });

    test('system sends reset email within 5 minutes', async ({ page }) => {
      const mailbox = new MailboxHelper();
      const email = `test-${Date.now()}@example.com`;

      // Create user and request reset
      await createTestUser(email);
      await page.goto('/forgot-password');
      await page.fill('[name="email"]', email);
      await page.click('button:has-text("Send reset link")');

      // Wait for email (max 5 minutes = 300000ms)
      const resetEmail = await mailbox.waitForEmail(email, {
        subject: 'Password Reset',
        timeout: 300000
      });

      expect(resetEmail).toBeDefined();
      expect(resetEmail.receivedAt).toBeLessThan(Date.now());
    });
  });

  test.describe('Reset Link', () => {
    test('reset link expires after 24 hours', async ({ page }) => {
      // Create expired reset token (25 hours old)
      const expiredToken = await createResetToken({
        email: 'user@example.com',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
      });

      await page.goto(`/reset-password?token=${expiredToken}`);

      await expect(page.locator('.error-message')).toContainText(
        'Reset link has expired'
      );
    });

    test('user can set new password with valid link', async ({ page }) => {
      const token = await createResetToken({ email: 'user@example.com' });

      await page.goto(`/reset-password?token=${token}`);
      await page.fill('[name="password"]', 'NewSecurePass123!');
      await page.fill('[name="confirmPassword"]', 'NewSecurePass123!');
      await page.click('button:has-text("Reset Password")');

      await expect(page).toHaveURL('/login');
      await expect(page.locator('.success-message')).toContainText(
        'Password reset successful'
      );
    });
  });

  test.describe('Post-Reset Behavior', () => {
    test('old password no longer works after reset', async ({ page }) => {
      // Reset password first
      await resetUserPassword('user@example.com', 'NewPassword123!');

      // Try login with old password
      await page.goto('/login');
      await page.fill('[name="email"]', 'user@example.com');
      await page.fill('[name="password"]', 'OldPassword123!');
      await page.click('button:has-text("Login")');

      await expect(page.locator('.error-message')).toContainText(
        'Invalid credentials'
      );
    });

    test('user receives confirmation of password change', async ({ page }) => {
      const mailbox = new MailboxHelper();
      const email = 'user@example.com';

      await resetUserPassword(email, 'NewPassword123!');

      const confirmationEmail = await mailbox.waitForEmail(email, {
        subject: 'Password Changed'
      });

      expect(confirmationEmail).toBeDefined();
      expect(confirmationEmail.body).toContain('password was changed');
    });
  });
});
```

### 3. Develop - Implement Feature

**Run acceptance tests continuously:**

```bash
# Watch mode during development
npx playwright test --watch

# Run specific test file
npx playwright test tests/acceptance/password-reset.spec.ts
```

**Implementation Order:**
1. Run tests - all should fail (RED)
2. Implement first criterion
3. Run tests - first should pass
4. Implement next criterion
5. Repeat until all tests pass (GREEN)

### 4. Demo - Demonstrate to Stakeholders

**Demo Checklist:**
- [ ] Show all acceptance tests passing
- [ ] Walk through each criterion
- [ ] Demonstrate actual feature behavior
- [ ] Get stakeholder sign-off
- [ ] Document any feedback

## Test Structure

### Page Object Pattern

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button:has-text("Login")');
  }

  async clickForgotPassword() {
    await this.page.click('text=Forgot password?');
  }

  async getErrorMessage() {
    return this.page.locator('.error-message').textContent();
  }
}

// Usage in tests
test('login with invalid credentials shows error', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'wrongpassword');

  const error = await loginPage.getErrorMessage();
  expect(error).toContain('Invalid credentials');
});
```

### Test Data Management

```typescript
// helpers/test-data.ts
export class TestDataManager {
  private createdUsers: string[] = [];
  private createdTokens: string[] = [];

  async createUser(data: CreateUserData): Promise<User> {
    const user = await db.users.create({ data });
    this.createdUsers.push(user.id);
    return user;
  }

  async createResetToken(email: string): Promise<string> {
    const token = generateToken();
    await db.resetTokens.create({
      data: { email, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    this.createdTokens.push(token);
    return token;
  }

  async cleanup() {
    await db.resetTokens.deleteMany({
      where: { token: { in: this.createdTokens } }
    });
    await db.users.deleteMany({
      where: { id: { in: this.createdUsers } }
    });
  }
}
```

## Project Structure

```
project/
├── tests/
│   ├── acceptance/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── logout.spec.ts
│   │   │   └── password-reset.spec.ts
│   │   ├── checkout/
│   │   │   ├── cart.spec.ts
│   │   │   └── payment.spec.ts
│   │   └── fixtures/
│   │       └── test-data.json
│   ├── pages/
│   │   ├── LoginPage.ts
│   │   └── CheckoutPage.ts
│   └── helpers/
│       ├── test-data.ts
│       └── mailbox.ts
├── playwright.config.ts
└── package.json
```

## ATDD vs TDD vs BDD

| Aspect | ATDD | TDD | BDD |
|--------|------|-----|-----|
| Focus | Acceptance criteria | Unit behavior | Business behavior |
| Level | System/E2E | Unit/Integration | Feature |
| Audience | Stakeholders | Developers | All team |
| Tests | Acceptance tests | Unit tests | Gherkin scenarios |
| When | Before implementation | During implementation | Before implementation |
| Sign-off | Required | Not required | Collaborative |

## Best Practices

### Do's
- Write acceptance tests before coding
- Include stakeholders in criteria discussion
- Keep tests focused on user-visible behavior
- Use clear, business-language test names
- Maintain test independence

### Don'ts
- Don't test implementation details
- Don't skip the discussion phase
- Don't write tests after implementation
- Don't make tests dependent on each other
- Don't ignore flaky tests

## When to Use ATDD

**Good for:**
- Features requiring stakeholder approval
- Complex business workflows
- Regulatory/compliance requirements
- Critical user journeys
- Customer-facing features

**Less suitable for:**
- Internal tools
- Technical refactoring
- Infrastructure changes
- Rapid prototyping

## Output

**Produces:**
- Acceptance test suite aligned with criteria
- Feature implementation meeting requirements
- Stakeholder demonstration and sign-off
- Documentation of accepted behavior

**Success Criteria:**
- All acceptance tests passing
- Stakeholder approval obtained
- Acceptance criteria fully covered
- Feature deployed and verified
