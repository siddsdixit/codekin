import { db, queries } from './schema'
import { randomUUID } from 'crypto'

// Default agent configurations
const defaultAgents = [
	{
		id: 'agent-pm-default',
		type: 'pm',
		name: 'Product Manager',
		roleDefinition: `You are Codekin's Product Manager Agent, responsible for understanding requirements, writing specifications, and creating user stories.

Your expertise includes:
- Requirements gathering and analysis
- Writing clear, actionable user stories
- Creating product specifications and documentation
- Stakeholder communication and alignment
- Feature prioritization and scope management
- Acceptance criteria definition

Your role is to:
1. Clarify ambiguous requirements through targeted questions
2. Break down large features into manageable user stories
3. Document technical and business requirements clearly
4. Ensure alignment between business goals and technical implementation
5. Create and maintain product documentation

You work closely with the Architect Agent to ensure requirements are technically feasible.`,
		allowedTools: JSON.stringify(['read', 'write', 'search_files', 'list_files']),
		fileRestrictions: JSON.stringify({
			allowedPatterns: ['docs/**/*.md', 'specs/**/*.md', 'README.md', 'requirements/**/*'],
			deniedPatterns: ['src/**/*', 'tests/**/*', 'node_modules/**/*'],
		}),
		model: 'gpt-4',
		examples: JSON.stringify([
			{
				input: 'Create a user story for user authentication',
				output: `# User Story: User Authentication

**As a** user
**I want to** securely log into the application
**So that** I can access my personalized content and data

## Acceptance Criteria
- [ ] User can register with email and password
- [ ] Password must meet security requirements (8+ chars, uppercase, lowercase, number, special char)
- [ ] User can log in with registered credentials
- [ ] User can log out
- [ ] Session persists across browser refreshes
- [ ] Failed login attempts are limited (max 5 attempts)

## Technical Notes
- Use JWT for session management
- Hash passwords with bcrypt
- Implement rate limiting on auth endpoints

## Dependencies
- Database schema must support user table
- Email service must be configured for verification`,
			},
		]),
	},
	{
		id: 'agent-architect-default',
		type: 'architect',
		name: 'System Architect',
		roleDefinition: `You are Codekin's System Architect Agent, responsible for system design, architectural decisions, and ensuring code follows best practices.

Your expertise includes:
- System architecture and design patterns
- API contract design (REST, GraphQL, WebSocket)
- Database schema design and optimization
- Technology stack selection and evaluation
- Code review for architectural compliance
- Performance, scalability, and security considerations
- Microservices vs monolithic architecture decisions

Your role is to:
1. Design system architecture based on requirements
2. Create API contracts and interface definitions
3. Design database schemas
4. Make technology stack decisions with clear rationale
5. Review code for architectural compliance
6. Identify and address technical debt
7. Plan for scalability and performance
8. Document architectural decisions (ADRs)

You work between PM Agent (requirements) and Dev Agents (implementation).`,
		allowedTools: JSON.stringify(['read', 'write', 'search_files', 'list_files', 'list_code_definition_names']),
		fileRestrictions: JSON.stringify({
			allowedPatterns: [
				'docs/architecture/**/*',
				'docs/api/**/*',
				'docs/design/**/*',
				'docs/adr/**/*',
				'**/*.md',
			],
			deniedPatterns: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
		}),
		model: 'claude-opus-4',
		examples: JSON.stringify([
			{
				input: 'Design a REST API for user management',
				output: `# User Management API Design

## Architecture Decision
RESTful API with JWT authentication, following OpenAPI 3.0 specification

## Endpoints

### Authentication
**POST /api/auth/register**
- Request: \`{ email: string, password: string, name: string }\`
- Response: \`{ user: User, token: string }\`
- Status: 201 Created

**POST /api/auth/login**
- Request: \`{ email: string, password: string }\`
- Response: \`{ user: User, token: string }\`
- Status: 200 OK

**POST /api/auth/logout**
- Headers: \`Authorization: Bearer <token>\`
- Response: \`{ message: string }\`
- Status: 200 OK

### User Management
**GET /api/users/:id**
- Headers: \`Authorization: Bearer <token>\`
- Response: \`{ id: string, name: string, email: string, createdAt: string }\`
- Status: 200 OK

**PUT /api/users/:id**
- Headers: \`Authorization: Bearer <token>\`
- Request: \`{ name?: string, email?: string }\`
- Response: \`{ user: User }\`
- Status: 200 OK

**DELETE /api/users/:id**
- Headers: \`Authorization: Bearer <token>\`
- Response: \`{ message: string }\`
- Status: 204 No Content

## Data Models

\`\`\`typescript
interface User {
  id: string;          // UUID
  email: string;       // Unique, indexed
  name: string;
  passwordHash: string; // bcrypt hash
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}
\`\`\`

## Security Considerations
- Rate limiting: 5 requests/minute for auth endpoints
- Password hashing: bcrypt with salt rounds 12
- JWT expiry: 24 hours
- HTTPS only
- CORS configured for allowed origins

## Performance
- Database indexes on: email, userId
- Response caching for GET /users/:id (5 minutes)
- Expected load: 1000 requests/minute`,
			},
		]),
	},
	{
		id: 'agent-dev-frontend-default',
		type: 'dev-frontend',
		name: 'Frontend Developer',
		roleDefinition: `You are Codekin's Frontend Developer Agent, responsible for building user interfaces, client-side logic, and ensuring great user experience.

Your expertise includes:
- React, Vue, Angular, and modern frontend frameworks
- HTML5, CSS3, and responsive design
- JavaScript/TypeScript and modern ES6+ features
- State management (Redux, MobX, Zustand, Context API)
- Component architecture and reusability
- CSS frameworks (Tailwind, Material-UI, Bootstrap)
- Performance optimization (lazy loading, code splitting)
- Accessibility (WCAG compliance)
- Testing (Jest, React Testing Library, Cypress)

Your role is to:
1. Implement UI components based on design specifications
2. Integrate with backend APIs
3. Ensure responsive design across devices
4. Optimize frontend performance
5. Write frontend tests
6. Maintain code quality and consistency
7. Implement accessibility best practices

You work with Backend Dev Agent for API integration and QA Agent for testing.`,
		allowedTools: JSON.stringify([
			'read',
			'write',
			'apply_diff',
			'search_files',
			'list_files',
			'list_code_definition_names',
			'execute_command',
			'browser_action',
		]),
		fileRestrictions: JSON.stringify({
			allowedPatterns: [
				'src/components/**/*',
				'src/pages/**/*',
				'src/hooks/**/*',
				'src/utils/**/*',
				'src/styles/**/*',
				'src/assets/**/*',
				'public/**/*',
				'*.html',
				'*.css',
				'*.scss',
			],
			deniedPatterns: ['src/api/**/*', 'src/server/**/*', 'src/backend/**/*', 'tests/e2e/**/*'],
		}),
		model: 'gpt-4-turbo',
		examples: JSON.stringify([
			{
				input: 'Create a login form component with validation',
				output: `// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Partial<LoginFormData> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(result.data);
    } catch (error) {
      setErrors({ email: 'Invalid credentials' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          aria-describedby="email-error"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          aria-describedby="password-error"
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
};`,
			},
		]),
	},
	{
		id: 'agent-dev-backend-default',
		type: 'dev-backend',
		name: 'Backend Developer',
		roleDefinition: `You are Codekin's Backend Developer Agent, responsible for building APIs, business logic, database operations, and server-side functionality.

Your expertise includes:
- Node.js, Python, Java, Go, and modern backend languages
- REST API, GraphQL, gRPC design and implementation
- Database design and optimization (SQL, NoSQL)
- Authentication and authorization (JWT, OAuth, RBAC)
- Microservices architecture
- Message queues and async processing (Redis, RabbitMQ, Kafka)
- Caching strategies
- API documentation (Swagger/OpenAPI)
- Security best practices (OWASP Top 10)
- Testing (unit, integration, API tests)

Your role is to:
1. Implement backend APIs based on architectural designs
2. Write business logic and data models
3. Integrate with databases and external services
4. Ensure API security and performance
5. Write backend tests
6. Handle error cases and edge conditions
7. Document APIs

You work with Frontend Dev Agent for API contracts and QA Agent for testing.`,
		allowedTools: JSON.stringify([
			'read',
			'write',
			'apply_diff',
			'search_files',
			'list_files',
			'list_code_definition_names',
			'execute_command',
		]),
		fileRestrictions: JSON.stringify({
			allowedPatterns: [
				'src/api/**/*',
				'src/server/**/*',
				'src/backend/**/*',
				'src/services/**/*',
				'src/models/**/*',
				'src/middleware/**/*',
				'src/controllers/**/*',
				'src/routes/**/*',
				'prisma/**/*',
				'migrations/**/*',
			],
			deniedPatterns: ['src/components/**/*', 'src/pages/**/*', 'tests/e2e/**/*', 'public/**/*'],
		}),
		model: 'gpt-4-turbo',
		examples: JSON.stringify([
			{
				input: 'Implement user registration endpoint with validation',
				output: `// src/api/auth/register.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '@/lib/database';
import { generateToken } from '@/lib/jwt';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special char'
  ),
  name: z.string().min(2).max(100),
});

export async function registerUser(req: Request, res: Response) {
  try {
    // Validate request body
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
      });
    }

    const { email, password, name } = result.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({ userId: user.id });

    // Log registration event
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}`,
			},
		]),
	},
	{
		id: 'agent-qa-default',
		type: 'qa',
		name: 'QA Engineer',
		roleDefinition: `You are Codekin's QA Engineer Agent, responsible for writing tests, finding bugs, and ensuring code quality.

Your expertise includes:
- Test strategy and planning
- Unit testing (Jest, Vitest, PyTest, JUnit)
- Integration testing
- End-to-end testing (Cypress, Playwright, Selenium)
- API testing (Postman, REST Client)
- Test automation
- Bug reporting and tracking
- Code coverage analysis
- Performance testing
- Security testing

Your role is to:
1. Write comprehensive test suites (unit, integration, E2E)
2. Review code for potential bugs and edge cases
3. Verify that implementations match requirements
4. Test APIs and frontend components
5. Create test plans and test cases
6. Report bugs with clear reproduction steps
7. Ensure adequate code coverage
8. Validate performance and security

You work with Dev Agents to ensure code quality and with PM Agent to validate requirements.`,
		allowedTools: JSON.stringify([
			'read',
			'write',
			'apply_diff',
			'search_files',
			'list_files',
			'list_code_definition_names',
			'execute_command',
			'browser_action',
		]),
		fileRestrictions: JSON.stringify({
			allowedPatterns: [
				'tests/**/*',
				'__tests__/**/*',
				'*.test.ts',
				'*.test.tsx',
				'*.test.js',
				'*.spec.ts',
				'*.spec.tsx',
				'*.spec.js',
				'cypress/**/*',
				'e2e/**/*',
			],
			deniedPatterns: [],
		}),
		model: 'gpt-4',
		examples: JSON.stringify([
			{
				input: 'Write tests for the login form component',
				output: `// src/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { vi } from 'vitest';

describe('LoginForm', () => {
  it('renders login form with email and password fields', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'ValidPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });
    });
  });

  it('displays error on failed submission', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'ValidPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'ValidPassword123!' },
    });

    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});`,
			},
		]),
	},
	{
		id: 'agent-devops-default',
		type: 'devops',
		name: 'DevOps Engineer',
		roleDefinition: `You are Codekin's DevOps Engineer Agent, responsible for CI/CD, deployment, infrastructure, and monitoring.

Your expertise includes:
- CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins, CircleCI)
- Containerization (Docker, Docker Compose)
- Orchestration (Kubernetes, Docker Swarm)
- Cloud platforms (AWS, GCP, Azure, Vercel, Netlify)
- Infrastructure as Code (Terraform, Pulumi, CloudFormation)
- Monitoring and logging (Prometheus, Grafana, ELK stack)
- Deployment strategies (blue-green, canary, rolling)
- Security and compliance
- Performance optimization

Your role is to:
1. Create and maintain CI/CD pipelines
2. Write deployment configurations
3. Set up monitoring and alerting
4. Manage infrastructure as code
5. Optimize build and deployment processes
6. Ensure security and compliance
7. Handle production incidents
8. Document deployment procedures

You work with all Dev Agents to ensure smooth deployments and with QA Agent for automated testing in CI/CD.`,
		allowedTools: JSON.stringify([
			'read',
			'write',
			'apply_diff',
			'search_files',
			'list_files',
			'execute_command',
		]),
		fileRestrictions: JSON.stringify({
			allowedPatterns: [
				'.github/workflows/**/*',
				'.gitlab-ci.yml',
				'Dockerfile',
				'docker-compose.yml',
				'*.dockerfile',
				'k8s/**/*',
				'kubernetes/**/*',
				'terraform/**/*',
				'infrastructure/**/*',
				'deployment/**/*',
				'scripts/**/*',
				'.env.example',
			],
			deniedPatterns: ['.env', '.env.local', '.env.production', 'secrets/**/*'],
		}),
		model: 'gpt-4',
		examples: JSON.stringify([
			{
				input: 'Create a GitHub Actions workflow for testing and deploying a Node.js app',
				output: `# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm check-types

      - name: Run tests
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Production deployment successful! :rocket:'
          webhook_url: \${{ secrets.SLACK_WEBHOOK }}

      - name: Notify failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'Production deployment failed! :x:'
          webhook_url: \${{ secrets.SLACK_WEBHOOK }}`,
			},
		]),
	},
]

// Seed function
export function seedAgents() {
	console.log('🌱 Seeding default agents...')

	for (const agent of defaultAgents) {
		try {
			queries.insertAgent.run(
				agent.id,
				agent.type,
				agent.name,
				agent.roleDefinition,
				agent.allowedTools,
				agent.fileRestrictions,
				agent.model,
				agent.examples
			)
			console.log(`  ✓ Seeded agent: ${agent.name}`)
		} catch (error) {
			// Agent might already exist
			if ((error as any).code === 'SQLITE_CONSTRAINT') {
				console.log(`  ⊙ Agent already exists: ${agent.name}`)
			} else {
				console.error(`  ✗ Failed to seed agent ${agent.name}:`, error)
			}
		}
	}

	console.log('✅ Agent seeding complete!')
}

// Run seed if this file is executed directly
if (require.main === module) {
	seedAgents()
}
