"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModesSection = getModesSection;
const modes_1 = require("../../../shared/modes");
const globalContext_1 = require("../../../utils/globalContext");
async function getModesSection(context) {
    // Make sure path gets created
    await (0, globalContext_1.ensureSettingsDirectoryExists)(context);
    // Get all modes with their overrides from extension state
    const allModes = await (0, modes_1.getAllModesWithPrompts)(context);
    let modesContent = `====

MODES

- These are the currently available modes:
${allModes
        .map((mode) => {
        let description;
        if (mode.whenToUse && mode.whenToUse.trim() !== "") {
            // Use whenToUse as the primary description, indenting subsequent lines for readability
            description = mode.whenToUse.replace(/\n/g, "\n    ");
        }
        else {
            // Fallback to the first sentence of roleDefinition if whenToUse is not available
            description = mode.roleDefinition.split(".")[0];
        }
        return `  * "${mode.name}" mode (${mode.slug}) - ${description}`;
    })
        .join("\n")}`;
    modesContent += `
If the user asks you to create or edit a new mode for this project, you should read the instructions by using the fetch_instructions tool, like this:
<fetch_instructions>
<task>create_mode</task>
</fetch_instructions>
`;
    return modesContent;
}
//# sourceMappingURL=modes.js.map