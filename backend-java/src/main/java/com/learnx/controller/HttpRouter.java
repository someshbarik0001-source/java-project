package com.learnx.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.learnx.model.*;
import com.learnx.service.*;
import com.learnx.util.JsonHelper;

import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

public class HttpRouter implements HttpHandler {
    private final ClassroomService classroomService = ClassroomService.getInstance();
    private final AssignmentService assignmentService = AssignmentService.getInstance();
    private final AnalyticsEngine analyticsEngine = AnalyticsEngine.getInstance();
    private final JavaCodeRunnerService codeRunnerService = JavaCodeRunnerService.getInstance();
    private final GeminiService geminiService = GeminiService.getInstance();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        // Handle CORS preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            sendCorsResponse(exchange, 204, "");
            return;
        }

        try {
            if (path.equals("/api/health") || path.equals("/health")) {
                handleHealth(exchange);
            } else if (path.equals("/api/classroom/list")) {
                handleClassroomList(exchange);
            } else if (path.equals("/api/classroom/create") && "POST".equalsIgnoreCase(method)) {
                handleClassroomCreate(exchange);
            } else if (path.equals("/api/classroom/join") && "POST".equalsIgnoreCase(method)) {
                handleClassroomJoin(exchange);
            } else if (path.equals("/api/classroom/students")) {
                handleClassroomStudents(exchange);
            } else if (path.equals("/api/assignment/list")) {
                handleAssignmentList(exchange);
            } else if (path.equals("/api/assignment/create") && "POST".equalsIgnoreCase(method)) {
                handleAssignmentCreate(exchange);
            } else if (path.equals("/api/assignment/submissions")) {
                handleAssignmentSubmissions(exchange);
            } else if (path.equals("/api/assignment/submit") && "POST".equalsIgnoreCase(method)) {
                handleAssignmentSubmit(exchange);
            } else if (path.equals("/api/analyze") && "POST".equalsIgnoreCase(method)) {
                handleAnalyze(exchange);
            } else if (path.equals("/api/analytics/classroom")) {
                handleAnalyticsClassroom(exchange);
            } else if (path.equals("/api/analytics/classroom/summary")) {
                handleAnalyticsSummary(exchange);
            } else if (path.equals("/api/ai/assistant") && "POST".equalsIgnoreCase(method)) {
                handleAiAssistant(exchange);
            } else if (path.equals("/api/code/run") && "POST".equalsIgnoreCase(method)) {
                handleCodeRun(exchange);
            } else {
                sendJsonResponse(exchange, 404, Map.of("error", "Endpoint not found: " + path));
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendJsonResponse(exchange, 500, Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    private void handleHealth(HttpExchange exchange) throws IOException {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "ok");
        resp.put("service", "Learn X Java Backend");
        resp.put("timestamp", Instant.now().toString());
        resp.put("javaVersion", System.getProperty("java.version"));
        sendJsonResponse(exchange, 200, resp);
    }

    private void handleClassroomList(HttpExchange exchange) throws IOException {
        Map<String, String> query = parseQueryParams(exchange.getRequestURI().getQuery());
        String role = query.get("role");
        String email = query.get("email");
        List<Classroom> list = classroomService.listClassrooms(role, email);
        sendJsonResponse(exchange, 200, list);
    }

    private void handleClassroomCreate(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        Map<String, Object> req = JsonHelper.parseObject(body);
        String name = (String) req.get("name");
        String subject = (String) req.get("subject");
        String professorEmail = (String) req.get("professorEmail");
        String professorName = (String) req.get("professorName");

        if (name == null || subject == null) {
            sendJsonResponse(exchange, 400, Map.of("error", "Name and subject are required"));
            return;
        }

        Classroom created = classroomService.createClassroom(name, subject, professorEmail, professorName);
        sendJsonResponse(exchange, 201, created);
    }

    private void handleClassroomJoin(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        Map<String, Object> req = JsonHelper.parseObject(body);
        String code = (String) req.get("code");
        String studentEmail = (String) req.get("studentEmail");

        boolean joined = classroomService.joinClassroom(code, studentEmail);
        if (joined) {
            sendJsonResponse(exchange, 200, Map.of("success", true, "message", "Joined successfully"));
        } else {
            sendJsonResponse(exchange, 404, Map.of("error", "Invalid classroom code"));
        }
    }

    private void handleClassroomStudents(HttpExchange exchange) throws IOException {
        Map<String, String> query = parseQueryParams(exchange.getRequestURI().getQuery());
        String classroomId = query.get("classroomId");
        List<String> students = classroomService.getStudents(classroomId);
        sendJsonResponse(exchange, 200, students);
    }

    private void handleAssignmentList(HttpExchange exchange) throws IOException {
        Map<String, String> query = parseQueryParams(exchange.getRequestURI().getQuery());
        String classroomId = query.get("classroomId");
        List<Assignment> list = assignmentService.listAssignments(classroomId);
        sendJsonResponse(exchange, 200, list);
    }

    @SuppressWarnings("unchecked")
    private void handleAssignmentCreate(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        Map<String, Object> req = JsonHelper.parseObject(body);
        String classroomId = (String) req.get("classroomId");
        String title = (String) req.get("title");
        String description = (String) req.get("description");
        String dueDate = (String) req.get("dueDate");
        List<Map<String, String>> attachments = (List<Map<String, String>>) req.get("attachments");

        if (classroomId == null || title == null) {
            sendJsonResponse(exchange, 400, Map.of("error", "ClassroomId and title are required"));
            return;
        }

        Assignment created = assignmentService.createAssignment(classroomId, title, description, dueDate, attachments);
        sendJsonResponse(exchange, 201, created);
    }

    private void handleAssignmentSubmissions(HttpExchange exchange) throws IOException {
        Map<String, String> query = parseQueryParams(exchange.getRequestURI().getQuery());
        String assignmentId = query.get("assignmentId");
        List<Submission> list = assignmentService.listSubmissions(assignmentId);
        sendJsonResponse(exchange, 200, list);
    }

    @SuppressWarnings("unchecked")
    private void handleAssignmentSubmit(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        Map<String, Object> req = JsonHelper.parseObject(body);
        String assignmentId = (String) req.get("assignmentId");
        String studentEmail = (String) req.get("studentEmail");
        String studentName = (String) req.get("studentName");
        List<Map<String, String>> attachments = (List<Map<String, String>>) req.get("attachments");

        Submission sub = assignmentService.submitAssignment(assignmentId, studentEmail, studentName, attachments);
        sendJsonResponse(exchange, 201, sub != null ? sub : Map.of("success", true));
    }

    private void handleAnalyze(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        Map<String, Object> req = JsonHelper.parseObject(body);
        String classroomId = (String) req.get("classroomId");
        String studentEmail = (String) req.get("studentEmail");
        String studentName = (String) req.get("studentName");
        String content = (String) req.get("content");
        String type = (String) req.get("type");

        // Extract topic and confidence score
        String topic = "General Studies";
        List<String> weakConcepts = new ArrayList<>();
        int confidence = 75;

        if (content != null) {
            String lower = content.toLowerCase();
            if (lower.contains("tree") || lower.contains("binary") || lower.contains("bst")) {
                topic = "Binary Trees";
                weakConcepts.add("Tree Traversal");
                weakConcepts.add("Balancing");
                confidence = 60;
            } else if (lower.contains("recursion") || lower.contains("recursive")) {
                topic = "Recursion";
                weakConcepts.add("Base Case");
                weakConcepts.add("Stack Overflow");
                confidence = 50;
            } else if (lower.contains("graph") || lower.contains("dfs") || lower.contains("bfs")) {
                topic = "Graph Algorithms";
                weakConcepts.add("Cycle Detection");
                confidence = 55;
            } else if (lower.contains("loop") || lower.contains("array")) {
                topic = "Array Iteration";
                weakConcepts.add("Index Boundary");
                confidence = 80;
            }
        }

        StudentActivity act = analyticsEngine.recordActivity(
            classroomId, studentEmail, studentName, type, content, topic, weakConcepts, confidence, "Analyzed by Learn X Java Engine"
        );

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("activityId", act.get_id());
        resp.put("topic", act.getTopic());
        resp.put("weakConcepts", act.getWeakConcepts());
        resp.put("confidenceScore", act.getConfidenceScore());
        resp.put("aiFeedback", act.getAiFeedback());

        sendJsonResponse(exchange, 201, resp);
    }

    private void handleAnalyticsClassroom(HttpExchange exchange) throws IOException {
        Map<String, String> query = parseQueryParams(exchange.getRequestURI().getQuery());
        String classroomId = query.get("classroomId");
        Map<String, Object> stats = analyticsEngine.getClassroomAnalytics(classroomId);
        sendJsonResponse(exchange, 200, stats);
    }

    private void handleAnalyticsSummary(HttpExchange exchange) throws IOException {
        Map<String, String> query = parseQueryParams(exchange.getRequestURI().getQuery());
        String classroomId = query.get("classroomId");
        String summary = analyticsEngine.generateExecutiveSummary(classroomId);
        sendJsonResponse(exchange, 200, Map.of("summary", summary));
    }

    private void handleAiAssistant(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        Map<String, Object> req = JsonHelper.parseObject(body);
        String prompt = (String) req.get("prompt");
        String role = (String) req.get("role");
        String mode = (String) req.get("mode");

        String systemPrompt = "professor".equalsIgnoreCase(role)
            ? "You are Learn X Professor Copilot. Help the professor manage classrooms, create quiz questions, and analyze student concepts."
            : "You are Learn X AI Academic Tutor. Provide clear, step-by-step guidance for student doubts and concepts.";

        if ("voice".equalsIgnoreCase(mode)) {
            systemPrompt += " Keep response to 2-3 sentences max, formatted naturally for audio playback.";
        }

        String reply = geminiService.askGemini(prompt, systemPrompt);
        sendJsonResponse(exchange, 200, Map.of("success", true, "text", reply));
    }

    private void handleCodeRun(HttpExchange exchange) throws IOException {
        String body = readRequestBody(exchange);
        Map<String, Object> req = JsonHelper.parseObject(body);
        String code = (String) req.get("code");
        String stdin = (String) req.get("stdin");

        CodeExecutionResponse resp = codeRunnerService.executeJavaCode(code, stdin);
        sendJsonResponse(exchange, 200, resp);
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;
        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            if (pair.length == 2) {
                map.put(
                    URLDecoder.decode(pair[0], StandardCharsets.UTF_8),
                    URLDecoder.decode(pair[1], StandardCharsets.UTF_8)
                );
            } else if (pair.length == 1) {
                map.put(URLDecoder.decode(pair[0], StandardCharsets.UTF_8), "");
            }
        }
        return map;
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, Object data) throws IOException {
        String json = JsonHelper.toJson(data);
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendCorsResponse(HttpExchange exchange, int statusCode, String body) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(statusCode, -1);
    }
}
