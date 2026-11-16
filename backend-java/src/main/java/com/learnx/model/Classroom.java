package com.learnx.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class Classroom {
    private String _id;
    private String name;
    private String subject;
    private String code;
    private String professorEmail;
    private String professorName;
    private List<String> students = new ArrayList<>();
    private String createdAt;

    public Classroom() {
        this.createdAt = Instant.now().toString();
    }

    public Classroom(String id, String name, String subject, String code, String professorEmail, String professorName) {
        this._id = id;
        this.name = name;
        this.subject = subject;
        this.code = code;
        this.professorEmail = professorEmail;
        this.professorName = professorName;
        this.students = new ArrayList<>();
        this.createdAt = Instant.now().toString();
    }

    public String get_id() { return _id; }
    public void set_id(String id) { this._id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getProfessorEmail() { return professorEmail; }
    public void setProfessorEmail(String professorEmail) { this.professorEmail = professorEmail; }

    public String getProfessorName() { return professorName; }
    public void setProfessorName(String professorName) { this.professorName = professorName; }

    public List<String> getStudents() { return students; }
    public void setStudents(List<String> students) { this.students = students != null ? students : new ArrayList<>(); }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
