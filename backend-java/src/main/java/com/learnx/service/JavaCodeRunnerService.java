package com.learnx.service;

import com.learnx.model.CodeExecutionResponse;

import java.io.*;
import java.nio.file.*;
import java.util.Comparator;
import java.util.concurrent.*;
import java.util.regex.*;

public class JavaCodeRunnerService {
    private static final JavaCodeRunnerService INSTANCE = new JavaCodeRunnerService();
    public static JavaCodeRunnerService getInstance() { return INSTANCE; }

    private static final int TIMEOUT_SECONDS = 5;

    private JavaCodeRunnerService() {}

    public CodeExecutionResponse executeJavaCode(String code, String stdin) {
        long startTime = System.currentTimeMillis();

        if (code == null || code.trim().isEmpty()) {
            return new CodeExecutionResponse(false, "", "No Java code provided to execute.", -1, 0, "Empty code");
        }

        // Determine class name from code or default to "Main"
        String className = extractClassName(code);
        if (className == null) {
            className = "Main";
            if (!code.contains("class Main") && !code.contains("class Solution")) {
                code = "public class Main {\n" +
                       "    public static void main(String[] args) throws Exception {\n" +
                       code + "\n" +
                       "    }\n" +
                       "}";
            }
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("learnx-java-exec-");
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, code);

            // Execute using modern Java source-file launcher: java ClassName.java
            ProcessBuilder pb = new ProcessBuilder("java", sourceFile.toAbsolutePath().toString());
            pb.directory(tempDir.toFile());

            Process process = pb.start();

            // Provide stdin if available
            if (stdin != null && !stdin.isEmpty()) {
                try (OutputStream os = process.getOutputStream()) {
                    os.write(stdin.getBytes());
                    os.flush();
                }
            } else {
                process.getOutputStream().close();
            }

            // Capture stdout & stderr asynchronously with timeout
            ExecutorService executor = Executors.newFixedThreadPool(2);
            Future<String> stdoutFuture = executor.submit(() -> readStream(process.getInputStream()));
            Future<String> stderrFuture = executor.submit(() -> readStream(process.getErrorStream()));

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            long elapsed = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                executor.shutdownNow();
                return new CodeExecutionResponse(
                    false,
                    "",
                    "Execution timed out (exceeded " + TIMEOUT_SECONDS + " seconds). Check for infinite loops.",
                    124,
                    elapsed,
                    "Timeout"
                );
            }

            String stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS);
            int exitCode = process.exitValue();
            executor.shutdown();

            boolean success = (exitCode == 0);
            return new CodeExecutionResponse(
                success,
                stdout,
                stderr,
                exitCode,
                elapsed,
                success ? null : (stderr.isEmpty() ? "Exited with code " + exitCode : stderr)
            );

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            return new CodeExecutionResponse(
                false,
                "",
                "Execution error: " + e.getMessage(),
                -1,
                elapsed,
                e.getMessage()
            );
        } finally {
            if (tempDir != null) {
                try {
                    deleteDirectoryRecursively(tempDir);
                } catch (Exception ignored) {}
            }
        }
    }

    private String extractClassName(String code) {
        Pattern pattern = Pattern.compile("public\\s+class\\s+([A-Za-z0-9_]+)");
        Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            return matcher.group(1);
        }
        pattern = Pattern.compile("class\\s+([A-Za-z0-9_]+)");
        matcher = pattern.matcher(code);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String readStream(InputStream is) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            return sb.toString().trim();
        }
    }

    private void deleteDirectoryRecursively(Path dir) throws IOException {
        if (!Files.exists(dir)) return;
        Files.walk(dir)
             .sorted(Comparator.reverseOrder())
             .map(Path::toFile)
             .forEach(File::delete);
    }
}
