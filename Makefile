.PHONY: help build clean dev preview deploy install

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: clean ## Build production site into /docs
	@echo "Building production site..."
	npm run build
	@echo "Build complete! Files are in /docs directory"

clean: ## Clean build directory
	@echo "Cleaning /docs directory..."
	rm -rf docs
	@echo "Clean complete!"

preview: build ## Build and preview production site
	npm run preview

deploy: build ## Build and prepare for deployment
	@echo "Site built into /docs directory"
	@echo "Next steps:"
	@echo "1. Review the built files in /docs"
	@echo "2. Commit changes: git add docs && git commit -m 'Deploy site'"
	@echo "3. Push to GitHub: git push origin master"
	@echo "4. Configure GitHub Pages to serve from /docs folder if not already done"

check: ## Check if build works correctly
	@echo "Checking build configuration..."
	@if [ -f "astro.config.mjs" ]; then \
		grep -q "outDir.*docs" astro.config.mjs && echo "✓ Astro configured to build into /docs" || echo "✗ Astro not configured for /docs"; \
	fi
	@command -v node >/dev/null 2>&1 && echo "✓ Node.js installed" || echo "✗ Node.js not found"
	@[ -f "package.json" ] && echo "✓ package.json exists" || echo "✗ package.json not found"
	@[ -d "node_modules" ] && echo "✓ Dependencies installed" || echo "✗ Dependencies not installed (run: make install)"
