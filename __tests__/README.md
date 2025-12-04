# AISight Test Suite

This directory contains automated tests for the AISight mobile application.

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific screens
npm run test:splash
npm run test:welcome
```

## Directory Structure

```
__tests__/
├── README.md                   # This file
├── setup/                      # Test configuration
│   └── setupTests.ts          # Global setup, mocks
├── mocks/                      # Mock files
│   ├── fileMock.js            # Image/asset mocks
│   └── envMock.js             # Environment variable mocks
├── utils/                      # Test utilities
│   └── testHelpers.tsx        # Render helpers, mock creators
└── screens/                    # Screen tests
    ├── SplashScreen.test.tsx  # APP-SPL-001 to APP-SPL-003
    └── WelcomeScreen.test.tsx # APP-ONB-001 to APP-ONB-003
```

## Test Infrastructure Components

### 1. Setup Files

**`setup/setupTests.ts`**
- Runs before all tests
- Configures mocks for React Native modules
- Sets up testing library extensions
- Mocks native modules (GNSS, permissions, etc.)

### 2. Mock Files

**`mocks/fileMock.js`**
- Handles image and asset imports in tests

**`mocks/envMock.js`**
- Provides safe environment variable values for tests

### 3. Test Utilities

**`utils/testHelpers.tsx`**

Functions available:
- `renderWithProviders()` - Renders components with Navigation and SafeArea providers
- `createMockNavigation()` - Creates mock navigation object
- `createMockRoute()` - Creates mock route object
- `delay()` - Async delay helper
- `waitFor()` - Wait for condition
- `suppressConsole()` - Suppress console output in tests

Usage:
```typescript
import { renderWithProviders, createMockNavigation } from '../utils/testHelpers';

const { getByText } = renderWithProviders(<MyScreen />);
const mockNav = createMockNavigation();
```

## Test Coverage

Current screens with tests:
- ✅ SplashScreen (APP-SPL-001 to APP-SPL-003) - 16 tests
- ✅ WelcomeScreen (APP-ONB-001 to APP-ONB-003) - 20 tests

**Total: 36 tests, all passing ✅**

## Writing New Tests

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive guide.

Quick template:
```typescript
/**
 * ComponentName Tests
 * Test IDs: TEST-XXX-001 to TEST-XXX-003
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../../src/path/to/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

## Running Tests

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for all test commands.

### Quick Commands

```bash
# Run SplashScreen tests
npm run test:splash

# Run WelcomeScreen tests
npm run test:welcome

# Run both screen tests
npm run test:screens

# Watch mode (auto-rerun on changes)
npm run test:watch
```

## Next Steps for Team

When adding tests for new screens/components:

1. Create test file in `__tests__/screens/` directory
2. Import test utilities from `../utils/testHelpers`
3. Write tests following existing patterns in SplashScreen.test.tsx or WelcomeScreen.test.tsx
4. Run tests: `npm test -- path/to/test.file.tsx`
5. Check coverage: `npm run test:coverage`
6. Commit with descriptive message

## Questions?

- Check [TESTING_GUIDE.md](../TESTING_GUIDE.md)
- Review existing test files for examples:
  - `screens/SplashScreen.test.tsx`
  - `screens/WelcomeScreen.test.tsx`
- Ask the team for help

Happy Testing! 🧪
