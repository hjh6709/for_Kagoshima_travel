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
	return requestPath
}

func redactRequestDiagnostic(requestPath, diagnostic string) string {
	if isShareRoute(requestPath) {
		return "[redacted: public share route]"
	}
	return diagnostic
}
