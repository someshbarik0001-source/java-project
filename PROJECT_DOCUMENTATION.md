# 📘 Learn X - Comprehensive Project & Java Architecture Documentation

> **Platform**: Learn X — AI-Powered Interactive Classroom & Code Execution Platform  
> **Technologies**: Java 21+ (Virtual Threads / Native Concurrency), Next.js 15, TypeScript, Tailwind CSS, Google Gemini 2.5 Flash  
> **Documentation Version**: 2.0  

---

## 📑 Table of Contents

1. [Executive Summary & Project Purpose](#1-executive-summary--project-purpose)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Core Capabilities & User Workflows](#3-core-capabilities--user-workflows)
4. [Where & What Java Concepts Are Used (In-Depth Technical Analysis)](#4-where--what-java-concepts-are-used-in-depth-technical-analysis)
   - [4.1 Object-Oriented Programming (OOP) & Domain Modeling](#41-object-oriented-programming-oop--domain-modeling)
   - [4.2 Architectural & Design Patterns](#42-architectural--design-patterns)
   - [4.3 Modern Concurrency & Multithreading (Java 21 Virtual Threads)](#43-modern-concurrency--multithreading-java-21-virtual-threads)
   - [4.4 Process Execution & System Sandboxing (ProcessBuilder API)](#44-process-execution--system-sandboxing-processbuilder-api)
   - [4.5 Modern Java I/O & NIO (New I/O)](#45-modern-java-io--nio-new-io)
   - [4.6 Built-in High-Concurrency HTTP Server (`com.sun.net.httpserver`)](#46-built-in-high-concurrency-http-server-comsunnethttpserver)
   - [4.7 Modern HTTP Client API (`java.net.http.HttpClient`)](#47-modern-http-client-api-javanethttphttpclient)
   - [4.8 Collections Framework, Generics & Data Structures](#48-collections-framework-generics--data-structures)
   - [4.9 Java Stream API & Functional Programming](#49-java-stream-api--functional-programming)
   - [4.10 Regular Expressions & Lexical Parsing](#410-regular-expressions--lexical-parsing)
   - [4.11 Modern Java Language Features (Java 14 through Java 22+)](#411-modern-java-language-features-java-14-through-java-22)
   - [4.12 Robust Exception Handling & Resource Safety](#412-robust-exception-handling--resource-safety)
5. [File-by-File Java Concepts Mapping Matrix](#5-file-by-file-java-concepts-mapping-matrix)
6. [Frontend & Java Backend Integration Pipeline](#6-frontend--java-backend-integration-pipeline)
7. [Deployment & Containerization Architecture](#7-deployment--containerization-architecture)
8. [Conclusion & Key Takeaways](#8-conclusion--key-takeaways)

---

## 1. Executive Summary & Project Purpose

**Learn X** is an educational platform that connects students and professors through interactive classrooms, assignments management, automated student comprehension analytics, and a multimodal AI copilot (Text, Voice, and Live Vision). 

### The Engineering Challenge
A modern educational platform requires:
1. **Ultra-responsive client interactions**: Real-time camera feeds for handwritten notes, web speech recognition/synthesis, and dynamic reactive UI.
2. **Reliable, heavy-duty server processing**: Fast code compilation, sandboxed process execution, student analytics aggregation, and high-concurrency request routing.

### The Polyglot Solution
Rather than forcing a single language into domains where it is sub-optimal, Learn X implements an **intelligent polyglot architecture**:
- **Next.js 15 (React 19, TypeScript, Tailwind CSS)** powers the presentation tier, voice input/output, and camera capture.
- **Java 21+ Backend Service (`backend-java/`)** powers the backend business logic, classroom rosters, student learning analytics engine, and the sandboxed Java code runner.
- **Google Gemini 2.5 Flash** powers multimodal intelligence across both the Java and TypeScript services.

---

## 2. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Next.js 15 Client Layer                                │
│   - Real-time Classroom & Assignment Dashboards (Student / Professor)           │
│   - Multimodal AI Copilot (Voice Web Speech API + Live Camera Stream)           │
│   - Interactive Java Code Runner Playground & Console Output                    │
└──────────────────────────┬─────────────────────────────┬────────────────────────┘
                           │ (Local API Calls)           │ (Proxied to /api/java/*)
                           ▼                             ▼
         ┌───────────────────────────────┐     ┌──────────────────────────────────────────┐
         │     Next.js API Layer         │     │         Java 21+ Backend Service         │
         │   (/app/api/*)                │     │         (Port 8080 - 0.0.0.0)            │
         │ - Auth & Session Handlers     │     ├──────────────────────────────────────────┤
         │ - Fallback In-Memory/MongoDB  │     │ ⚡ Java Virtual Threads Executor         │
         │ - Server-Side Gemini Tunnel   │     │ 🏫 Classroom & Assignment Service        │
         └───────────────┬───────────────┘     │ 📊 Learning Analytics Engine             │
                         │                     │ ☕ Sandboxed Java Code Runner Service     │
                         ▼                     │ 🤖 Java Gemini HTTP Client               │
            ┌─────────────────────────┐        │ 📦 Zero-Dependency JSON Engine           │
            │ Google Gemini 2.5 Flash │◄───────┴──────────────────────────────────────────┘
            │ Multimodal Cloud API    │
            └─────────────────────────┘
```

---

## 3. Core Capabilities & User Workflows

| Capability | Role | Implementation Layer | Technical Highlights |
|---|---|---|---|
| **Classroom Hub** | Professor & Student | Java `ClassroomService` + React UI | Dynamic 6-character class code generation (`LX-XXXX`), enrollment verification, roster lookups. |
| **Assignment Portal** | Professor & Student | Java `AssignmentService` + React UI | Assignment creation with due dates, file attachments, student submission lifecycle, and grading status. |
| **Learning Analytics** | Professor | Java `AnalyticsEngine` | Analyzes student queries, calculates class confidence indices, detects recurring weak concepts, and generates executive Markdown summaries. |
| **Java Code Sandbox** | Student & Professor | Java `JavaCodeRunnerService` + React `JavaPanel` | In-browser Java editor with algorithm presets (Fibonacci, Binary Search, Factorial), isolated compilation, and live stdout/stderr terminal output. |
| **Multimodal AI Copilot** | Student & Professor | React UI + Next.js + Java `GeminiService` | Dual-mode assistant (Professor Copilot vs Student Tutor), Speech-to-Text / Text-to-Speech audio feedback, live whiteboard video OCR. |

---

## 4. Where & What Java Concepts Are Used (In-Depth Technical Analysis)

Every line of Java code in this project was written intentionally to leverage core, intermediate, and advanced Java principles. Below is a comprehensive breakdown:

---

### 4.1 Object-Oriented Programming (OOP) & Domain Modeling

#### A. Encapsulation & Data Hiding
All domain entities protect internal state using private member fields and expose controlled access via public getters and setters:
- **`Classroom.java`** (`com.learnx.model.Classroom`): Encapsulates classroom identity (`_id`), course metadata (`name`, `subject`, `code`), professor ownership (`professorEmail`, `professorName`), and enrolled student list (`List<String> students`).
- **`Assignment.java`** (`com.learnx.model.Assignment`): Encapsulates assignments with classroom associations, deadlines, and multi-file attachment structures (`List<Map<String, String>> attachments`).
- **`Submission.java`** (`com.learnx.model.Submission`): Models student homework submissions, submission timestamps, and grade states.
- **`StudentActivity.java`** (`com.learnx.model.StudentActivity`): Encapsulates student diagnostic signals—questions, quiz responses, extracted weak concepts, and confidence scores (0–100%).

#### B. Data Transfer Objects (DTOs)
- **`CodeExecutionRequest.java`**: Strongly-typed payload receiving raw Java source code, standard input (`stdin`), and execution options.
- **`CodeExecutionResponse.java`**: Structured response encapsulating execution outcome (`success`), standard output (`stdout`), standard error (`stderr`), process exit code (`exitCode`), execution duration in milliseconds (`executionTimeMs`), and error messages.

#### C. Constructor Overloading & Defensive State Initialization
- Default constructors auto-initialize temporal state using ISO-8601 timestamps:
  ```java
  public Classroom() {
      this.createdAt = Instant.now().toString();
  }
  ```
- Parameterized constructors ensure valid initial references, defensively allocating internal collections (e.g. `this.students = new ArrayList<>()`) to eliminate `NullPointerException` risks.

---

### 4.2 Architectural & Design Patterns

#### A. Singleton Pattern (Thread-Safe Lazy/Eager Instances)
All service engines enforce a single, shared lifecycle using the Singleton Pattern:
- **Where**:
  - `ClassroomService.getInstance()`
  - `AssignmentService.getInstance()`
  - `AnalyticsEngine.getInstance()`
  - `JavaCodeRunnerService.getInstance()`
  - `GeminiService.getInstance()`
- **Implementation**:
  ```java
  private static final ClassroomService INSTANCE = new ClassroomService();
  public static ClassroomService getInstance() { return INSTANCE; }
  private ClassroomService() { /* private to prevent direct instantiation */ }
  ```

#### B. Front Controller / Dispatcher Pattern
- **Where**: `HttpRouter.java`
- Implements `com.sun.net.httpserver.HttpHandler`. Acts as a centralized controller that intercepts all incoming HTTP requests, extracts HTTP methods, parses URI paths, manages CORS preflight headers, and dispatches to granular private handlers (`handleHealth`, `handleClassroomCreate`, `handleCodeRun`, etc.).

#### C. Recursive Descent Parser Pattern
- **Where**: `JsonHelper.java` (`Parser` inner class)
- Implements a recursive-descent syntax parser from scratch. Demonstrates compiler design fundamentals:
  - Lexical token scanning (`peek()`, `next()`, `skipWhitespace()`).
  - Recursive parsing of JSON composite types (`parseObj()`, `parseArr()`, `parseStr()`, `parseNum()`, `parseBool()`, `parseNull()`).
  - Eliminates external dependencies (like Jackson or Gson JARs), allowing the application to compile and boot instantly in constrained environments.

#### D. Builder Pattern
- **Where**: `GeminiService.java`
- Leverages fluent builder APIs for modern Java networking:
  ```java
  this.httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(10))
      .build();

  HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create(endpoint))
      .header("Content-Type", "application/json")
      .timeout(Duration.ofSeconds(20))
      .POST(HttpRequest.BodyPublishers.ofString(requestJson))
      .build();
  ```

---

### 4.3 Modern Concurrency & Multithreading (Java 21 Virtual Threads)

#### A. Virtual Threads (Project Loom / JEP 444)
- **Where**: `Main.java` (Line 27)
- **Code**:
  ```java
  server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
  ```
- **Concept & Impact**:
  Traditional Java thread pools allocate heavyweight OS-level kernel threads (1MB stack each), limiting concurrency to a few hundred or thousand threads. 
  By configuring Java 21's `VirtualThreadPerTaskExecutor`, the HTTP server spawns a lightweight virtual thread per incoming request. Virtual threads are managed entirely in user space by the JVM, unmounting during blocking I/O (such as HTTP calls to Gemini or process waiting). This allows the Learn X backend to handle tens of thousands of concurrent classroom requests with negligible memory and CPU overhead.

#### B. Asynchronous Stream Draining with Thread Pools & Futures
- **Where**: `JavaCodeRunnerService.java` (Lines 61–85)
- **Concept & Impact**:
  When executing an external subprocess, operating system pipe buffers can easily fill up if `stdout` or `stderr` are not consumed concurrently, causing the child process to hang indefinitely (deadlock).
  To solve this, a dedicated `ExecutorService` submits parallel tasks returning `Future<String>`:
  ```java
  ExecutorService executor = Executors.newFixedThreadPool(2);
  Future<String> stdoutFuture = executor.submit(() -> readStream(process.getInputStream()));
  Future<String> stderrFuture = executor.submit(() -> readStream(process.getErrorStream()));
  ```
  Both output streams are drained in parallel while `process.waitFor(...)` monitors process termination.

#### C. Thread Synchronization & Concurrent Data Structures
- **`ConcurrentHashMap`**:
  - Used in `ClassroomService` (`Map<String, Classroom> classrooms`), `AssignmentService` (`submissionsByAssignment`), and `AnalyticsEngine` (`activitiesByClass`).
  - Guarantees thread-safe lock-striping for read operations without blocking concurrent readers.
- **`synchronized` Methods**:
  - Used on critical write paths (`createClassroom`, `joinClassroom`, `submitAssignment`, `recordActivity`) to guarantee sequential integrity during state mutations.
- **`computeIfAbsent` Atomic Composition**:
  - Automatically initializes per-classroom list buckets in a race-condition-free manner:
    ```java
    activitiesByClass.computeIfAbsent(classroomId, k -> new ArrayList<>()).add(act);
    ```

---

### 4.4 Process Execution & System Sandboxing (ProcessBuilder API)

- **Where**: `JavaCodeRunnerService.java` (Lines 45–97)
- **Concepts Used**:
  1. **Subprocess Spawning**: Uses `java.lang.ProcessBuilder` to launch an isolated JVM instance:
     ```java
     ProcessBuilder pb = new ProcessBuilder("java", sourceFile.toAbsolutePath().toString());
     pb.directory(tempDir.toFile());
     Process process = pb.start();
     ```
  2. **Inter-Process Communication (IPC) via Pipes**:
     - Writing to child `stdin` through `process.getOutputStream()`.
     - Reading child `stdout` via `process.getInputStream()`.
     - Reading child `stderr` via `process.getErrorStream()`.
  3. **Guarded Process Lifecycle & Timeout Protection**:
     - Prevents student infinite loops (`while(true)`) or deadlocks by enforcing a 5-second hard timeout:
       ```java
       boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
       if (!finished) {
           process.destroyForcibly(); // Sends SIGKILL
           // Returns HTTP timeout response
       }
       ```
  4. **Exit Code & Telemetry Capture**:
     - Extracts process exit status (`process.exitValue()`, where `0` = success).
     - Tracks millisecond-precision execution duration: `System.currentTimeMillis() - startTime`.

---

### 4.5 Modern Java I/O & NIO (New I/O)

- **Where**: `JavaCodeRunnerService.java`, `HttpRouter.java`
- **Concepts Used**:
  1. **NIO Paths and Files API (`java.nio.file.*`)**:
     - Creating isolated temporary directory sandboxes:
       ```java
       Path tempDir = Files.createTempDirectory("learnx-java-exec-");
       ```
     - Resolving path targets and atomic string writes:
       ```java
       Path sourceFile = tempDir.resolve(className + ".java");
       Files.writeString(sourceFile, code);
       ```
  2. **Stream-Based Recursive Directory Cleanup**:
     - Ensures temporary code files and compiled artifacts are completely wiped from disk in the `finally` block using Java Streams:
       ```java
       Files.walk(dir)
            .sorted(Comparator.reverseOrder())
            .map(Path::toFile)
            .forEach(File::delete);
       ```
  3. **Buffered Readers & Standard Charsets**:
     - Efficiently reads byte streams into text with `BufferedReader`, `InputStreamReader`, and explicit `StandardCharsets.UTF_8` encoding to prevent platform-dependent encoding bugs.

---

### 4.6 Built-in High-Concurrency HTTP Server (`com.sun.net.httpserver`)

- **Where**: `Main.java`, `HttpRouter.java`
- **Concepts Used**:
  1. **Embedded Web Server**:
     - Uses Java's lightweight built-in HTTP server (`HttpServer.create(...)`), eliminating heavy application server containers (like Tomcat or WildFly).
     - Binds cleanly to all network interfaces (`0.0.0.0`) on dynamic or configurable ports (`System.getenv("PORT")`).
  2. **HTTP Exchange Management**:
     - Inspects request method (`exchange.getRequestMethod()`) and URL path (`exchange.getRequestURI().getPath()`).
     - Reads binary request bodies (`exchange.getRequestBody().readAllBytes()`).
     - Sets HTTP response headers (`Content-Type`, `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`).
     - Sends explicit response header codes and body byte lengths (`exchange.sendResponseHeaders(statusCode, bytes.length)`).
  3. **Cross-Origin Resource Sharing (CORS)**:
     - Handles HTTP `OPTIONS` preflight checks returning HTTP `204 No Content` to enable browser requests across different ports or origins.
  4. **Query Parameter Parsing & URL Decoding**:
     - Parses query strings (`?classroomId=...&role=...`) using `URLDecoder.decode(param, StandardCharsets.UTF_8)`.

---

### 4.7 Modern HTTP Client API (`java.net.http.HttpClient`)

- **Where**: `GeminiService.java`
- **Concepts Used**:
  1. **Standard Java 11+ Reactive HTTP Client**:
     - Uses `java.net.http.HttpClient` with configured connection timeouts (`Duration.ofSeconds(10)`).
  2. **HTTP Request Construction**:
     - `HttpRequest.newBuilder()` configured with HTTP POST, target URI, JSON headers, and `HttpRequest.BodyPublishers.ofString(...)`.
  3. **Synchronous Response Handling with Body Handlers**:
     - `httpClient.send(request, HttpResponse.BodyHandlers.ofString())` returns strongly-typed `HttpResponse<String>`.
     - Inspects HTTP status codes (`response.statusCode() == 200`) and delegates payload parsing to `JsonHelper`.

---

### 4.8 Collections Framework, Generics & Data Structures

Across all Java classes in `com.learnx`:
- **Lists (`List`, `ArrayList`, `CopyOnWriteArrayList`)**:
  - `List<Classroom>`, `List<Assignment>`, `List<Submission>`, `List<String> weakConcepts`.
- **Maps (`Map`, `HashMap`, `LinkedHashMap`, `ConcurrentHashMap`)**:
  - `LinkedHashMap`: Used throughout `HttpRouter` and `JsonHelper` to preserve insertion order for JSON keys, ensuring readable and deterministic client responses.
  - `HashMap`: Used for fast \(O(1)\) frequency counting of topics and weak concepts in `AnalyticsEngine`.
  - `ConcurrentHashMap`: Thread-safe associative state store for classrooms and assignments.
- **Sets (`Set`, `HashSet`)**:
  - Used in `AnalyticsEngine` (`uniqueStudents.add(a.getStudentEmail())`) to count unique active students participating in a classroom.
- **Generics & Type Safety**:
  - Generic collections prevent runtime `ClassCastException` while maintaining clean API contracts.
  - Careful usage of wildcard generics (`Map<?, ?>`, `Collection<?>`) in `JsonHelper.toJson(Object obj)`.
  - Empty collection optimizations: `Collections.emptyList()` to avoid unnecessary object allocations.

---

### 4.9 Java Stream API & Functional Programming

- **Where**: `AnalyticsEngine.java`, `ClassroomService.java`, `AssignmentService.java`, `JavaCodeRunnerService.java`
- **Concepts Used**:
  1. **Predicate Matching with `anyMatch`**:
     - In `ClassroomService.java`: Check if a student is enrolled in a classroom:
       ```java
       boolean isEnrolled = c.getStudents().stream().anyMatch(s -> s.equalsIgnoreCase(normalizedEmail));
       ```
  2. **Map Transformation & Frequency Sorting**:
     - In `AnalyticsEngine.java`: Ranks weak concepts and topics by frequency:
       ```java
       weakConceptCounts.entrySet().stream()
           .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
           .limit(8)
           .forEach(e -> {
               Map<String, Object> item = new HashMap<>();
               item.put("concept", e.getKey());
               item.put("count", e.getValue());
               topWeaknesses.add(item);
           });
       ```
  3. **Comparator Reverse Ordering & Method References**:
     - In `AssignmentService.java`: Sorting assignments by creation timestamp descending:
       ```java
       result.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
       ```
     - In `JavaCodeRunnerService.java`: Walking directory trees and deleting with method references:
       ```java
       Files.walk(dir)
            .sorted(Comparator.reverseOrder())
            .map(Path::toFile)
            .forEach(File::delete);
       ```

---

### 4.10 Regular Expressions & Lexical Parsing

- **Where**: `JavaCodeRunnerService.java` (Lines 117–129)
- **Concepts Used**:
  - **`java.util.regex.Pattern` and `Matcher`**:
    - Automatically discovers the declared class name from arbitrary student code:
      ```java
      Pattern pattern = Pattern.compile("public\\s+class\\s+([A-Za-z0-9_]+)");
      Matcher matcher = pattern.matcher(code);
      if (matcher.find()) {
          return matcher.group(1);
      }
      ```
    - Allows students to write code with `public class Solution`, `class CustomAlgorithm`, or raw snippet statements; the service wraps statements into a `public class Main` wrapper automatically if no class is detected.

---

### 4.11 Modern Java Language Features (Java 14 through Java 22+)

1. **Pattern Matching for `instanceof` (JEP 394)**:
   - Used extensively in `JsonHelper.java` to eliminate verbose type-casting:
     ```java
     if (obj instanceof Map<?, ?> map) { ... }
     if (obj instanceof Classroom c) { ... }
     if (obj instanceof CodeExecutionResponse r) { ... }
     ```
2. **Switch Expressions with Arrow Syntax (`->`)**:
   - Used in character escaping:
     ```java
     switch (c) {
         case '"' -> sb.append("\\\"");
         case '\\' -> sb.append("\\\\");
         case '\n' -> sb.append("\\n");
         default  -> sb.append(c);
     }
     ```
3. **Single-File & Multi-File Source-Code Programs (JEP 330 & JEP 458)**:
   - Learn X leverages Java's modern source-file launcher (`java Main.java`).
   - The Java runtime compiles and links multi-file packages directly in memory on boot, eliminating the requirement for pre-compiled `.class` or `.jar` files during deployment and local execution.

---

### 4.12 Robust Exception Handling & Resource Safety

1. **Try-with-resources (`AutoCloseable`)**:
   - Automatic closure of I/O streams and buffers, preventing file handle leaks:
     ```java
     try (InputStream is = exchange.getRequestBody()) {
         return new String(is.readAllBytes(), StandardCharsets.UTF_8);
     }
     ```
     ```java
     try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
         // Auto-closed at end of block
     }
     ```
2. **Graceful Error Translation**:
   - Unhandled exceptions are caught at the router boundary and mapped to structured JSON error responses with proper HTTP status codes (400, 404, 500) rather than terminating the server.
3. **Fail-Safe Sandbox Cleanup**:
   - Sandboxed source files are cleaned up in `finally` blocks even if code compilation fails or execution times out.

---

## 5. File-by-File Java Concepts Mapping Matrix

| File Path | Role | Key Java Concepts Applied |
|---|---|---|
| [`Main.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/Main.java) | Application Entrypoint | JEP 444 Virtual Threads, `Executors.newVirtualThreadPerTaskExecutor()`, `HttpServer`, Environment variables (`System.getenv`), Port parsing, System properties (`System.getProperty`). |
| [`HttpRouter.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/controller/HttpRouter.java) | REST Front Controller | `HttpHandler`, `HttpExchange`, CORS negotiation, REST routing, Query string tokenization, `URLDecoder`, UTF-8 Streams, HTTP status codes (200, 201, 204, 400, 404, 500). |
| [`ClassroomService.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/service/ClassroomService.java) | Classroom Business Logic | Singleton Pattern, `ConcurrentHashMap`, `synchronized` methods, Random alphanumeric code generation, Stream filtering with `anyMatch`. |
| [`AssignmentService.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/service/AssignmentService.java) | Homework & Submissions | Singleton Pattern, Multi-bucket Concurrent Maps, `computeIfAbsent`, List deduplication with `removeIf`, Lambda sorting with `compareTo`. |
| [`AnalyticsEngine.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/service/AnalyticsEngine.java) | Learning Diagnostics | Frequency mapping, `Set` uniqueness, Stream aggregation, descending sorting (`b.compareTo(a)`), Stream `limit`, Markdown report generation via `StringBuilder`. |
| [`JavaCodeRunnerService.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/service/JavaCodeRunnerService.java) | Code Sandbox Engine | `ProcessBuilder`, `Process`, Subprocess IPC pipes, Regex `Pattern` & `Matcher`, `ExecutorService`, `Future`, `Files.createTempDirectory`, Recursive cleanup with `Files.walk` and `Comparator.reverseOrder`. |
| [`GeminiService.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/service/GeminiService.java) | Cloud AI Integration | Modern `HttpClient` (Java 11+), `HttpRequest.Builder`, `Duration` timeouts, HTTP POST payload serialization, fallback logic. |
| [`JsonHelper.java`](file:///home/lav/Documents/expo1-main/backend-java/src/main/java/com/learnx/util/JsonHelper.java) | Zero-Dependency JSON Engine | Recursive descent parsing, Lexical analysis (`peek`/`next`), Pattern matching for `instanceof`, Arrow switch expressions, Unicode hex escaping (`\uXXXX`). |
| Model Classes (`Classroom`, `Assignment`, `Submission`, `StudentActivity`, `CodeExecutionRequest`, `CodeExecutionResponse`) | Domain Models & DTOs | Encapsulation, JavaBeans getter/setter conventions, `Instant.now()` ISO timestamps, Defensive copy constructors, Generics (`List<T>`, `Map<K, V>`). |

---

## 6. Frontend & Java Backend Integration Pipeline

The Next.js frontend seamlessly talks to the Java backend via three coordinated mechanisms:

### 1. Reverse Proxy Rewrites (`next.config.ts`)
```typescript
async rewrites() {
  const javaBackendUrl = process.env.JAVA_BACKEND_URL || "http://127.0.0.1:8080";
  return [
    {
      source: "/api/java/:path*",
      destination: `${javaBackendUrl}/api/:path*`,
    },
  ];
}
```
*Why this matters*: Browsers make same-origin requests to `/api/java/*`, bypassing CORS issues and hiding internal backend network topology.

### 2. Typed Client SDK (`lib/javaBackendClient.ts`)
Exposes strongly-typed helper functions for frontend components:
- `executeJavaCode(code, stdin)`: Executes code and formats execution telemetry.
- `checkJavaBackendHealth()`: Verifies Java service connectivity and displays runtime version.

### 3. Interactive Code Sandbox UI (`components/ui/tabs-10.tsx`)
- Embeds a full code editor directly in the multimodal AI Assistant drawer.
- Provides starter presets (*Fibonacci*, *Binary Search*, *Recursion Factorial*).
- Renders live terminal outputs with syntax coloration, exit code badges, and millisecond execution timers.

---

## 7. Deployment & Containerization Architecture

Learn X supports multiple deployment strategies:

### Option A: Local / Direct Script Launch
- Start Java Backend:
  ```bash
  npm run server:java
  # or: bash run-java-backend.sh
  ```
- Start Next.js Frontend:
  ```bash
  npm run dev
  ```

### Option B: Multi-Container Docker Deployment (`docker-compose.yml`)
Orchestrates both services with health checks and private networking:
- **`app` container** (Next.js): Exposed on port `3000` (or `7860`).
- **`java-backend` container** ([`Dockerfile.java`](file:///home/lav/Documents/expo1-main/Dockerfile.java)): Runs OpenJDK on port `8080`.

---

## 8. Conclusion & Key Takeaways

1. **Strategic Technology Placement**: Java is utilized where its strengths excel—multithreaded backend services, memory-safe process execution, and high-throughput computational analytics.
2. **Modern Java Idioms**: The codebase is not legacy Java; it actively uses modern Java enhancements including **Virtual Threads (Project Loom)**, **Pattern Matching**, **Modern HttpClient**, **Stream Pipelines**, and **JEP 458 Source Launching**.
3. **Zero External Runtime Bloat**: The Java backend runs with zero third-party JAR dependencies on standard modern JDKs, making it lightweight, fast-booting, and cloud-ready.

