# AISight Project Architecture Guidelines

## 📱 What is AISight?

AISight is a React Native mobile application that displays marine traffic data using MapLibre for visualization and the Digitraffic API for real-time vessel information. The app allows users to track vessels, view their details, and search for specific ships.

## 🏗️ Why This Architecture?

We've chosen a **Modular MVVM (Model-View-ViewModel) Architecture** for AISight because it:

1. **Separates concerns** - UI, business logic, and data are clearly separated
2. **Improves testability** - Each component can be tested independently
3. **Enhances maintainability** - Changes in one area don't affect others
4. **Scales well** - New features can be added without disrupting existing code
5. **Is beginner-friendly** - Clear structure makes it easier for new developers to understand

## 📂 Project Structure Explained

```
AISight/
├── src/                      # All source code lives here
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Generic components (buttons, loaders, etc.)
│   │   ├── map/              # Map-specific components
│   │   └── marine/           # Marine traffic specific components
│   │
│   ├── screens/              # Full screens of the app
│   │   ├── SplashScreen/     # App initialization screen
│   │   ├── OnboardingScreens/# First-time user experience
│   │   ├── MainScreens/      # Core app screens
│   │   ├── SettingsScreens/  # Settings and configuration
│   │   └── ErrorScreens/     # Error handling screens
│   │
│   ├── navigation/           # Navigation system
│   │   ├── navigators/       # Different navigator types
│   │   ├── routes/           # Route definitions
│   │   ├── linking/          # Deep linking configuration
│   │   └── helpers/          # Navigation helper functions
│   │
│   ├── services/             # External service integrations
│   │   ├── api/              # API service layer
│   │   ├── map/              # Map service abstraction
│   │   ├── storage/          # Local storage services
│   │   ├── permissions/      # Permission handling
│   │   ├── notification/     # Push notifications
│   │   └── analytics/        # Analytics and tracking
│   │
│   ├── models/               # Data models and types
│   │
│   ├── viewModels/           # Business logic layer (MVVM)
│   │
│   ├── hooks/                # Custom React hooks
│   │
│   ├── contexts/             # React contexts for state management
│   │
│   ├── utils/                # Utility functions
│   │
│   ├── styles/               # Shared styling
│   │
│   └── config/               # Configuration files
│
├── assets/                   # Static assets
│   ├── images/
│   ├── fonts/
│   └── animations/
│
├── types/                    # TypeScript type definitions
└── __tests__/                # Test files
```

## 🧩 Key Architectural Components

### 1. Components
- **What**: Reusable UI elements
- **Why**: Promotes reusability and consistency across the app
- **Example**: `<VesselMarker />` can be used anywhere we need to show a vessel on the map

### 2. Screens
- **What**: Full application screens composed of components
- **Why**: Organizes the UI into logical sections
- **Example**: `MapScreen.tsx` combines map components, controls, and vessel information

### 3. Services
- **What**: Interfaces to external systems like APIs and device features
- **Why**: Abstracts external dependencies for easier testing and replacement
- **Example**: If we want to switch from MapLibre to another map provider, we only change the map service

### 4. ViewModels
- **What**: Business logic that connects UI to data
- **Why**: Separates business logic from UI for better testing and maintenance
- **Example**: `VesselViewModel.ts` handles fetching, filtering, and updating vessel data

### 5. Navigation
- **What**: System for moving between screens
- **Why**: Centralizes navigation logic
- **Example**: The app uses React Navigation with a tab-based main interface

## 🔄 Data Flow

1. **User interacts with a View (Component/Screen)**
2. **View calls ViewModel methods**
3. **ViewModel processes data through Services**
4. **Services communicate with external systems**
5. **Data flows back through the same path**

```
User → View → ViewModel → Services → External Systems
                 ↑            ↑
                 |            |
                 ↓            ↓
              State        Data Models
```

## 🛠️ Technology Choices

### React Native
- **Why**: Cross-platform development with native performance
- **Benefits**: Single codebase for iOS and Android

### TypeScript
- **Why**: Type safety and better developer experience
- **Benefits**: Catches errors early, improves code quality and maintainability

### MapLibre
- **Why**: Open-source mapping solution
- **Benefits**: Customizable, no usage limits

### Zustand
- **Why**: Simple state management
- **Benefits**: Less boilerplate than Redux, works well with React hooks

### React Navigation
- **Why**: Standard navigation library for React Native
- **Benefits**: Comprehensive, well-documented, actively maintained

## 🚀 Development Workflow

1. **Feature Branches**: Create a branch for each feature or fix
   ```
   git checkout -b feature/vessel-tracking
   ```

2. **Component Development**: Build and test components in isolation

3. **Screen Integration**: Combine components into screens

4. **Testing**: Write tests for components, viewmodels, and services

5. **Code Review**: Follow the checklist in CONTRIBUTING.md

## 🧪 Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test how components work together
3. **E2E Tests**: Test complete user flows

## 📝 Coding Standards

- Follow ESLint and Prettier configurations
- Use TypeScript for all new code
- Document complex functions and components
- Keep components small and focused

## 🌱 Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Run `npm install`
4. Run `npm run ios` or `npm run android`

## 📚 Further Reading

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [MapLibre React Native](https://github.com/maplibre/maplibre-react-native)
- [Digitraffic API Documentation](https://www.digitraffic.fi/en/marine-traffic/)
- [MVVM Architecture](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.
