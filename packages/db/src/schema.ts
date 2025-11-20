import Database from 'better-sqlite3'
import type { Database as DatabaseType, Statement } from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'

// Re-export Statement type for external use
export type { Statement } from 'better-sqlite3'

// Database location: ~/.codekin/codekin.db
const dbDir = path.join(os.homedir(), '.codekin')
if (!fs.existsSync(dbDir)) {
	fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'codekin.db')
export const db: DatabaseType = new Database(dbPath)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
  -- Agent configurations
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role_definition TEXT NOT NULL,
    allowed_tools TEXT NOT NULL,
    file_restrictions TEXT,
    model TEXT NOT NULL,
    examples TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Prompt templates
  CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'custom',
    config TEXT NOT NULL,
    is_builtin INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Projects
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    active_template_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_template_id) REFERENCES prompt_templates(id)
  );

  -- Tasks
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    assigned_agent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    dependencies TEXT,
    files_affected TEXT,
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
  );

  -- Messages (conversation history)
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  -- Settings
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Feedback for agent learning
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(assigned_agent_id);
  CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
  CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_id);
  CREATE INDEX IF NOT EXISTS idx_templates_category ON prompt_templates(category);
  CREATE INDEX IF NOT EXISTS idx_templates_builtin ON prompt_templates(is_builtin);
  CREATE INDEX IF NOT EXISTS idx_feedback_agent ON feedback(agent_id);
  CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
`)

console.log('✅ Codekin database initialized:', dbPath)

// Export helper functions
export interface AgentRow {
	id: string
	type: string
	name: string
	role_definition: string
	allowed_tools: string
	file_restrictions: string | null
	model: string
	examples: string | null
	created_at: string
	updated_at: string
}

export interface TaskRow {
	id: string
	project_id: string
	title: string
	description: string
	type: string
	assigned_agent_id: string | null
	status: string
	dependencies: string | null
	files_affected: string | null
	progress: number
	created_at: string
	started_at: string | null
	completed_at: string | null
}

export interface MessageRow {
	id: string
	task_id: string
	agent_id: string | null
	role: string
	content: string
	created_at: string
}

export interface PromptTemplateRow {
	id: string
	name: string
	description: string | null
	category: string
	config: string
	is_builtin: number
	downloads: number
	rating: number
	created_at: string
}

// Helper functions for common queries - explicitly typed to avoid TS4023 error
export interface DatabaseQueries {
	// Agents
	getAgent: Statement<[string]>
	getAgentByType: Statement<[string]>
	getAllAgents: Statement<[]>
	insertAgent: Statement<[string, string, string, string, string, string | null, string, string | null]>
	updateAgent: Statement<[string, string, string | null, string, string | null, string]>
	// Tasks
	getTask: Statement<[string]>
	getTasksByProject: Statement<[string]>
	getTasksByStatus: Statement<[string]>
	insertTask: Statement<[string, string, string, string, string, string, string, string | null, string | null]>
	updateTaskStatus: Statement<[string, string | null, string]>
	updateTaskProgress: Statement<[number, string]>
	completeTask: Statement<[string, string]>
	// Messages
	getMessagesByTask: Statement<[string]>
	insertMessage: Statement<[string, string, string, string, string]>
	// Templates
	getTemplate: Statement<[string]>
	getAllTemplates: Statement<[]>
	getTemplatesByCategory: Statement<[string]>
	insertTemplate: Statement<[string, string, string | null, string, string, number, number, number]>
	// Settings
	getSetting: Statement<[string]>
	setSetting: Statement<[string, string]>
	// Feedback
	insertFeedback: Statement<[string, string, string, number, string | null]>
	getAgentFeedback: Statement<[string]>
	getAgentAverageRating: Statement<[string]>
}

export const queries: DatabaseQueries = {
	// Agents
	getAgent: db.prepare<[string]>('SELECT * FROM agents WHERE id = ?'),
	getAgentByType: db.prepare<[string]>('SELECT * FROM agents WHERE type = ?'),
	getAllAgents: db.prepare('SELECT * FROM agents ORDER BY name'),
	insertAgent: db.prepare(
		`INSERT INTO agents (id, type, name, role_definition, allowed_tools, file_restrictions, model, examples)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	),
	updateAgent: db.prepare(
		`UPDATE agents SET role_definition = ?, allowed_tools = ?, file_restrictions = ?, model = ?, examples = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
	),

	// Tasks
	getTask: db.prepare<[string]>('SELECT * FROM tasks WHERE id = ?'),
	getTasksByProject: db.prepare<[string]>('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC'),
	getTasksByStatus: db.prepare<[string]>('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC'),
	insertTask: db.prepare(
		`INSERT INTO tasks (id, project_id, title, description, type, assigned_agent_id, status, dependencies, files_affected)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	),
	updateTaskStatus: db.prepare<[string, string | null, string]>(
		'UPDATE tasks SET status = ?, started_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
	),
	updateTaskProgress: db.prepare<[number, string]>('UPDATE tasks SET progress = ? WHERE id = ?'),
	completeTask: db.prepare<[string, string]>(
		'UPDATE tasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?'
	),

	// Messages
	getMessagesByTask: db.prepare<[string]>(
		'SELECT * FROM messages WHERE task_id = ? ORDER BY created_at ASC'
	),
	insertMessage: db.prepare(
		`INSERT INTO messages (id, task_id, agent_id, role, content)
     VALUES (?, ?, ?, ?, ?)`
	),

	// Templates
	getTemplate: db.prepare<[string]>('SELECT * FROM prompt_templates WHERE id = ?'),
	getAllTemplates: db.prepare('SELECT * FROM prompt_templates ORDER BY rating DESC, downloads DESC'),
	getTemplatesByCategory: db.prepare<[string]>(
		'SELECT * FROM prompt_templates WHERE category = ? ORDER BY rating DESC'
	),
	insertTemplate: db.prepare(
		`INSERT INTO prompt_templates (id, name, description, category, config, is_builtin, downloads, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	),

	// Settings
	getSetting: db.prepare<[string]>('SELECT value FROM settings WHERE key = ?'),
	setSetting: db.prepare(
		`INSERT OR REPLACE INTO settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`
	),

	// Feedback
	insertFeedback: db.prepare(
		`INSERT INTO feedback (id, task_id, agent_id, rating, feedback_text)
     VALUES (?, ?, ?, ?, ?)`
	),
	getAgentFeedback: db.prepare<[string]>(
		'SELECT * FROM feedback WHERE agent_id = ? ORDER BY created_at DESC'
	),
	getAgentAverageRating: db.prepare<[string]>(
		'SELECT AVG(rating) as avg_rating FROM feedback WHERE agent_id = ?'
	),
}

// Export database instance
export default db
