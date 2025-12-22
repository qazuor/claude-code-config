---
name: bdd-methodology
category: patterns
description: Behavior-Driven Development using Gherkin syntax and collaborative specification
usage: Use when business stakeholders need to understand tests and behavior specifications
input: User stories, business requirements, acceptance criteria in natural language
output: Executable specifications with Given-When-Then scenarios, living documentation
config_required:
  - TEST_FRAMEWORK: "BDD test framework (e.g., Cucumber, Playwright BDD, Vitest-cucumber)"
  - FEATURE_DIR: "Directory for feature files (e.g., features/)"
  - STEP_DEFINITIONS_DIR: "Directory for step definitions (e.g., steps/)"
---

# BDD Methodology

## Overview

Behavior-Driven Development (BDD) is a collaborative approach that bridges the gap between technical and non-technical stakeholders through shared language and executable specifications.

## Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| TEST_FRAMEWORK | BDD framework | `Cucumber`, `Playwright BDD`, `Vitest-cucumber` |
| FEATURE_DIR | Feature files location | `features/`, `specs/` |
| STEP_DEFINITIONS_DIR | Step definitions | `steps/`, `step-definitions/` |
| REPORT_FORMAT | Report output | `html`, `json`, `junit` |

## The BDD Cycle

### Discovery → Formulation → Automation

1. **Discovery**: Collaborate to understand behavior
2. **Formulation**: Write scenarios in Gherkin
3. **Automation**: Implement step definitions

## Gherkin Syntax

### Feature Files

```gherkin
# features/user-registration.feature
Feature: User Registration
  As a new visitor
  I want to create an account
  So that I can access member features

  Background:
    Given the registration page is open

  Scenario: Successful registration with valid data
    Given I am on the registration page
    When I fill in "email" with "user@example.com"
    And I fill in "password" with "SecurePass123!"
    And I fill in "confirm_password" with "SecurePass123!"
    And I click the "Register" button
    Then I should see "Registration successful"
    And I should receive a confirmation email

  Scenario: Registration fails with existing email
    Given a user exists with email "existing@example.com"
    When I fill in "email" with "existing@example.com"
    And I fill in "password" with "SecurePass123!"
    And I click the "Register" button
    Then I should see "Email already registered"

  Scenario Outline: Registration validation
    When I fill in "email" with "<email>"
    And I fill in "password" with "<password>"
    And I click the "Register" button
    Then I should see "<error_message>"

    Examples:
      | email           | password | error_message            |
      | invalid-email   | Pass123! | Invalid email format     |
      | user@test.com   | short    | Password too short       |
      | user@test.com   | nodigits | Password needs a number  |
```

### Step Definitions

```typescript
// steps/registration.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('the registration page is open', async function () {
  await this.page.goto('/register');
});

Given('I am on the registration page', async function () {
  await expect(this.page).toHaveURL('/register');
});

Given('a user exists with email {string}', async function (email: string) {
  await this.db.users.create({
    data: { email, password: 'hashed-password' }
  });
});

When('I fill in {string} with {string}', async function (field: string, value: string) {
  await this.page.locator(`[name="${field}"]`).fill(value);
});

When('I click the {string} button', async function (buttonText: string) {
  await this.page.getByRole('button', { name: buttonText }).click();
});

Then('I should see {string}', async function (text: string) {
  await expect(this.page.getByText(text)).toBeVisible();
});

Then('I should receive a confirmation email', async function () {
  const emails = await this.mailbox.getEmails(this.testEmail);
  expect(emails).toHaveLength(1);
  expect(emails[0].subject).toContain('Confirm your email');
});
```

## Best Practices

### Writing Good Scenarios

```gherkin
# Good - Business language, declarative
Scenario: Customer places order with valid payment
  Given the customer has items in their cart
  And the customer has a valid payment method
  When the customer completes checkout
  Then the order should be confirmed
  And the customer should receive an order confirmation

# Bad - Technical, imperative
Scenario: Order creation
  Given I click on cart icon
  And I click checkout button
  And I enter "4111111111111111" in credit card field
  And I click submit
  Then database should have new order record
```

### Scenario Organization

```gherkin
Feature: Shopping Cart Management

  # Group related scenarios
  @cart @add-items
  Scenario: Add single item to cart
    ...

  @cart @add-items
  Scenario: Add multiple items to cart
    ...

  @cart @remove-items
  Scenario: Remove item from cart
    ...

  @cart @edge-cases
  Scenario: Add item when cart is at maximum capacity
    ...
```

## Three Amigos Session

### Participants
- **Business**: Product Owner, Business Analyst
- **Development**: Developer, Tech Lead
- **Testing**: QA Engineer, Tester

### Process

1. **Present User Story**: Business explains the feature
2. **Ask Questions**: Team clarifies requirements
3. **Write Scenarios**: Collaboratively draft Gherkin
4. **Review**: Ensure shared understanding
5. **Refine**: Polish scenarios after discussion

### Example Session Output

```gherkin
# Before Three Amigos - Vague
Scenario: User logs in
  Given a user
  When they log in
  Then it works

# After Three Amigos - Clear
Scenario: Registered user logs in with correct credentials
  Given a registered user with email "user@example.com"
  And the user has password "ValidPass123!"
  When the user submits login with email "user@example.com" and password "ValidPass123!"
  Then the user should be redirected to the dashboard
  And the user should see their name in the header
  And the last login timestamp should be updated
```

## Project Structure

```
project/
├── features/
│   ├── authentication/
│   │   ├── login.feature
│   │   ├── logout.feature
│   │   └── password-reset.feature
│   ├── cart/
│   │   ├── add-items.feature
│   │   └── checkout.feature
│   └── support/
│       ├── world.ts          # Test context/world
│       └── hooks.ts          # Before/After hooks
├── steps/
│   ├── authentication.steps.ts
│   ├── cart.steps.ts
│   └── common.steps.ts       # Shared steps
└── cucumber.config.ts
```

## Configuration Example

```typescript
// cucumber.config.ts
export default {
  paths: ['features/**/*.feature'],
  require: ['steps/**/*.steps.ts'],
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    ['html', 'reports/cucumber-report.html'],
    ['json', 'reports/cucumber-report.json']
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  },
  worldParameters: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  }
};
```

## BDD vs TDD

| Aspect | BDD | TDD |
|--------|-----|-----|
| Language | Business/Natural | Technical |
| Audience | All stakeholders | Developers |
| Focus | Behavior | Implementation |
| Format | Gherkin scenarios | Unit tests |
| Collaboration | Three Amigos | Developer-focused |
| Documentation | Living docs | Code comments |

## When to Use BDD

**Good for:**
- Complex business rules
- Stakeholder collaboration
- Acceptance testing
- Living documentation
- User-facing features

**Less suitable for:**
- Internal utilities
- Pure technical implementations
- Low-level unit tests
- Rapid prototyping

## Output

**Produces:**
- Feature files with Gherkin scenarios
- Step definition implementations
- Living documentation
- Executable specifications

**Success Criteria:**
- All scenarios passing
- Stakeholders can read and understand tests
- Scenarios cover acceptance criteria
- Documentation stays current with code
