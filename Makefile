# Makefile for Kraken Applications Documentation

# Variables
UV := uv
MKDOCS := uv run mkdocs
PORT := 8000
SITE_DIR := site
DOCS_DIR := docs

# Colors for output
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RESET := \033[0m

.PHONY: help install install-dev serve build clean validate lint deploy status upgrade

# Default target
help: ## Show this help message
	@echo "$(BLUE)Kraken Applications Documentation$(RESET)"
	@echo "$(YELLOW)Available commands:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and Setup
install: ## Install production dependencies
	@echo "$(BLUE)Installing production dependencies...$(RESET)"
	$(UV) sync --no-dev

install-dev: ## Install development dependencies
	@echo "$(BLUE)Installing development dependencies...$(RESET)"
	$(UV) sync --all-extras

sync: ## Sync dependencies
	@echo "$(BLUE)Syncing dependencies...$(RESET)"
	$(UV) sync

# Development
serve: ## Start development server with live reload
	@echo "$(BLUE)Starting development server on http://localhost:$(PORT)$(RESET)"
	$(MKDOCS) serve --dev-addr=0.0.0.0:$(PORT)

# Building and Deployment
build: ## Build documentation site
	@echo "$(BLUE)Building documentation site...$(RESET)"
	$(MKDOCS) build --clean
	@echo "$(GREEN)Documentation built successfully in $(SITE_DIR)/$(RESET)"

build-strict: ## Build with strict mode (warnings as errors)
	@echo "$(BLUE)Building documentation site (strict mode)...$(RESET)"
	$(MKDOCS) build --clean --strict

# Validation and Quality
lint: ## Run linting checks on documentation
	@echo "$(BLUE)Running linting checks...$(RESET)"
	$(UV) run yamllint $(DOCS_DIR)
	$(UV) run yamllint mkdocs.yml
	@echo "$(GREEN)Linting completed$(RESET)"

check: ## Run all quality checks
	@echo "$(BLUE)Running all quality checks...$(RESET)"
	@$(MAKE) lint
	@$(MAKE) build-strict
	@echo "$(GREEN)All checks passed$(RESET)"

# Testing
test-links: ## Test all links in documentation
	@echo "$(BLUE)Testing documentation links...$(RESET)"
	@$(MAKE) build > /dev/null
	@if command -v htmlproofer >/dev/null 2>&1; then \
		htmlproofer $(SITE_DIR) --check-html --check-external-hash --allow-hash-href; \
	else \
		echo "$(YELLOW)htmlproofer not installed, skipping link checks$(RESET)"; \
		echo "$(YELLOW)Install with: gem install html-proofer$(RESET)"; \
	fi

test-serve: ## Test that serve command works
	@echo "$(BLUE)Testing serve command...$(RESET)"
	@timeout 10s $(MKDOCS) serve --dev-addr=127.0.0.1:8001 > /dev/null 2>&1 && \
		echo "$(GREEN)Serve test passed$(RESET)" || \
		echo "$(RED)Serve test failed$(RESET)"

# Deployment
deploy: ## Deploy to GitHub Pages (requires push access)
	@echo "$(BLUE)Deploying to GitHub Pages...$(RESET)"
	@echo "$(YELLOW)Warning: This will push to gh-pages branch$(RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(MKDOCS) gh-deploy --clean; \
		echo "$(GREEN)Deployment completed$(RESET)"; \
	else \
		echo "$(YELLOW)Deployment cancelled$(RESET)"; \
	fi

deploy-force: ## Force deploy to GitHub Pages
	@echo "$(BLUE)Force deploying to GitHub Pages...$(RESET)"
	$(MKDOCS) gh-deploy --clean --force

# Maintenance
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	rm -rf $(SITE_DIR)
	rm -rf .mkdocs_cache
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)Cleanup completed$(RESET)"

status: ## Show documentation status and info
	@echo "$(BLUE)Documentation Status$(RESET)"
	@echo "$(YELLOW)UV version:$(RESET) $$($(UV) --version)"
	@echo "$(YELLOW)Python version:$(RESET) $$($(PYTHON) --version)"
	@echo "$(YELLOW)MkDocs version:$(RESET) $$($(MKDOCS) --version)"
	@echo "$(YELLOW)Documentation files:$(RESET) $$(find $(DOCS_DIR) -name "*.md" | wc -l)"
	@echo "$(YELLOW)Configuration:$(RESET) mkdocs.yml"
	@echo "$(YELLOW)Build directory:$(RESET) $(SITE_DIR)"
	@echo "$(YELLOW)Last build:$(RESET)"
	@if [ -d "$(SITE_DIR)" ]; then \
		stat -c "  %y" $(SITE_DIR) 2>/dev/null || stat -f "  %Sm" $(SITE_DIR) 2>/dev/null || echo "  Unknown"; \
	else \
		echo "  Not built yet"; \
	fi

