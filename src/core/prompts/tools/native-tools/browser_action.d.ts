declare const _default: {
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
};
export default _default;
//# sourceMappingURL=browser_action.d.ts.map