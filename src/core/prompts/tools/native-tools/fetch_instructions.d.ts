declare const _default: {
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
};
export default _default;
//# sourceMappingURL=fetch_instructions.d.ts.map