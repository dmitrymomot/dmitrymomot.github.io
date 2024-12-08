.PHONY: build
build:
	echo "Building the project..."
	tailwindcss \
		-c ./assets/tailwind.config.js \
		-i ./assets/tailwind.css \
		-o ../assets/styles.css
	mkdir -p ./build
	go run .
	cp -rf ./build/*.html ../
	rm -rf ./build
	echo "Done!"

.PHONY: deploy
deploy: build
	./deploy.sh

.PHONY: live
live:
	@echo "Starting live reload server..."
	@golive -d ../ -p 8080
