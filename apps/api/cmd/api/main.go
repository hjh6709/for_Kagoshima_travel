package main

import (
	"log"
	"net/http"
	"os"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/server"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	app := server.New()

	log.Printf("api server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, app.Routes()); err != nil {
		log.Fatal(err)
	}
}
