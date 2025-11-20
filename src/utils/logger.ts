import * as vscode from "vscode"

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export class Logger {
	private static instance: Logger
	private outputChannel: vscode.OutputChannel
	private level: LogLevel

	private constructor() {
		this.outputChannel = vscode.window.createOutputChannel("Roo Code Debug")
		this.level = process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO
	}

	static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger()
		}
		return Logger.instance
	}

	private log(level: LogLevel, message: string, data?: any): void {
		if (level < this.level) return

		const timestamp = new Date().toISOString()
		const levelStr = LogLevel[level]
		const dataStr = data ? ` | ${JSON.stringify(data, null, 2)}` : ""

		this.outputChannel.appendLine(`[${timestamp}] [${levelStr}] ${message}${dataStr}`)
	}

	debug(message: string, data?: any): void {
		this.log(LogLevel.DEBUG, message, data)
	}

	info(message: string, data?: any): void {
		this.log(LogLevel.INFO, message, data)
	}

	warn(message: string, data?: any): void {
		this.log(LogLevel.WARN, message, data)
	}

	error(message: string, error?: any): void {
		const errorData =
			error instanceof Error ? { message: error.message, stack: error.stack } : error
		this.log(LogLevel.ERROR, message, errorData)
	}

	show(): void {
		this.outputChannel.show()
	}

	setLevel(level: LogLevel): void {
		this.level = level
	}

	dispose(): void {
		this.outputChannel.dispose()
	}
}

// Singleton export
export const logger = Logger.getInstance()