upgrade: ## Upgrade dependencies
	@echo "$(BLUE)Upgrading dependencies...$(RESET)"
	$(UV) sync --upgrade
	@echo "$(GREEN)Dependencies upgraded$(RESET)"

# Backup and Restore
backup: ## Create backup of documentation
	@echo "$(BLUE)Creating documentation backup...$(RESET)"
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	tar -czf "docs_backup_$$TIMESTAMP.tar.gz" $(DOCS_DIR) mkdocs.yml requirements.txt; \
	echo "$(GREEN)Backup created: docs_backup_$$TIMESTAMP.tar.gz$(RESET)"

restore: ## Restore from backup (specify BACKUP_FILE=filename)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: Please specify BACKUP_FILE=filename$(RESET)"; \
		echo "$(YELLOW)Usage: make restore BACKUP_FILE=docs_backup_20240101_120000.tar.gz$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Restoring from backup: $(BACKUP_FILE)$(RESET)"
	@echo "$(YELLOW)Warning: This will overwrite current documentation$(RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		tar -xzf $(BACKUP_FILE); \
		echo "$(GREEN)Restore completed$(RESET)"; \
	else \
		echo "$(YELLOW)Restore cancelled$(RESET)"; \
	fi

# Content Management
new-page: ## Create new documentation page (usage: make new-page PAGE=path/to/page.md)
	@if [ -z "$(PAGE)" ]; then \
		echo "$(RED)Error: Please specify PAGE=path/to/page.md$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Creating new page: $(DOCS_DIR)/$(PAGE)$(RESET)"
	@mkdir -p "$$(dirname $(DOCS_DIR)/$(PAGE))"
	@echo "# $$(basename $(PAGE) .md | sed 's/-/ /g' | sed 's/\b\w/\u&/g')" > $(DOCS_DIR)/$(PAGE)
	@echo "" >> $(DOCS_DIR)/$(PAGE)
	@echo "Add your content here." >> $(DOCS_DIR)/$(PAGE)
	@echo "$(GREEN)Page created: $(DOCS_DIR)/$(PAGE)$(RESET)"

list-pages: ## List all documentation pages
	@echo "$(BLUE)Documentation Pages:$(RESET)"
	@find $(DOCS_DIR) -name "*.md" | sort | sed 's|^$(DOCS_DIR)/||' | sed 's|^|  |'

# Development shortcuts
dev: sync serve ## Quick development setup (sync + serve)

quick-build: ## Quick build without cleaning
	@echo "$(BLUE)Quick building documentation...$(RESET)"
	$(MKDOCS) build

rebuild: clean build ## Clean and rebuild documentation

watch: ## Watch for changes and rebuild (alternative to serve)
	@echo "$(BLUE)Watching for changes...$(RESET)"
	@while true; do \
		$(MKDOCS) build --quiet; \
		echo "$(GREEN)$$(date): Built$(RESET)"; \
		sleep 2; \
	done

# Docker support (if needed)
docker-build: ## Build documentation using Docker
	@echo "$(BLUE)Building documentation with Docker...$(RESET)"
	docker run --rm -v $(PWD):/docs squidfunk/mkdocs-material:latest build

docker-serve: ## Serve documentation using Docker
	@echo "$(BLUE)Serving documentation with Docker on http://localhost:$(PORT)$(RESET)"
	docker run --rm -it -p $(PORT):8000 -v $(PWD):/docs squidfunk/mkdocs-material:latest

# CI/CD helpers
ci-install: ## Install dependencies for CI environment
	@echo "$(BLUE)Installing CI dependencies...$(RESET)"
	$(UV) sync --no-dev

ci-build: ## Build for CI environment
	@echo "$(BLUE)Building for CI...$(RESET)"
	$(MKDOCS) build --clean --strict --quiet

ci-test: ## Run CI tests
	@echo "$(BLUE)Running CI tests...$(RESET)"
	@$(MAKE) ci-install
	@$(MAKE) ci-build
	@$(MAKE) validate
	@$(MAKE) test