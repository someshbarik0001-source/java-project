package com.learnx.util;

import com.learnx.model.*;

import java.util.*;

/**
 * Lightweight, zero-dependency JSON serializer and parser for Learn X Java Backend.
 * Ensures the Java backend can run standalone with any standard JDK without external JAR dependencies.
 */
public class JsonHelper {

    public static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return quote((String) obj);
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();

        if (obj instanceof Map<?, ?> map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) sb.append(",");
                sb.append(quote(String.valueOf(entry.getKey()))).append(":").append(toJson(entry.getValue()));
                first = false;
            }
            sb.append("}");
            return sb.toString();
        }

        if (obj instanceof Collection<?> col) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : col) {
                if (!first) sb.append(",");
                sb.append(toJson(item));
                first = false;
            }
            sb.append("]");
            return sb.toString();
        }

        if (obj instanceof Classroom c) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", c.get_id());
            map.put("name", c.getName());
            map.put("subject", c.getSubject());
            map.put("code", c.getCode());
            map.put("professorEmail", c.getProfessorEmail());
            map.put("professorName", c.getProfessorName());
            map.put("students", c.getStudents());
            map.put("createdAt", c.getCreatedAt());
            return toJson(map);
        }

        if (obj instanceof Assignment a) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", a.get_id());
            map.put("classroomId", a.getClassroomId());
            map.put("title", a.getTitle());
            map.put("description", a.getDescription());
            map.put("dueDate", a.getDueDate());
            map.put("attachments", a.getAttachments());
            map.put("createdAt", a.getCreatedAt());
            return toJson(map);
        }

        if (obj instanceof Submission s) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", s.get_id());
            map.put("assignmentId", s.getAssignmentId());
            map.put("studentEmail", s.getStudentEmail());
            map.put("studentName", s.getStudentName());
            map.put("attachments", s.getAttachments());
            map.put("submittedAt", s.getSubmittedAt());
            map.put("grade", s.getGrade());
            return toJson(map);
        }

        if (obj instanceof StudentActivity a) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("_id", a.get_id());
            map.put("classroomId", a.getClassroomId());
            map.put("studentEmail", a.getStudentEmail());
            map.put("studentName", a.getStudentName());
            map.put("type", a.getType());
            map.put("content", a.getContent());
            map.put("topic", a.getTopic());
            map.put("weakConcepts", a.getWeakConcepts());
            map.put("confidenceScore", a.getConfidenceScore());
            map.put("aiFeedback", a.getAiFeedback());
            map.put("createdAt", a.getCreatedAt());
            return toJson(map);
        }

        if (obj instanceof CodeExecutionResponse r) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("success", r.isSuccess());
            map.put("stdout", r.getStdout());
            map.put("stderr", r.getStderr());
            map.put("exitCode", r.getExitCode());
            map.put("executionTimeMs", r.getExecutionTimeMs());
            map.put("error", r.getError());
            return toJson(map);
        }

        return quote(obj.toString());
    }

    private static String quote(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseObject(String json) {
        if (json == null || json.trim().isEmpty()) return new LinkedHashMap<>();
        Object parsed = new Parser(json.trim()).parseValue();
        if (parsed instanceof Map<?, ?> m) return (Map<String, Object>) m;
        return new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    public static List<Object> parseList(String json) {
        if (json == null || json.trim().isEmpty()) return new ArrayList<>();
        Object parsed = new Parser(json.trim()).parseValue();
        if (parsed instanceof List<?> l) return (List<Object>) l;
        return new ArrayList<>();
    }

    private static class Parser {
        private final String src;
        private int pos = 0;

        Parser(String src) { this.src = src; }

        private void skipWhitespace() {
            while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) pos++;
        }

        private char peek() {
            skipWhitespace();
            return pos < src.length() ? src.charAt(pos) : '\0';
        }

        private char next() {
            skipWhitespace();
            return pos < src.length() ? src.charAt(pos++) : '\0';
        }

        Object parseValue() {
            char c = peek();
            if (c == '{') return parseObj();
            if (c == '[') return parseArr();
            if (c == '"') return parseStr();
            if (c == 't' || c == 'f') return parseBool();
            if (c == 'n') return parseNull();
            if (Character.isDigit(c) || c == '-') return parseNum();
            return null;
        }

        Map<String, Object> parseObj() {
            Map<String, Object> map = new LinkedHashMap<>();
            next(); // '{'
            while (true) {
                skipWhitespace();
                if (peek() == '}') { next(); break; }
                String key = parseStr();
                skipWhitespace();
                if (next() != ':') break;
                Object val = parseValue();
                map.put(key, val);
                skipWhitespace();
                char delim = peek();
                if (delim == ',') { next(); }
                else if (delim == '}') { next(); break; }
                else break;
            }
            return map;
        }

        List<Object> parseArr() {
            List<Object> list = new ArrayList<>();
            next(); // '['
            while (true) {
                skipWhitespace();
                if (peek() == ']') { next(); break; }
                Object val = parseValue();
                list.add(val);
                skipWhitespace();
                char delim = peek();
                if (delim == ',') { next(); }
                else if (delim == ']') { next(); break; }
                else break;
            }
            return list;
        }

        String parseStr() {
            next(); // '"'
            StringBuilder sb = new StringBuilder();
            while (pos < src.length()) {
                char c = src.charAt(pos++);
                if (c == '"') break;
                if (c == '\\' && pos < src.length()) {
                    char esc = src.charAt(pos++);
                    switch (esc) {
                        case '"' -> sb.append('"');
                        case '\\' -> sb.append('\\');
                        case '/' -> sb.append('/');
                        case 'b' -> sb.append('\b');
                        case 'f' -> sb.append('\f');
                        case 'n' -> sb.append('\n');
                        case 'r' -> sb.append('\r');
                        case 't' -> sb.append('\t');
                        case 'u' -> {
                            if (pos + 4 <= src.length()) {
                                String hex = src.substring(pos, pos + 4);
                                sb.append((char) Integer.parseInt(hex, 16));
                                pos += 4;
                            }
                        }
                        default -> sb.append(esc);
                    }
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }

        Boolean parseBool() {
            if (src.startsWith("true", pos)) { pos += 4; return true; }
            if (src.startsWith("false", pos)) { pos += 5; return false; }
            return false;
        }

        Object parseNull() {
            if (src.startsWith("null", pos)) { pos += 4; }
            return null;
        }

        Number parseNum() {
            int start = pos;
            if (peek() == '-') pos++;
            while (pos < src.length() && (Character.isDigit(src.charAt(pos)) || src.charAt(pos) == '.' || src.charAt(pos) == 'e' || src.charAt(pos) == 'E' || src.charAt(pos) == '+')) {
                pos++;
            }
            String numStr = src.substring(start, pos);
            if (numStr.contains(".")) return Double.parseDouble(numStr);
            try {
                return Long.parseLong(numStr);
            } catch (NumberFormatException e) {
                return Double.parseDouble(numStr);
            }
        }
    }
}
