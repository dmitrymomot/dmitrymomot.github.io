.PHONY: build
build:
	echo "Building the project..."
	tailwindcss \
		-c ./src/assets/tailwind.config.js \
		-i ./src/assets/tailwind.css \
		-o ./public/assets/styles.css
	go run ./src/
	echo "Done!"

.PHONY: deploy
deploy: build
	./deploy.sh
