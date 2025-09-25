# Contributing to AISight

Thank you for considering contributing to AISight! This document provides guidelines and instructions for contributing to this project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```
   git clone https://github.com/YOUR-USERNAME/AISight.git
   cd AISight
   ```
3. **Install dependencies**
   ```
   npm install
   ```
4. **Set up environment**
   ```
   cp .env.example .env
   ```

## 🌿 Branching Strategy

- **main** - Production-ready code
- **develop** - Integration branch for features
- **feature/*** - New features
- **bugfix/*** - Bug fixes
- **hotfix/*** - Urgent fixes for production

Always branch off from `develop` for new features:
```
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

## 💻 Development Workflow

1. **Make your changes**
2. **Follow the coding standards**
   - Use TypeScript
   - Follow the ESLint and Prettier configurations
   - Keep components small and focused
3. **Write tests**
4. **Update documentation**
5. **Commit your changes**
   ```
   git add .
   git commit -m "feat: add vessel filtering"
   ```
   Use [conventional commits](https://www.conventionalcommits.org/) format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance tasks

## 🧪 Testing

Run tests before submitting your changes:
```
npm test
```

## 📝 Pull Request Process

1. **Update your fork with the latest changes**
   ```
   git checkout develop
   git pull upstream develop
   git checkout your-feature-branch
   git rebase develop
   ```
2. **Push your branch**
   ```
   git push origin your-feature-branch
   ```
3. **Create a pull request**
   - Go to the repository on GitHub
   - Click "New pull request"
   - Select your branch
   - Fill in the PR template

## 📋 Pull Request Checklist

- [ ] Code follows the style guidelines
- [ ] Changes have appropriate tests
- [ ] Documentation has been updated
- [ ] Commit messages follow the convention
- [ ] Branch has been rebased on latest develop
- [ ] No unnecessary files are included (build artifacts, .DS_Store, etc.)

## 🐛 Reporting Bugs

When reporting bugs, please include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Device/OS information

## 💡 Feature Requests

Feature requests are welcome! Please provide:
- A clear description of the feature
- The problem it solves
- Any alternatives you've considered
- Any relevant mockups or examples

## 📚 Code Review Process

All submissions require review. We use GitHub pull requests for this purpose.

## 🙏 Thank You

Your contributions make this project better for everyone. Thank you for your time and effort!
