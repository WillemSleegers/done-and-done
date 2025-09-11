# TODO

## High Priority

### Component Improvements
- [ ] **Redo ThemeProvider to use typing as specified in the shadcn documentation**
  - Replace current custom typing with proper shadcn/ui theme provider implementation
  - Follow the official shadcn docs for next-themes integration
  - Remove type assertions and use proper TypeScript definitions

- [ ] **Use shadcn components instead of custom/manual solutions**
  - Replace custom buttons with shadcn Button component
  - Replace custom dropdowns with shadcn DropdownMenu component
  - Replace custom modals with shadcn Dialog component
  - Update UserMenu to use shadcn DropdownMenu
  - Replace custom form inputs with shadcn Input and Form components
  - Consider using shadcn Card component for project tiles
  - Review all custom UI elements and replace with shadcn equivalents where appropriate

### Documentation
- [ ] **Update CLAUDE.md to rely on Shadcn**
  - Update project description to emphasize shadcn/ui component system
  - Add guidance about using shadcn components over custom implementations
  - Document shadcn component conventions and best practices
  - Include instructions for adding new shadcn components via CLI

## Medium Priority

### Code Quality
- [ ] **Standardize component patterns**
  - Ensure all components follow shadcn/ui patterns
  - Consistent prop interfaces and naming conventions
  - Standardize loading states and error handling patterns

- [ ] **Performance Optimizations**
  - Implement React.memo for expensive components
  - Add virtualization for large todo lists
  - Optimize bundle size with better tree shaking

### Features
- [ ] **Enhanced Authentication**
  - Add password reset functionality
  - Implement email verification flow
  - Add profile management page
  - Support for additional OAuth providers

- [ ] **Data Management**
  - Add todo search/filtering
  - Implement todo categories/tags
  - Add project templates
  - Export/import functionality

## Low Priority

### Developer Experience
- [ ] **Testing Setup**
  - Add unit tests for components
  - Add integration tests for auth flow
  - Add E2E tests for critical user journeys

- [ ] **Accessibility**
  - Add proper ARIA labels
  - Improve keyboard navigation
  - Test with screen readers
  - Ensure proper color contrast

### Nice to Have
- [ ] **Advanced Features**
  - Real-time collaboration
  - Todo due dates and reminders
  - Project sharing
  - Mobile app with React Native
  - Offline mode with service worker

---

## Notes

- When implementing shadcn components, use the official CLI: `npx shadcn@latest add [component]`
- Follow the component composition patterns from shadcn documentation
- Maintain existing functionality while upgrading to shadcn components
- Test thoroughly after each component replacement