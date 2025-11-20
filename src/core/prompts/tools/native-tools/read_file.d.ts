export declare const read_file: {
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
};
//# sourceMappingURL=read_file.d.ts.map