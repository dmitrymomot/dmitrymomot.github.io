.PHONY: build
build:
	echo "Building the project..."
	tailwindcss \
		-c ./assets/tailwind.config.js \
		-i ./assets/tailwind.css \
		-o ../assets/styles.css
	mkdir -p ./build
	go build -ldflags "-X main.commit=$(shell git rev-parse HEAD)" -o pagebuilder
	./pagebuilder
	cp -rf ./build/*.html ../
	rm -rf ./build ./pagebuilder
	echo "Done!"

.PHONY: deploy
deploy: build
	./deploy.sh
