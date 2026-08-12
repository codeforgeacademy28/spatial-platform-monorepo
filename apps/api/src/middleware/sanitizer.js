const SAFE_PROMPT_REGEX = /[`<>]|<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|option)[^>]*>/gi;
export function sanitizeRequestBody(req, _res, next) {
    function sanitize(value) {
        if (typeof value === 'string') {
            return value.replace(SAFE_PROMPT_REGEX, '').trim();
        }
        if (Array.isArray(value)) {
            return value.map(sanitize);
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitize(entry)]));
        }
        return value;
    }
    req.body = sanitize(req.body);
    next();
}
//# sourceMappingURL=sanitizer.js.map