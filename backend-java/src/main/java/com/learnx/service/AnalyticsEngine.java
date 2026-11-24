package com.learnx.service;

import com.learnx.model.StudentActivity;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class AnalyticsEngine {
    private static final AnalyticsEngine INSTANCE = new AnalyticsEngine();
    public static AnalyticsEngine getInstance() { return INSTANCE; }

    private final Map<String, List<StudentActivity>> activitiesByClass = new ConcurrentHashMap<>();

    private AnalyticsEngine() {}

    public synchronized StudentActivity recordActivity(
        String classroomId,
        String studentEmail,
        String studentName,
        String type,
        String content,
        String topic,
        List<String> weakConcepts,
        int confidenceScore,
        String aiFeedback
    ) {
        String id = "act-" + UUID.randomUUID().toString().substring(0, 8);
        StudentActivity act = new StudentActivity(id, classroomId, studentEmail, studentName, type, content);
        act.setTopic(topic != null && !topic.isEmpty() ? topic : "General");
        act.setWeakConcepts(weakConcepts != null ? weakConcepts : new ArrayList<>());
        act.setConfidenceScore(Math.max(0, Math.min(100, confidenceScore)));
        act.setAiFeedback(aiFeedback != null ? aiFeedback : "");

        activitiesByClass.computeIfAbsent(classroomId, k -> new ArrayList<>()).add(act);
        return act;
    }

    public List<StudentActivity> getActivities(String classroomId) {
        if (classroomId == null) return Collections.emptyList();
        return activitiesByClass.getOrDefault(classroomId, Collections.emptyList());
    }

    public Map<String, Object> getClassroomAnalytics(String classroomId) {
        List<StudentActivity> acts = getActivities(classroomId);
        Map<String, Object> result = new LinkedHashMap<>();

        if (acts.isEmpty()) {
            result.put("totalActivities", 0);
            result.put("avgConfidence", 0);
            result.put("studentCount", 0);
            result.put("topTopics", Collections.emptyList());
            result.put("topWeaknesses", Collections.emptyList());
            return result;
        }

        Set<String> uniqueStudents = new HashSet<>();
        int totalConfidence = 0;
        Map<String, Integer> topicCounts = new HashMap<>();
        Map<String, Integer> weakConceptCounts = new HashMap<>();

        for (StudentActivity a : acts) {
            uniqueStudents.add(a.getStudentEmail());
            totalConfidence += a.getConfidenceScore();

            String t = a.getTopic();
            topicCounts.put(t, topicCounts.getOrDefault(t, 0) + 1);

            for (String wc : a.getWeakConcepts()) {
                weakConceptCounts.put(wc, weakConceptCounts.getOrDefault(wc, 0) + 1);
            }
        }

        int avgConfidence = acts.isEmpty() ? 0 : Math.round((float) totalConfidence / acts.size());

        List<Map<String, Object>> topTopics = new ArrayList<>();
        topicCounts.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .limit(5)
            .forEach(e -> {
                Map<String, Object> item = new HashMap<>();
                item.put("topic", e.getKey());
                item.put("count", e.getValue());
                topTopics.add(item);
            });

        List<Map<String, Object>> topWeaknesses = new ArrayList<>();
        weakConceptCounts.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .limit(8)
            .forEach(e -> {
                Map<String, Object> item = new HashMap<>();
                item.put("concept", e.getKey());
                item.put("count", e.getValue());
                topWeaknesses.add(item);
            });

        result.put("totalActivities", acts.size());
        result.put("avgConfidence", avgConfidence);
        result.put("studentCount", uniqueStudents.size());
        result.put("topTopics", topTopics);
        result.put("topWeaknesses", topWeaknesses);

        return result;
    }

    public String generateExecutiveSummary(String classroomId) {
        Map<String, Object> stats = getClassroomAnalytics(classroomId);
        int totalActivities = (int) stats.getOrDefault("totalActivities", 0);

        if (totalActivities == 0) {
            return "## 📊 Executive Summary\n\nNo student activities logged yet. A summary report will be generated once students start asking questions or submitting assignments.";
        }

        int avgConfidence = (int) stats.getOrDefault("avgConfidence", 50);
        int studentCount = (int) stats.getOrDefault("studentCount", 0);

        String phase = avgConfidence >= 75 ? "Strong" : (avgConfidence >= 55 ? "Progressing" : "Developing");

        StringBuilder sb = new StringBuilder();
        sb.append("## 📊 Executive Summary\n\n");
        sb.append("The class is currently in the **").append(phase).append("** learning phase with an overall average comprehension score of **")
          .append(avgConfidence).append("%** across ").append(studentCount).append(" active student(s) and ")
          .append(totalActivities).append(" logged learning interactions.\n\n");

        sb.append("## ⚠️ Weak Areas & Misconceptions\n\n");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> weaknesses = (List<Map<String, Object>>) stats.get("topWeaknesses");
        if (weaknesses == null || weaknesses.isEmpty()) {
            sb.append("- No critical misconceptions identified yet. Students are demonstrating consistent comprehension.\n\n");
        } else {
            for (Map<String, Object> w : weaknesses) {
                sb.append("- **").append(w.get("concept")).append("**: Identified in ")
                  .append(w.get("count")).append(" student activity log(s). Review recommended.\n");
            }
            sb.append("\n");
        }

        sb.append("## 📚 Topics for Revision\n\n");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topics = (List<Map<String, Object>>) stats.get("topTopics");
        if (topics == null || topics.isEmpty()) {
            sb.append("1. Core Lecture Principles — Recommended for ongoing review.\n\n");
        } else {
            int idx = 1;
            for (Map<String, Object> t : topics) {
                sb.append(idx++).append(". **").append(t.get("topic")).append("** (")
                  .append(t.get("count")).append(" queries/submissions) — Focus on foundational principles.\n");
            }
            sb.append("\n");
        }

        sb.append("## 🚀 Actionable Improvement Plan\n\n");
        sb.append("1. **Targeted Micro-Assessments**: Conduct a 5-minute quick diagnostic quiz on identified weak concepts during the next lecture.\n");
        sb.append("2. **Peer Review & Example Walkthroughs**: Share exemplary step-by-step solutions to address frequent question areas.\n");

        return sb.toString();
    }
}
