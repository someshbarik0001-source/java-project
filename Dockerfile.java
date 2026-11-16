FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

COPY backend-java/ ./backend-java/

EXPOSE 8080
ENV PORT=8080

CMD ["java", "backend-java/src/main/java/com/learnx/Main.java"]
