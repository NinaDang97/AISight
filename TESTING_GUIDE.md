# AISight Testing Guide

## Overview

This guide provides comprehensive instructions for testing the AISight mobile application. Our testing strategy focuses on ensuring reliability, performance, and correctness across all features.

## Table of Contents

1. [Test Infrastructure Setup](#test-infrastructure-setup)
2. [Running Tests](#running-tests)
3. [Writing New Tests](#writing-new-tests)
4. [Test Coverage](#test-coverage)
5. [Test Organization](#test-organization)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Test Infrastructure Setup

### Prerequisites

- Node.js >= 18
- npm or yarn
- React Native development environment configured

### Installation

All test dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Test Configuration

- **Jest Config**: [`jest.config.js`](jest.config.js)
- **Test Setup**: [`__tests__/setup/setupTests.ts`](__tests__/setup/setupTests.ts)
- **Mocks**: [`__tests__/mocks/`](__tests__/mocks/)
- **Utilities**: [`__tests__/utils/`](__tests__/utils/)
- **Factories**: [`__tests__/factories/`](__tests__/factories/)

---

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only screen tests
npm run test:screens

# Run specific screen tests
npm run test:splash
npm run test:welcome

# Run service tests
npm run test:services

# Run context tests
npm run test:contexts

# Run component tests
npm run test:components

# Update test snapshots
npm run test:update

# Run tests for CI/CD (optimized for GitHub Actions)
npm run test:ci
```

### Running Specific Test Files

```bash
# Run a specific test file
npm test -- __tests__/screens/SplashScreen.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should display"

# Run tests in a specific folder
npm test -- __tests__/screens/
```

### Watching Specific Tests

```bash
# Watch a specific test file
npm test -- --watch __tests__/screens/WelcomeScreen.test.tsx
```

---

## Test Coverage

### Current Coverage Goals

- **Lines**: 60%
- **Functions**: 50%
- **Branches**: 50%
- **Statements**: 60%

### Viewing Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:

- **Terminal**: Summary displayed in console
- **HTML Report**: `coverage/lcov-report/index.html` (open in browser)
- **LCOV File**: `coverage/lcov.info` (for CI/CD tools)

### Coverage by Module

```bash
# Generate coverage for specific modules
npm test -- --coverage --collectCoverageFrom="src/screens/**/*.{ts,tsx}"
npm test -- --coverage --collectCoverageFrom="src/services/**/*.{ts,tsx}"
npm test -- --coverage --collectCoverageFrom="src/contexts/**/*.{ts,tsx}"
```

---

## Test Organization

### Directory Structure

```
__tests__/
├── setup/
│   └── setupTests.ts          # Global test setup
├── mocks/
│   ├── fileMock.js            # Mock for images/assets
│   └── envMock.js             # Mock for environment variables
├── utils/
│   └── testHelpers.tsx        # Shared test utilities
├── factories/
│   ├── vesselFactory.ts       # Mock data generators for vessels
│   └── anomalyFactory.ts      # Mock data generators for anomalies
├── screens/
│   ├── SplashScreen.test.tsx  # Splash screen tests
│   └── WelcomeScreen.test.tsx # Welcome screen tests
├── services/
│   └── AnomalyDetector.test.ts
├── contexts/
│   └── GnssContext.test.tsx
└── components/
    └── GnssExportManager.test.tsx
```

### Test File Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test file location: Mirror the `src/` structure in `__tests__/`
- Example:
  - Source: `src/screens/SplashScreen/SplashScreen.tsx`
  - Test: `__tests__/screens/SplashScreen.test.tsx`

---

## Writing New Tests

### Test Template

```typescript
/**
 * ComponentName Tests
 * Based on test plan: TEST-ID-XXX
 *
 * Test Cases Covered:
 * - TEST-ID-001: Description
 * - TEST-ID-002: Description
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ComponentName } from '../../src/path/to/Component';

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST-ID-001: Test scenario name', () => {
    it('should do something specific', () => {
      const { getByText } = render(<ComponentName />);

      expect(getByText('Expected Text')).toBeTruthy();
    });
  });
});
```

### Using Test Utilities

```typescript
import { renderWithProviders, createMockNavigation } from '../utils/testHelpers';

// Render with providers (Navigation, SafeArea, etc.)
const { getByText } = renderWithProviders(<MyScreen />);

// Create mock navigation
const mockNavigation = createMockNavigation();
```

### Using Mock Data Factories

```typescript
import { createMockVesselLocation, createMockVesselList } from '../factories/vesselFactory';
import { createMockEpoch, createBaselineEpochs } from '../factories/anomalyFactory';

// Create single mock vessel
const vessel = createMockVesselLocation({ mmsi: '230123456', sog: 15.5 });

// Create multiple mock vessels
const vessels = createMockVesselList(20);

// Create GNSS epochs for anomaly testing
const baselineEpochs = createBaselineEpochs(50, 42.0, -8.0);
```

---

## Test Cases by Screen

### Splash Screen Tests

**File**: `__tests__/screens/SplashScreen.test.tsx`

**Test Cases Covered**:
- APP-SPL-001: Splash screen displays correctly
- APP-SPL-002: Splash screen handles app kill during loading
- APP-SPL-003: Splash screen on slow network

**Run Tests**:
```bash
npm run test:splash
```

### Welcome Screen Tests

**File**: `__tests__/screens/WelcomeScreen.test.tsx`

**Test Cases Covered**:
- APP-ONB-001: Welcome screen displays all elements
- APP-ONB-002: Get Started button navigation
- APP-ONB-003: Welcome screen UI responsiveness

**Run Tests**:
```bash
npm run test:welcome
```

---

## Best Practices

### 1. Test Naming

- Use descriptive test names that explain **what** and **why**
- Follow the pattern: `should [expected behavior] when [condition]`

```typescript
// Good
it('should navigate to Map screen when Get Started button is pressed', () => {});

// Bad
it('test button', () => {});
```

### 2. Test Independence

- Each test should be independent and not rely on other tests
- Use `beforeEach` to set up fresh state
- Clean up after tests with `afterEach`

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 3. Avoid Implementation Details

- Test behavior, not implementation
- Avoid testing internal state or private methods
- Focus on user-facing behavior

```typescript
// Good - tests user behavior
expect(getByText('Welcome')).toBeTruthy();
fireEvent.press(getByText('Get Started'));
expect(mockNavigate).toHaveBeenCalled();

// Bad - tests implementation
expect(component.state.isLoading).toBe(false);
```

### 4. Use Meaningful Assertions

- Use specific assertions over generic ones
- Provide clear failure messages

```typescript
// Good
expect(mockNavigate).toHaveBeenCalledWith('Main', {
  screen: 'MapTab',
  params: { screen: 'Map' },
});

// Bad
expect(mockNavigate).toHaveBeenCalled();
```

### 5. Mock External Dependencies

- Mock navigation, contexts, and external services
- Use test utilities and factories for mock data

```typescript
// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock context
jest.mock('../../src/contexts/VesselMqttContext', () => ({
  useVesselMqtt: () => mockVesselMqttContext,
}));
```

### 6. Test Edge Cases

- Test error states, loading states, empty states
- Test boundary conditions
- Test async operations

```typescript
it('should handle empty vessel list gracefully', () => {
  mockVesselMqttContext.vesselList = [];
  const { getByText } = render(<WelcomeScreen />);
  expect(getByText('Welcome')).toBeTruthy();
});
```

---

## Troubleshooting

### Common Issues

#### Issue: Tests fail with "Cannot find module"

**Solution**: Check import paths and ensure the module exists

```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Issue: Tests timeout

**Solution**: Increase timeout or use fake timers

```typescript
// Increase timeout
jest.setTimeout(10000);

// Use fake timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```

#### Issue: Animated tests fail

**Solution**: Mock animations

```typescript
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
```

#### Issue: Navigation tests fail

**Solution**: Wrap component in NavigationContainer

```typescript
import { NavigationContainer } from '@react-navigation/native';

render(
  <NavigationContainer>
    <MyScreen />
  </NavigationContainer>
);
```

### Debugging Tests

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run with verbose output
npm test -- --verbose

# See which tests are running
npm test -- --listTests
```

---

## CI/CD Integration

### GitHub Actions

Tests are automatically run on pull requests and pushes to main branch.

**Manual CI Test**:
```bash
npm run test:ci
```

This command:
- Runs all tests
- Generates coverage report
- Uses 2 workers (optimized for CI)
- Fails if coverage thresholds aren't met

---

## Adding New Test Suites

### 1. Create Test File

```bash
touch __tests__/screens/NewScreen.test.tsx
```

### 2. Write Tests

Follow the template and best practices above.

### 3. Add npm Script (Optional)

Edit `package.json`:

```json
"scripts": {
  "test:newscreen": "jest __tests__/screens/NewScreen.test.tsx"
}
```

### 4. Run Tests

```bash
npm test -- __tests__/screens/NewScreen.test.tsx
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [AISight Test Plan Spreadsheet](https://docs.google.com/spreadsheets/d/1WxPfteI_9mgo-klfTSHcHQe9okcSh5oBYo2asVkmfKg/)

---

## Questions or Issues?

- Check existing tests for examples
- Consult test utilities in `__tests__/utils/`
- Review mock factories in `__tests__/factories/`
- Ask the team for help

Happy Testing! 🎉
