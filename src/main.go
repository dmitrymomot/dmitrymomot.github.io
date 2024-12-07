package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/dmitrymomot/templatex"
	"gopkg.in/yaml.v3"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Read config file
	configData, err := os.ReadFile("config.yml")
	if err != nil {
		panic(fmt.Errorf("error reading config file: %w", err))
	}

	// Parse config
	var cfg Config
	if err := yaml.Unmarshal(configData, &cfg); err != nil {
		panic(fmt.Errorf("error parsing config: %w", err))
	}

	// Initialize template engine
	tmpl, err := templatex.New("templates", nil)
	if err != nil {
		panic(fmt.Errorf("error initializing template engine: %w", err))
	}

	// Generate index.html
	indexHTML, err := tmpl.RenderString(ctx, "main.html", cfg, "layout.html")
	if err != nil {
		panic(fmt.Errorf("error rendering index.html: %w", err))
	}
	if err := os.WriteFile(filepath.Join("build", "index.html"), []byte(indexHTML), 0644); err != nil {
		panic(fmt.Errorf("error writing index.html: %w", err))
	}

	// Generate 404.html
	notFoundHTML, err := tmpl.RenderString(ctx, "404.html", cfg, "layout.html")
	if err != nil {
		panic(fmt.Errorf("error rendering 404.html: %w", err))
	}
	if err := os.WriteFile(filepath.Join("build", "404.html"), []byte(notFoundHTML), 0644); err != nil {
		panic(fmt.Errorf("error writing 404.html: %w", err))
	}

	fmt.Println("Static site generated successfully!")
}
