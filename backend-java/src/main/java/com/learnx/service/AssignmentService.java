package com.learnx.service;

import com.learnx.model.Assignment;
import com.learnx.model.Submission;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class AssignmentService {
    private static final AssignmentService INSTANCE = new AssignmentService();
    public static AssignmentService getInstance() { return INSTANCE; }

    private final Map<String, Assignment> assignments = new ConcurrentHashMap<>();
    private final Map<String, List<Submission>> submissionsByAssignment = new ConcurrentHashMap<>();

    private AssignmentService() {}

    public synchronized Assignment createAssignment(String classroomId, String title, String description, String dueDate, List<Map<String, String>> attachments) {
        String id = "assign-" + UUID.randomUUID().toString().substring(0, 8);
        Assignment assignment = new Assignment(id, classroomId, title, description, dueDate, attachments);
        assignments.put(id, assignment);
        return assignment;
    }

    public List<Assignment> listAssignments(String classroomId) {
        if (classroomId == null) return Collections.emptyList();
        List<Assignment> result = new ArrayList<>();
        for (Assignment a : assignments.values()) {
            if (classroomId.equals(a.getClassroomId())) {
                result.add(a);
            }
        }
        result.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return result;
    }

    public synchronized Submission submitAssignment(String assignmentId, String studentEmail, String studentName, List<Map<String, String>> attachments) {
        if (assignmentId == null || studentEmail == null) return null;
        String id = "sub-" + UUID.randomUUID().toString().substring(0, 8);
        Submission submission = new Submission(id, assignmentId, studentEmail, studentName, attachments);

        submissionsByAssignment.computeIfAbsent(assignmentId, k -> new ArrayList<>());
        List<Submission> list = submissionsByAssignment.get(assignmentId);
        // Replace existing submission if already submitted
        list.removeIf(s -> s.getStudentEmail().equalsIgnoreCase(studentEmail));
        list.add(submission);

        return submission;
    }

    public List<Submission> listSubmissions(String assignmentId) {
        if (assignmentId == null) return Collections.emptyList();
        return submissionsByAssignment.getOrDefault(assignmentId, Collections.emptyList());
    }
}
