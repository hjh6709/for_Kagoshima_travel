package middleware

import "strings"

// redactRequestPath keeps the route useful for diagnostics without recording
// capability tokens carried in the public share URL.
func redactRequestPath(path string) string {
	if strings.HasPrefix(path, "/api/share/") {
		return "/api/share/{token}"
	}
	return path
}
