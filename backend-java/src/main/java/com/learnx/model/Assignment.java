package com.learnx.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Assignment {
    private String _id;
    private String classroomId;
    private String title;
    private String description;
    private String dueDate;
    private List<Map<String, String>> attachments = new ArrayList<>();
    private String createdAt;

    public Assignment() {
        this.createdAt = Instant.now().toString();
    }

    public Assignment(String id, String classroomId, String title, String description, String dueDate, List<Map<String, String>> attachments) {
        this._id = id;
        this.classroomId = classroomId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.attachments = attachments != null ? attachments : new ArrayList<>();
        this.createdAt = Instant.now().toString();
    }

    public String get_id() { return _id; }
    public void set_id(String id) { this._id = id; }

    public String getClassroomId() { return classroomId; }
    public void setClassroomId(String classroomId) { this.classroomId = classroomId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public List<Map<String, String>> getAttachments() { return attachments; }
    public void setAttachments(List<Map<String, String>> attachments) { this.attachments = attachments != null ? attachments : new ArrayList<>(); }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
