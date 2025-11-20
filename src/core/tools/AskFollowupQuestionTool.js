"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askFollowupQuestionTool = exports.AskFollowupQuestionTool = void 0;
const responses_1 = require("../prompts/responses");
const xml_1 = require("../../utils/xml");
const BaseTool_1 = require("./BaseTool");
class AskFollowupQuestionTool extends BaseTool_1.BaseTool {
    name = "ask_followup_question";
    parseLegacy(params) {
        const question = params.question || "";
        const follow_up_xml = params.follow_up;
        const suggestions = [];
        if (follow_up_xml) {
            try {
                const parsedSuggest = (0, xml_1.parseXml)(follow_up_xml, ["suggest"]);
                const rawSuggestions = Array.isArray(parsedSuggest?.suggest)
                    ? parsedSuggest.suggest
                    : [parsedSuggest?.suggest].filter((sug) => sug !== undefined);
                // Transform parsed XML to our Suggest format
                for (const sug of rawSuggestions) {
                    if (typeof sug === "string") {
                        // Simple string suggestion (no mode attribute)
                        suggestions.push({ text: sug });
                    }
                    else {
                        // XML object with text content and optional mode attribute
                        const suggestion = { text: sug["#text"] };
                        if (sug["@_mode"]) {
                            suggestion.mode = sug["@_mode"];
                        }
                        suggestions.push(suggestion);
                    }
                }
            }
            catch (error) {
                throw new Error(`Failed to parse follow_up XML: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return {
            question,
            follow_up: suggestions,
        };
    }
    async execute(params, task, callbacks) {
        const { question, follow_up } = params;
        const { handleError, pushToolResult } = callbacks;
        try {
            if (!question) {
                task.consecutiveMistakeCount++;
                task.recordToolError("ask_followup_question");
                pushToolResult(await task.sayAndCreateMissingParamError("ask_followup_question", "question"));
                return;
            }
            // Transform follow_up suggestions to the format expected by task.ask
            const follow_up_json = {
                question,
                suggest: follow_up.map((s) => ({ answer: s.text, mode: s.mode })),
            };
            task.consecutiveMistakeCount = 0;
            const { text, images } = await task.ask("followup", JSON.stringify(follow_up_json), false);
            await task.say("user_feedback", text ?? "", images);
            pushToolResult(responses_1.formatResponse.toolResult(`<answer>\n${text}\n</answer>`, images));
        }
        catch (error) {
            await handleError("asking question", error);
        }
    }
    async handlePartial(task, block) {
        const question = block.params.question;
        await task
            .ask("followup", this.removeClosingTag("question", question, block.partial), block.partial)
            .catch(() => { });
    }
}
exports.AskFollowupQuestionTool = AskFollowupQuestionTool;
exports.askFollowupQuestionTool = new AskFollowupQuestionTool();
//# sourceMappingURL=AskFollowupQuestionTool.js.map