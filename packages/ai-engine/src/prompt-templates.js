export function buildSpatialPrompt(userInstruction) {
    return `Translate the user's instruction into a structured spatial command JSON.

User instruction:
${userInstruction}

Respond only with valid JSON matching one of the following shapes:
- {"wallId":"<id>","deltaX":<number>,"deltaY":<number>}
- {"roomId":"<id>","percentage":<number>}
- {"targetId":"<id>","colorHex":"#RRGGBB"}
- {"queryType":"clearance","objectId":"<id>"}
- {"queryType":"area","objectId":"<id>"}
`;
}
//# sourceMappingURL=prompt-templates.js.map