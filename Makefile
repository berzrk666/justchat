.PHONY: dev stop clean logs test run

dev:
	docker compose up --build -d

stop:
	docker compose down

clean:
	docker compose down -v

logs:
	docker compose logs -f

test:
	docker compose exec server pytest

run:
	docker compose up -d
