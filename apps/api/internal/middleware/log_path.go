package middleware

import (
	"path"
	"strings"
)

func isShareRoute(requestPath string) bool {
	if strings.HasPrefix(path.Clean(requestPath), "/api/share/") {
		return true
	}
	// Classify conservatively before ServeMux removes dot-segments: cleaning
	// /api/share/<token>/../../readyz must not make the token loggable.
	previous := ""
	for _, segment := range strings.FieldsFunc(requestPath, func(r rune) bool { return r == '/' }) {
		if segment == "." {
			continue
		}
		if previous == "api" && segment == "share" {
			return true
		}
		previous = segment
	}
	return false
}

// redactRequestPath keeps the route useful for diagnostics without recording
// capability tokens carried in the public share URL.
func redactRequestPath(requestPath string) string {
	if isShareRoute(requestPath) {
		return "/api/share/{token}"
	}
	return stripLineBreaks(requestPath)
}

// stripLineBreaks removes CR/LF from request-controlled values before they are
// logged, so a crafted URL or method cannot forge extra log lines in sinks that
// do not escape them.
func stripLineBreaks(value string) string {
	value = strings.ReplaceAll(value, "\n", "")
	return strings.ReplaceAll(value, "\r", "")
}

func redactRequestDiagnostic(requestPath, diagnostic string) string {
	if isShareRoute(requestPath) {
		return "[redacted: public share route]"
	}
	return diagnostic
}
