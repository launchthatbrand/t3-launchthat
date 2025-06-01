# Testing Convex Functions

This directory contains tests for Convex functions used in the Email Parser application.

## Testing Strategy

### Manual Testing

Convex does not currently have a built-in testing framework for server-side functions. As a result, our testing strategy relies on a combination of approaches:

1. **Dashboard Testing**: Use the Convex Dashboard to manually test functions:

   - Navigate to the Convex Dashboard
   - Select the "Functions" tab
   - Click on the function you want to test
   - Fill in the arguments and run the function
   - Verify the output matches expectations

2. **Client-Side Testing**: Create simple React components to test functions:
   - Create a test component that calls the function
   - Display the results and any errors
   - Verify the function behaves as expected

### Test Cases

Key test cases to cover:

#### Authentication

- Test unauthenticated access to protected resources (should be denied)
- Test authenticated access to own resources (should be allowed)
- Test authenticated access to others' resources (should be denied)
- Test public/private resource access permissions

#### Email Operations

- List emails (with and without authentication)
- Get a single email (with and without authentication)
- Add a mock email (with and without authentication)

#### Template Operations

- List templates (with and without authentication, with and without includePublic)
- Get a template (with and without authentication, public vs. private)
- Create a template (with and without authentication)
- Update a template (with and without authentication, own vs. others)

#### Field Operations

- List fields by template (with and without authentication)
- Create a field (with and without authentication)
- Update a field (with and without authentication)
- Delete a field (with and without authentication)

#### Error Handling

- Test proper error responses for invalid inputs
- Test error handling for unauthenticated requests
- Test error handling for unauthorized requests
- Test error handling for not found resources

### Future Improvements

Future improvements to the testing infrastructure:

1. Implement a mock database for testing
2. Create automated tests using a testing framework like Jest
3. Set up CI/CD pipeline to run tests automatically
4. Add integration tests to verify client-server interactions
