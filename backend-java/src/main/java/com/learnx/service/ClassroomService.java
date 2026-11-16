package com.learnx.service;

import com.learnx.model.Classroom;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class ClassroomService {
    private static final ClassroomService INSTANCE = new ClassroomService();
    public static ClassroomService getInstance() { return INSTANCE; }

    private final Map<String, Classroom> classrooms = new ConcurrentHashMap<>();

    private ClassroomService() {
        // Pre-seed a sample classroom for immediate testing if empty
        Classroom sample = new Classroom(
            "class-" + UUID.randomUUID().toString().substring(0, 8),
            "CS101: Computer Science Fundamentals",
            "Computer Science",
            "CS101",
            "professor@example.com",
            "Dr. Alan Turing"
        );
        sample.getStudents().add("student@example.com");
        classrooms.put(sample.get_id(), sample);
    }

    public synchronized Classroom createClassroom(String name, String subject, String professorEmail, String professorName) {
        String code = generateClassCode();
        String id = "class-" + UUID.randomUUID().toString().substring(0, 8);
        Classroom classroom = new Classroom(id, name, subject, code, professorEmail, professorName);
        classrooms.put(id, classroom);
        return classroom;
    }

    public synchronized boolean joinClassroom(String code, String studentEmail) {
        if (code == null || studentEmail == null) return false;
        String normalizedCode = code.trim().toUpperCase();
        for (Classroom c : classrooms.values()) {
            if (c.getCode() != null && c.getCode().equalsIgnoreCase(normalizedCode)) {
                if (!c.getStudents().contains(studentEmail)) {
                    c.getStudents().add(studentEmail);
                }
                return true;
            }
        }
        return false;
    }

    public List<Classroom> listClassrooms(String role, String email) {
        List<Classroom> result = new ArrayList<>();
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";

        for (Classroom c : classrooms.values()) {
            if (normalizedEmail.isEmpty()) {
                result.add(c);
            } else if ("professor".equalsIgnoreCase(role)) {
                if (c.getProfessorEmail() != null && c.getProfessorEmail().equalsIgnoreCase(normalizedEmail)) {
                    result.add(c);
                }
            } else {
                boolean isEnrolled = c.getStudents().stream().anyMatch(s -> s.equalsIgnoreCase(normalizedEmail));
                if (isEnrolled) {
                    result.add(c);
                }
            }
        }
        return result;
    }

    public Classroom getClassroom(String id) {
        if (id == null) return null;
        return classrooms.get(id);
    }

    public List<String> getStudents(String classroomId) {
        Classroom c = classrooms.get(classroomId);
        return c != null ? c.getStudents() : Collections.emptyList();
    }

    private String generateClassCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
