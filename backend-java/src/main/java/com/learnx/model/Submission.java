package com.learnx.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Submission {
    private String _id;
    private String assignmentId;
    private String studentEmail;
    private String studentName;
    private List<Map<String, String>> attachments = new ArrayList<>();
    private String submittedAt;
    private String grade;

    public Submission() {
        this.submittedAt = Instant.now().toString();
    }

    public Submission(String id, String assignmentId, String studentEmail, String studentName, List<Map<String, String>> attachments) {
        this._id = id;
        this.assignmentId = assignmentId;
        this.studentEmail = studentEmail;
        this.studentName = studentName;
        this.attachments = attachments != null ? attachments : new ArrayList<>();
        this.submittedAt = Instant.now().toString();
    }

    public String get_id() { return _id; }
    public void set_id(String id) { this._id = id; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public List<Map<String, String>> getAttachments() { return attachments; }
    public void setAttachments(List<Map<String, String>> attachments) { this.attachments = attachments != null ? attachments : new ArrayList<>(); }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
}
