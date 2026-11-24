package com.learnx.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class StudentActivity {
    private String _id;
    private String classroomId;
    private String studentEmail;
    private String studentName;
    private String type; // "question" or "submission"
    private String content;
    private String topic;
    private List<String> weakConcepts = new ArrayList<>();
    private int confidenceScore;
    private String aiFeedback;
    private String createdAt;

    public StudentActivity() {
        this.createdAt = Instant.now().toString();
        this.confidenceScore = 50;
        this.topic = "General";
    }

    public StudentActivity(String id, String classroomId, String studentEmail, String studentName, String type, String content) {
        this._id = id;
        this.classroomId = classroomId;
        this.studentEmail = studentEmail;
        this.studentName = studentName;
        this.type = type;
        this.content = content;
        this.topic = "General";
        this.weakConcepts = new ArrayList<>();
        this.confidenceScore = 50;
        this.aiFeedback = "";
        this.createdAt = Instant.now().toString();
    }

    public String get_id() { return _id; }
    public void set_id(String id) { this._id = id; }

    public String getClassroomId() { return classroomId; }
    public void setClassroomId(String classroomId) { this.classroomId = classroomId; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public List<String> getWeakConcepts() { return weakConcepts; }
    public void setWeakConcepts(List<String> weakConcepts) { this.weakConcepts = weakConcepts != null ? weakConcepts : new ArrayList<>(); }

    public int getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(int confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getAiFeedback() { return aiFeedback; }
    public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
