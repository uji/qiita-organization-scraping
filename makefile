zip:
	npm config set prefix ./nodejs
	npm i --prefix ./nodejs
	zip -r nodejs.zip nodejs
