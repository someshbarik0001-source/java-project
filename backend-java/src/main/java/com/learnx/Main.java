package com.learnx;

import com.sun.net.httpserver.HttpServer;
import com.learnx.controller.HttpRouter;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Main {
    private static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        String envPort = System.getenv("PORT");
        if (envPort == null || envPort.isEmpty()) {
            envPort = System.getenv("JAVA_PORT");
        }
        if (envPort != null && !envPort.isEmpty()) {
            try {
                port = Integer.parseInt(envPort);
            } catch (NumberFormatException ignored) {}
        }

        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
        server.createContext("/", new HttpRouter());
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor()); // Uses modern Java virtual threads for high concurrency

        server.start();

        System.out.println("==================================================");
        System.out.println("  Learn X Java Backend Service Started Successfully");
        System.out.println("  Port: " + port);
        System.out.println("  Java Version: " + System.getProperty("java.version"));
        System.out.println("  Health Endpoint: http://localhost:" + port + "/api/health");
        System.out.println("  Interactive Java Code Runner: http://localhost:" + port + "/api/code/run");
        System.out.println("==================================================");
    }
}
