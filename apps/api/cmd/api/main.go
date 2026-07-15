package main

import (
	"log"
	"net/http"
	"os"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/server"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found, using system environment variables")
	}

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
