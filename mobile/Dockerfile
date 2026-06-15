FROM cirrusci/flutter:stable

WORKDIR /app

COPY pubspec.* .

RUN flutter pub get

COPY . .

CMD ["flutter", "run", "--no-sound-null-safety", "-d", "web-server", "--web-hostname", "0.0.0.0", "--web-port", "8000"]