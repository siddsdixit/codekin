declare const _default: {
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
                line: {
                    type: string;
                    description: string;
                    minimum: number;
                };
                content: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
};
export default _default;
//# sourceMappingURL=insert_content.d.ts.map