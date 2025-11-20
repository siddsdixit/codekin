export { getMcpServerTools } from "./mcp_server";
export { convertOpenAIToolToAnthropic, convertOpenAIToolsToAnthropic } from "./converters";
export declare const nativeTools: ({
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                files: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                        properties: {
                            path: {
                                type: string;
                                description: string;
                            };
                            line_ranges: {
                                type: string[];
                                description: string;
                                items: {
                                    type: string;
                                    pattern: string;
                                };
                            };
                        };
                        required: string[];
                        additionalProperties: boolean;
                    };
                    minItems: number;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                path: {
                    type: string;
                    description: string;
                };
                diff: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                question: {
                    type: string;
                    description: string;
                };
                follow_up: {
                    type: string;
                    description: string;
                    items: {
                        type: string;
                        properties: {
                            text: {
                                type: string;
                                description: string;
                            };
                            mode: {
                                type: string[];
                                description: string;
                            };
                        };
                        required: string[];
                        additionalProperties: boolean;
                    };
                    minItems: number;
                    maxItems: number;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                result: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                action: {
                    type: string;
                    description: string;
                    enum: string[];
                };
                url: {
                    type: string[];
                    description: string;
                };
                coordinate: {
                    type: string[];
                    description: string;
                    properties: {
                        x: {
                            type: string;
                            description: string;
                        };
                        y: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
                size: {
                    type: string[];
                    description: string;
                    properties: {
                        width: {
                            type: string;
                            description: string;
                        };
                        height: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
                text: {
                    type: string[];
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                query: {
                    type: string;
                    description: string;
                };
                path: {
                    type: string[];
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                command: {
                    type: string;
                    description: string;
                };
                cwd: {
                    type: string[];
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                    enum: string[];
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                path: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                mode: {
                    type: string;
                    description: string;
                };
                message: {
                    type: string;
                    description: string;
                };
                todos: {
                    type: string[];
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                command: {
                    type: string;
                    description: string;
                };
                args: {
                    type: string[];
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                mode_slug: {
                    type: string;
                    description: string;
                };
                reason: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: true;
        parameters: {
            type: string;
            properties: {
                todos: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
})[];
//# sourceMappingURL=index.d.ts.map